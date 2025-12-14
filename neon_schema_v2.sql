-- ============================================================================
-- SCHEMA V2: Arquitectura ERP con Separación Catálogo/Inventario/Producción
-- ============================================================================
-- Este script actualiza la base de datos para separar correctamente:
-- - productos: Catálogo (QUÉ vendes)
-- - inventario_productos: Stock real (CUÁNTO tienes)
-- - produccion_taller: Historial con diferenciación pedidos/inventario
-- ============================================================================

-- ============================================================================
-- PASO 1: CREAR NUEVA TABLA inventario_productos
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventario_productos (
    id_inventario SERIAL PRIMARY KEY,
    id_producto INTEGER REFERENCES productos(id_producto) ON DELETE CASCADE,
    codigo_interno VARCHAR(50) UNIQUE NOT NULL, -- Código QR o interno
    costo_unitario NUMERIC(10, 2) DEFAULT 0, -- De producción o compra
    precio_venta NUMERIC(10, 2) NOT NULL,
    stock_actual INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 5,
    precios_adicionales JSONB, -- {mayorista: 80, oferta: 70}
    ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_inventario_producto ON inventario_productos(id_producto);
CREATE INDEX IF NOT EXISTS idx_inventario_codigo ON inventario_productos(codigo_interno);
CREATE INDEX IF NOT EXISTS idx_inventario_stock_bajo ON inventario_productos(stock_actual, stock_minimo);

-- ============================================================================
-- PASO 2: MIGRAR DATOS EXISTENTES DE productos A inventario_productos
-- ============================================================================

-- Insertar stock actual y precios desde productos a inventario
INSERT INTO inventario_productos (
    id_producto,
    codigo_interno,
    costo_unitario,
    precio_venta,
    stock_actual,
    stock_minimo
)
SELECT 
    p.id_producto,
    'PROD-' || LPAD(p.id_producto::TEXT, 5, '0'), -- código autogenerado
    COALESCE(
        (SELECT AVG(pt.costo_unitario) 
         FROM produccion_taller pt 
         WHERE pt.id_producto = p.id_producto),
        0
    ) as costo_promedio,
    COALESCE(p.precio_venta, 0),
    COALESCE(p.stock, 0),
    5 -- stock mínimo por defecto
FROM productos p
WHERE NOT EXISTS (
    SELECT 1 FROM inventario_productos ip WHERE ip.id_producto = p.id_producto
);

-- ============================================================================
-- PASO 3: MODIFICAR TABLA produccion_taller
-- ============================================================================

-- Agregar campo es_pedido si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='produccion_taller' AND column_name='es_pedido'
    ) THEN
        ALTER TABLE produccion_taller 
        ADD COLUMN es_pedido BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Agregar campo id_pedido opcional
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='produccion_taller' AND column_name='id_pedido'
    ) THEN
        ALTER TABLE produccion_taller 
        ADD COLUMN id_pedido INTEGER NULL;
    END IF;
END $$;

-- Marcar todos los registros existentes como NO pedido (entraron al inventario)
UPDATE produccion_taller 
SET es_pedido = FALSE 
WHERE es_pedido IS NULL;

-- ============================================================================
-- PASO 4: CREAR/ACTUALIZAR TRIGGER PARA ACTUALIZAR INVENTARIO AUTOMÁTICAMENTE
-- ============================================================================

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS trigger_actualizar_inventario ON produccion_taller;
DROP FUNCTION IF EXISTS actualizar_inventario_produccion();

-- Función que actualiza inventario solo si NO es pedido
CREATE OR REPLACE FUNCTION actualizar_inventario_produccion()
RETURNS TRIGGER AS $$
DECLARE
    v_precio_venta NUMERIC(10, 2);
BEGIN
    -- Solo actualizar stock si NO es pedido
    IF NEW.es_pedido = FALSE THEN
        
        -- Obtener precio de venta del catálogo
        SELECT precio_venta INTO v_precio_venta
        FROM productos 
        WHERE id_producto = NEW.id_producto;
        
        -- Intentar actualizar registro existente
        UPDATE inventario_productos
        SET stock_actual = stock_actual + NEW.cantidad_producida,
            costo_unitario = (
                (costo_unitario * stock_actual + NEW.costo_unitario * NEW.cantidad_producida) 
                / NULLIF(stock_actual + NEW.cantidad_producida, 0)
            ), -- Promedio ponderado
            ultima_actualizacion = CURRENT_TIMESTAMP
        WHERE id_producto = NEW.id_producto;
        
        -- Si no existe en inventario, crear registro nuevo
        IF NOT FOUND THEN
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
                COALESCE(v_precio_venta, 0),
                NEW.cantidad_producida,
                5
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
CREATE TRIGGER trigger_actualizar_inventario
AFTER INSERT ON produccion_taller
FOR EACH ROW
EXECUTE FUNCTION actualizar_inventario_produccion();

-- ============================================================================
-- PASO 5: MODIFICAR TABLA productos (mantener solo catálogo)
-- ============================================================================

-- NOTA: NO eliminamos las columnas stock y precio_venta aún por seguridad
-- Las mantenemos por compatibilidad con código existente
-- Se pueden eliminar más adelante cuando todo esté migrado

-- Agregar comentarios para documentar
COMMENT ON TABLE productos IS 'Catálogo de productos - Define QUÉ vendes (nombre, categoría, material)';
COMMENT ON TABLE inventario_productos IS 'Inventario real - Define CUÁNTO tienes (stock, costos, precios)';
COMMENT ON TABLE produccion_taller IS 'Historial de producción - Registra producción con diferenciación entre pedidos e inventario';

-- ============================================================================
-- PASO 6: VISTAS ÚTILES PARA REPORTES
-- ============================================================================

-- Vista completa de inventario con información del producto
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

-- Vista de productos con stock bajo
CREATE OR REPLACE VIEW vista_stock_bajo AS
SELECT *
FROM vista_inventario_completo
WHERE stock_bajo = true AND activo = true;

-- Vista de producción con detalle
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

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================

-- Verificar datos migrados
SELECT 
    'productos' as tabla, 
    COUNT(*) as total_registros 
FROM productos
UNION ALL
SELECT 
    'inventario_productos' as tabla, 
    COUNT(*) as total_registros 
FROM inventario_productos
UNION ALL
SELECT 
    'produccion_taller' as tabla, 
    COUNT(*) as total_registros 
FROM produccion_taller;
