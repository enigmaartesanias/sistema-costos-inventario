-- ============================================================================
-- SOLO AGREGAR LO NUEVO (sin borrar nada existente)
-- ============================================================================
-- Ejecutar esto en Neon SQL Editor
-- Agrega solo las nuevas estructuras sin tocar datos existentes
-- ============================================================================

-- PASO 1: Agregar campos nuevos a produccion_taller
DO $$ 
BEGIN
    -- Agregar es_pedido si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='produccion_taller' AND column_name='es_pedido'
    ) THEN
        ALTER TABLE produccion_taller 
        ADD COLUMN es_pedido BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Campo es_pedido agregado';
    ELSE
        RAISE NOTICE 'Campo es_pedido ya existe';
    END IF;

    -- Agregar id_pedido si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='produccion_taller' AND column_name='id_pedido'
    ) THEN
        ALTER TABLE produccion_taller 
        ADD COLUMN id_pedido INTEGER NULL;
        RAISE NOTICE 'Campo id_pedido agregado';
    ELSE
        RAISE NOTICE 'Campo id_pedido ya existe';
    END IF;
END $$;

-- Actualizar registros existentes
UPDATE produccion_taller 
SET es_pedido = FALSE 
WHERE es_pedido IS NULL;

-- PASO 2: Crear tabla inventario_productos si no existe
CREATE TABLE IF NOT EXISTS inventario_productos (
    id_inventario SERIAL PRIMARY KEY,
    id_producto INTEGER REFERENCES productos(id_producto) ON DELETE CASCADE,
    codigo_interno VARCHAR(50) UNIQUE NOT NULL,
    costo_unitario NUMERIC(10, 2) DEFAULT 0,
    precio_venta NUMERIC(10, 2) NOT NULL,
    stock_actual INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 5,
    precios_adicionales JSONB,
    ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PASO 3: Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_inventario_producto ON inventario_productos(id_producto);
CREATE INDEX IF NOT EXISTS idx_inventario_codigo ON inventario_productos(codigo_interno);
CREATE INDEX IF NOT EXISTS idx_inventario_stock_bajo ON inventario_productos(stock_actual, stock_minimo);

-- PASO 4: Crear función y trigger
DROP TRIGGER IF EXISTS trigger_actualizar_inventario ON produccion_taller;
DROP FUNCTION IF EXISTS actualizar_inventario_produccion();

CREATE OR REPLACE FUNCTION actualizar_inventario_produccion()
RETURNS TRIGGER AS $$
DECLARE
    v_producto_existe INTEGER;
BEGIN
    IF NEW.es_pedido = FALSE THEN
        SELECT COUNT(*) INTO v_producto_existe
        FROM inventario_productos 
        WHERE id_producto = NEW.id_producto;
        
        IF v_producto_existe > 0 THEN
            UPDATE inventario_productos
            SET stock_actual = stock_actual + NEW.cantidad_producida,
                costo_unitario = (
                    (costo_unitario * stock_actual + NEW.costo_unitario * NEW.cantidad_producida) 
                    / NULLIF(stock_actual + NEW.cantidad_producida, 0)
                ),
                ultima_actualizacion = CURRENT_TIMESTAMP
            WHERE id_producto = NEW.id_producto;
        ELSE
            INSERT INTO inventario_productos (
                id_producto, 
                codigo_interno,
                costo_unitario, 
                precio_venta, 
                stock_actual,
                stock_minimo
            ) VALUES (
                NEW.id_producto,
                'PROD-' || LPAD(NEW.id_producto::TEXT, 5, '0'),
                NEW.costo_unitario,
                100.00,
                NEW.cantidad_producida,
                5
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_inventario
AFTER INSERT ON produccion_taller
FOR EACH ROW
EXECUTE FUNCTION actualizar_inventario_produccion();

-- PASO 5: Crear vistas
CREATE OR REPLACE VIEW vista_inventario_completo AS
SELECT 
    ip.id_inventario,
    ip.codigo_interno,
    p.id_producto,
    p.nombre_producto,
    p.metal,
    p.tipo_producto as categoria,
    ip.costo_unitario,
    ip.precio_venta,
    ip.stock_actual,
    ip.stock_minimo,
    CASE 
        WHEN ip.stock_actual <= ip.stock_minimo THEN true 
        ELSE false 
    END as stock_bajo,
    ip.precios_adicionales,
    p.foto_url,
    p.activo,
    ip.ultima_actualizacion
FROM inventario_productos ip
INNER JOIN productos p ON ip.id_producto = p.id_producto
ORDER BY p.nombre_producto;

CREATE OR REPLACE VIEW vista_stock_bajo AS
SELECT *
FROM vista_inventario_completo
WHERE stock_bajo = true AND activo = true;

CREATE OR REPLACE VIEW vista_produccion_detalle AS
SELECT 
    pt.id_produccion,
    pt.fecha_produccion,
    p.nombre_producto,
    p.tipo_producto as categoria,
    p.metal,
    pt.cantidad_producida,
    pt.es_pedido,
    pt.id_pedido,
    pt.costo_materiales,
    pt.horas_trabajo,
    pt.costo_hora,
    pt.costo_mano_obra,
    pt.costo_herramientas,
    pt.otros_gastos,
    pt.costo_total_produccion,
    pt.costo_unitario
FROM produccion_taller pt
INNER JOIN productos p ON pt.id_producto = p.id_producto
ORDER BY pt.fecha_produccion DESC;

-- VERIFICACIÓN
SELECT 'inventario_productos' as tabla, COUNT(*) as registros 
FROM inventario_productos;

-- ✅ Listo! Ahora refresca la app y prueba registrar producción
