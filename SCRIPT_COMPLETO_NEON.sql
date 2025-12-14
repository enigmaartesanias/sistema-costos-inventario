-- ============================================================================
-- SCRIPT COMPLETO: Agregar TODAS las columnas necesarias
-- ============================================================================
-- Este script agrega TODAS las columnas que necesita el formulario
-- ============================================================================

-- Agregar todas las columnas necesarias
DO $$ 
BEGIN
    -- codigo_qr (la columna principal que faltaba!)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventario_productos' AND column_name='codigo_qr') THEN
        ALTER TABLE inventario_productos ADD COLUMN codigo_qr VARCHAR(50) UNIQUE;
        RAISE NOTICE 'Columna codigo_qr agregada';
    ELSE
        RAISE NOTICE 'Columna codigo_qr ya existe';
    END IF;

    -- codigo_manual
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventario_productos' AND column_name='codigo_manual') THEN
        ALTER TABLE inventario_productos ADD COLUMN codigo_manual VARCHAR(20);
        RAISE NOTICE 'Columna codigo_manual agregada';
    ELSE
        RAISE NOTICE 'Columna codigo_manual ya existe';
    END IF;

    -- nombre_producto
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventario_productos' AND column_name='nombre_producto') THEN
        ALTER TABLE inventario_productos ADD COLUMN nombre_producto VARCHAR(150);
        RAISE NOTICE 'Columna nombre_producto agregada';
    ELSE
        RAISE NOTICE 'Columna nombre_producto ya existe';
    END IF;

    -- categoria
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventario_productos' AND column_name='categoria') THEN
        ALTER TABLE inventario_productos ADD COLUMN categoria VARCHAR(50);
        RAISE NOTICE 'Columna categoria agregada';
    ELSE
        RAISE NOTICE 'Columna categoria ya existe';
    END IF;

    -- material
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventario_productos' AND column_name='material') THEN
        ALTER TABLE inventario_productos ADD COLUMN material VARCHAR(50);
        RAISE NOTICE 'Columna material agregada';
    ELSE
        RAISE NOTICE 'Columna material ya existe';
    END IF;

    -- unidad
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventario_productos' AND column_name='unidad') THEN
        ALTER TABLE inventario_productos ADD COLUMN unidad VARCHAR(20) DEFAULT 'Unidad';
        RAISE NOTICE 'Columna unidad agregada';
    ELSE
        RAISE NOTICE 'Columna unidad ya existe';
    END IF;

    -- origen
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventario_productos' AND column_name='origen') THEN
        ALTER TABLE inventario_productos ADD COLUMN origen VARCHAR(20) DEFAULT 'Comprado';
        RAISE NOTICE 'Columna origen agregada';
    ELSE
        RAISE NOTICE 'Columna origen ya existe';
    END IF;

    -- precio_mayorista
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventario_productos' AND column_name='precio_mayorista') THEN
        ALTER TABLE inventario_productos ADD COLUMN precio_mayorista NUMERIC(10, 2);
        RAISE NOTICE 'Columna precio_mayorista agregada';
    ELSE
        RAISE NOTICE 'Columna precio_mayorista ya existe';
    END IF;

    -- precio_oferta
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventario_productos' AND column_name='precio_oferta') THEN
        ALTER TABLE inventario_productos ADD COLUMN precio_oferta NUMERIC(10, 2);
        RAISE NOTICE 'Columna precio_oferta agregada';
    ELSE
        RAISE NOTICE 'Columna precio_oferta ya existe';
    END IF;

    -- foto_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventario_productos' AND column_name='foto_url') THEN
        ALTER TABLE inventario_productos ADD COLUMN foto_url TEXT;
        RAISE NOTICE 'Columna foto_url agregada';
    ELSE
        RAISE NOTICE 'Columna foto_url ya existe';
    END IF;

    -- activo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventario_productos' AND column_name='activo') THEN
        ALTER TABLE inventario_productos ADD COLUMN activo BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Columna activo agregada';
    ELSE
        RAISE NOTICE 'Columna activo ya existe';
    END IF;

END $$;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_inventario_codigo_qr ON inventario_productos(codigo_qr);
CREATE INDEX IF NOT EXISTS idx_inventario_codigo_manual ON inventario_productos(codigo_manual);

-- Función para generar código QR desde código manual
CREATE OR REPLACE FUNCTION generar_qr_desde_manual(p_codigo_manual VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    v_secuencial INTEGER;
    v_codigo_qr VARCHAR(50);
BEGIN
    -- Obtener siguiente número secuencial
    SELECT COALESCE(
        MAX(
            CAST(
                SUBSTRING(codigo_qr FROM LENGTH('PROD-' || UPPER(p_codigo_manual) || '-') + 1)
                AS INTEGER
            )
        ),
        0
    ) + 1
    INTO v_secuencial
    FROM inventario_productos
    WHERE codigo_manual = LOWER(p_codigo_manual);
    
    -- Generar código QR completo
    v_codigo_qr := 'PROD-' || UPPER(p_codigo_manual) || '-' || LPAD(v_secuencial::TEXT, 5, '0');
    
    RETURN v_codigo_qr;
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar código QR automáticamente
CREATE OR REPLACE FUNCTION trigger_generar_qr_manual()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo generar si se proporcionó codigo_manual y no hay codigo_qr
    IF NEW.codigo_manual IS NOT NULL AND (NEW.codigo_qr IS NULL OR NEW.codigo_qr = '') THEN
        -- Convertir codigo_manual a minúsculas
        NEW.codigo_manual := LOWER(NEW.codigo_manual);
        
        -- Generar código QR
        NEW.codigo_qr := generar_qr_desde_manual(NEW.codigo_manual);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS before_insert_generar_qr_manual ON inventario_productos;

-- Crear trigger
CREATE TRIGGER before_insert_generar_qr_manual
BEFORE INSERT ON inventario_productos
FOR EACH ROW
EXECUTE FUNCTION trigger_generar_qr_manual();

-- Verificar que todo se creó correctamente
SELECT 'Script ejecutado exitosamente!' as mensaje;

-- Mostrar todas las columnas
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'inventario_productos'
ORDER BY ordinal_position;

-- ============================================================================
-- LISTO! Ahora recarga tu aplicación e intenta guardar un producto
-- ============================================================================
