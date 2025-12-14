-- ============================================================================
-- SCRIPT DE LIMPIEZA - Elimina solo cambios del Schema V2
-- ============================================================================
-- Este script elimina SOLO las nuevas tablas, vistas, triggers y columnas
-- NO toca tus datos originales en productos y produccion_taller
-- ============================================================================

-- Eliminar vistas
DROP VIEW IF EXISTS vista_produccion_detalle;
DROP VIEW IF EXISTS vista_stock_bajo;
DROP VIEW IF EXISTS vista_inventario_completo;

-- Eliminar triggers y funciones
DROP TRIGGER IF EXISTS trigger_actualizar_inventario ON produccion_taller;
DROP FUNCTION IF EXISTS actualizar_inventario_produccion();

-- Eliminar tabla inventario_productos
DROP TABLE IF EXISTS inventario_productos CASCADE;

-- Eliminar columnas agregadas a produccion_taller (OPCIONAL - comentado por seguridad)
-- Si quieres eliminar las columnas es_pedido e id_pedido, descomenta las siguientes líneas:

/*
ALTER TABLE produccion_taller DROP COLUMN IF EXISTS es_pedido;
ALTER TABLE produccion_taller DROP COLUMN IF EXISTS id_pedido;
*/

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver qué queda en la base de datos
SELECT 
    'productos' as tabla, 
    COUNT(*) as registros 
FROM productos
UNION ALL
SELECT 
    'produccion_taller' as tabla, 
    COUNT(*) as registros 
FROM produccion_taller;

-- Ver columnas de produccion_taller
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'produccion_taller'
ORDER BY ordinal_position;
