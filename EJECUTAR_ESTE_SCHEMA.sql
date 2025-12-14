-- ============================================================================
-- SCHEMA COMPLETO - Base de Datos Sistema ERP Inventario
-- ============================================================================
-- Ejecutar COMPLETO en Neon SQL Editor
-- Este script crea TODAS las tablas necesarias en el orden correcto
-- ============================================================================

-- ============================================================================
-- PASO 1: CREAR TABLAS BASE
-- ============================================================================

-- 1.1 Tabla: productos (Catálogo de Productos)
DROP TABLE IF EXISTS productos CASCADE;
CREATE TABLE productos (
    id_producto SERIAL PRIMARY KEY,
    nombre_producto VARCHAR(150) NOT NULL,
    metal VARCHAR(50), -- Plata, Alpaca, Bronce, Oro
    tipo_producto VARCHAR(50), -- Anillo, Arete, Collar, Pulsera, Dije
    precio_venta NUMERIC(10, 2),
    stock INTEGER DEFAULT 0,
    foto_url TEXT,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1.2 Tabla: produccion_taller (Historial de Producción)
DROP TABLE IF EXISTS produccion_taller CASCADE;
CREATE TABLE produccion_taller (
    id_produccion SERIAL PRIMARY KEY,
    id_producto INTEGER REFERENCES productos(id_producto),
    fecha_produccion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    cantidad_producida INTEGER NOT NULL,
    
    -- Campo NUEVO: es_pedido
    es_pedido BOOLEAN DEFAULT FALSE,
    id_pedido INTEGER NULL,
    
    -- Costos (Manuales)
    costo_materiales NUMERIC(10, 2) DEFAULT 0,
    
    -- Mano de Obra
    horas_trabajo NUMERIC(5, 2) DEFAULT 0,
    costo_hora NUMERIC(10, 2) DEFAULT 0,
    costo_mano_obra NUMERIC(10, 2) GENERATED ALWAYS AS (horas_trabajo * costo_hora) STORED,
    
    -- Gastos Taller
    costo_herramientas NUMERIC(10, 2) DEFAULT 0,
    costo_herramientas NUMERIC(10, 2) DEFAULT 0,
    otros_gastos NUMERIC(10, 2) DEFAULT 0,
    
    -- Cálculos Totales
    costo_total_produccion NUMERIC(10, 2) GENERATED ALWAYS AS (
        costo_materiales + 
        (horas_trabajo * costo_hora) + 
        costo_herramientas + 
        otros_gastos
    ) STORED,
    
    costo_unitario NUMERIC(10, 2) GENERATED ALWAYS AS (
        CASE WHEN cantidad_producida > 0 THEN
            (costo_materiales + (horas_trabajo * costo_hora) + costo_herramientas + otros_gastos) / cantidad_producida
        ELSE 0 END
    ) STORED
);

-- ============================================================================
-- PASO 2: CREAR TABLA inventario_productos (NUEVA)
-- ============================================================================

CREATE TABLE inventario_productos (
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

-- ============================================================================
-- PASO 3: CREAR ÍNDICES
-- ============================================================================

-- Índices productos
CREATE INDEX idx_productos_activo ON productos(activo);

-- Índices produccion_taller
CREATE INDEX idx_produccion_producto ON produccion_taller(id_producto);
CREATE INDEX idx_produccion_fecha ON produccion_taller(fecha_produccion);

-- Índices inventario_productos
CREATE INDEX idx_inventario_producto ON inventario_productos(id_producto);
CREATE INDEX idx_inventario_codigo ON inventario_productos(codigo_interno);
CREATE INDEX idx_inventario_stock_bajo ON inventario_productos(stock_actual, stock_minimo);

-- ============================================================================
-- PASO 4: CREAR TRIGGER AUTOMÁTICO
-- ============================================================================

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
            -- Actualizar registro existente (promedio ponderado de costos)
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
                100.00, -- Precio por defecto
                NEW.cantidad_producida,
                5
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_actualizar_inventario ON produccion_taller;
CREATE TRIGGER trigger_actualizar_inventario
AFTER INSERT ON produccion_taller
FOR EACH ROW
EXECUTE FUNCTION actualizar_inventario_produccion();

-- ============================================================================
-- PASO 5: CREAR VISTAS
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

-- Ver tablas creadas
SELECT 
    'productos' as tabla, 
    COUNT(*) as registros 
FROM productos
UNION ALL
SELECT 
    'produccion_taller' as tabla, 
    COUNT(*) as registros 
FROM produccion_taller
UNION ALL
SELECT 
    'inventario_productos' as tabla, 
    COUNT(*) as registros 
FROM inventario_productos;

-- ============================================================================
-- FIN - ¡Base de datos lista para usar!
-- ============================================================================

/*
PRÓXIMOS PASOS:

1. Ahora puedes usar la aplicación:
   - npm run dev
   - Ve a /produccion para registrar producción
   - Marca el checkbox si es pedido
   - Ve a /inventario para ver el reporte

2. El sistema funcionará así:
   ✅ Producción SIN checkbox → Suma al inventario
   ❌ Producción CON checkbox → NO suma al inventario (solo registro)

*/
