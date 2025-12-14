-- ============================================================================
-- SCHEMA V2 - SIMPLE (Sin migración automática de datos)
-- ============================================================================
-- Este script crea la nueva arquitectura ERP sin migrar datos automáticamente
-- Para bases de datos con pocos registros que se pueden ingresar manualmente
-- ============================================================================

-- ============================================================================
-- PASO 1: CREAR TABLA inventario_productos
-- ============================================================================

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

-- Índices
CREATE INDEX IF NOT EXISTS idx_inventario_producto ON inventario_productos(id_producto);
CREATE INDEX IF NOT EXISTS idx_inventario_codigo ON inventario_productos(codigo_interno);
CREATE INDEX IF NOT EXISTS idx_inventario_stock_bajo ON inventario_productos(stock_actual, stock_minimo);

-- ============================================================================
-- PASO 2: AGREGAR CAMPO es_pedido A produccion_taller
-- ============================================================================

-- Agregar es_pedido
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

-- Agregar id_pedido (opcional)
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

-- Marcar registros existentes como NO pedido
UPDATE produccion_taller 
SET es_pedido = FALSE 
WHERE es_pedido IS NULL;

-- ============================================================================
-- PASO 3: CREAR TRIGGER AUTOMÁTICO
-- ============================================================================

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS trigger_actualizar_inventario ON produccion_taller;
DROP FUNCTION IF EXISTS actualizar_inventario_produccion();

-- Función que actualiza inventario solo si NO es pedido
CREATE OR REPLACE FUNCTION actualizar_inventario_produccion()
RETURNS TRIGGER AS $$
DECLARE
    v_producto_existe INTEGER;
BEGIN
    -- Solo actualizar stock si NO es pedido
    IF NEW.es_pedido = FALSE THEN
        
        -- Verificar si el producto existe en inventario
        SELECT COUNT(*) INTO v_producto_existe
        FROM inventario_productos 
        WHERE id_producto = NEW.id_producto;
        
        IF v_producto_existe > 0 THEN
            -- Actualizar registro existente
            UPDATE inventario_productos
            SET stock_actual = stock_actual + NEW.cantidad_producida,
                costo_unitario = (
                    (costo_unitario * stock_actual + NEW.costo_unitario * NEW.cantidad_producida) 
                    / NULLIF(stock_actual + NEW.cantidad_producida, 0)
                ),
                ultima_actualizacion = CURRENT_TIMESTAMP
            WHERE id_producto = NEW.id_producto;
        ELSE
            -- Si no existe en inventario, crear registro nuevo
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
                100.00, -- Precio por defecto, deberás actualizarlo
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
-- PASO 4: VISTAS ÚTILES
-- ============================================================================

-- Vista completa de inventario
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

-- Vista de stock bajo
CREATE OR REPLACE VIEW vista_stock_bajo AS
SELECT *
FROM vista_inventario_completo
WHERE stock_bajo = true AND activo = true;

-- Vista de producción detallada
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
-- VERIFICACIÓN
-- ============================================================================

-- Ver estructura creada
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

-- ============================================================================
-- INSTRUCCIONES POST-INSTALACIÓN
-- ============================================================================

/*
IMPORTANTE: Después de ejecutar este script:

1. INGRESO MANUAL DE INVENTARIO INICIAL:
   - Ve a la aplicación
   - Usa el formulario de inventario (cuando esté listo) o ejecuta:
   
   INSERT INTO inventario_productos (
       id_producto,
       codigo_interno,
       costo_unitario,
       precio_venta,
       stock_actual,
       stock_minimo
   ) VALUES (
       1,                    -- ID del producto existente
       'PROD-00001',         -- Código único
       50.00,                -- Costo
       100.00,               -- Precio de venta
       10,                   -- Stock actual
       5                     -- Stock mínimo
   );

2. REGISTRAR PRODUCCIÓN NUEVA:
   - Al registrar producción nueva CON checkbox "Es Pedido" = FALSE
   - El trigger sumará automáticamente al inventario
   
3. REGISTRAR PEDIDOS:
   - Al registrar producción CON checkbox "Es Pedido" = TRUE
   - NO se sumará al inventario (solo registro histórico)

4. VER REPORTE DE INVENTARIO:
   - Ve a la sección "Inventario" en la app
   - Verás el stock actual con filtros

*/
