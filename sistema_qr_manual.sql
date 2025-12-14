-- ============================================================================
-- SISTEMA DE CÓDIGOS QR MANUALES
-- ============================================================================
-- Usuario ingresa código manual corto (ej: anip120, ani05, pulp80)
-- Sistema genera QR completo: PROD-[CODIGO_MANUAL]-[SECUENCIAL]
-- ============================================================================

-- PASO 1: Agregar columna codigo_manual
ALTER TABLE inventario_productos 
ADD COLUMN IF NOT EXISTS codigo_manual VARCHAR(20);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_inventario_codigo_manual ON inventario_productos(codigo_manual);

-- PASO 2: Función para generar código QR desde código manual
CREATE OR REPLACE FUNCTION generar_qr_desde_manual(p_codigo_manual VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    v_secuencial INTEGER;
    v_codigo_qr VARCHAR(50);
BEGIN
    -- Obtener siguiente número secuencial para este código manual
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

-- PASO 3: Trigger para generar código QR automáticamente
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

-- Crear nuevo trigger
CREATE TRIGGER before_insert_generar_qr_manual
BEFORE INSERT ON inventario_productos
FOR EACH ROW
EXECUTE FUNCTION trigger_generar_qr_manual();

-- PASO 4: Función auxiliar para buscar producto por código manual
CREATE OR REPLACE FUNCTION buscar_producto_por_codigo_manual(p_codigo_manual VARCHAR)
RETURNS TABLE (
    id_inventario INTEGER,
    codigo_qr VARCHAR,
    nombre_producto VARCHAR,
    precio_venta NUMERIC,
    stock_actual INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ip.id_inventario,
        ip.codigo_qr,
        ip.nombre_producto,
        ip.precio_venta,
        ip.stock_actual
    FROM inventario_productos ip
    WHERE ip.codigo_manual = LOWER(p_codigo_manual)
    ORDER BY ip.creado_en DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- PASO 5: Vista actualizada de inventario con código manual
DROP VIEW IF EXISTS vista_inventario_completo;
CREATE OR REPLACE VIEW vista_inventario_completo AS
SELECT 
    ip.id_inventario,
    ip.codigo_manual,
    ip.codigo_qr,
    ip.codigo_interno,
    ip.nombre_producto,
    ip.categoria,
    ip.material,
    ip.unidad,
    ip.origen,
    ip.costo_unitario,
    ip.precio_venta,
    ip.precio_mayorista,
    ip.precio_oferta,
    ip.stock_actual,
    ip.stock_minimo,
    CASE 
        WHEN ip.stock_actual <= ip.stock_minimo THEN true 
        ELSE false 
    END as stock_bajo,
    ip.foto_url,
    ip.activo,
    ip.ultima_actualizacion,
    ip.creado_en
FROM inventario_productos ip
WHERE ip.activo = true
ORDER BY ip.codigo_manual, ip.codigo_qr;

-- PASO 6: Verificar estructura
SELECT 
    column_name, 
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'inventario_productos'
  AND column_name IN ('codigo_manual', 'codigo_qr', 'nombre_producto')
ORDER BY ordinal_position;

-- ============================================================================
-- PRUEBAS DE EJEMPLO
-- ============================================================================

-- Ejemplo 1: Insertar producto con código manual
/*
INSERT INTO inventario_productos (
    codigo_manual,
    nombre_producto,
    categoria,
    material,
    precio_venta,
    stock_actual,
    stock_minimo,
    costo_unitario
) VALUES (
    'anip120',
    'Anillo de Plata Simple',
    'Anillo',
    'Plata',
    120.00,
    5,
    3,
    60.00
);

-- Resultado esperado:
-- codigo_manual: anip120
-- codigo_qr: PROD-ANIP120-00001
*/

-- Ejemplo 2: Insertar otro del mismo grupo
/*
INSERT INTO inventario_productos (
    codigo_manual,
    nombre_producto,
    categoria,
    material,
    precio_venta,
    stock_actual,
    stock_minimo,
    costo_unitario
) VALUES (
    'anip120',
    'Anillo de Plata Simple',
    'Anillo',
    'Plata',
    120.00,
    3,
    3,
    60.00
);

-- Resultado esperado:
-- codigo_manual: anip120
-- codigo_qr: PROD-ANIP120-00002
*/

-- ============================================================================
-- LISTO! Sistema de códigos QR manuales implementado
-- ============================================================================
