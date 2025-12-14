-- ============================================================================
-- LIMPIEZA: Eliminar funciones y triggers agregados recientemente
-- ============================================================================
-- Ejecuta esto PRIMERO si necesitas limpiar antes de volver a intentar
-- ============================================================================

-- 1. Eliminar triggers
DROP TRIGGER IF EXISTS before_insert_generar_qr_manual ON inventario_productos;
DROP TRIGGER IF EXISTS before_insert_generar_qr ON inventario_productos;

-- 2. Eliminar funciones
DROP FUNCTION IF EXISTS trigger_generar_qr_manual();
DROP FUNCTION IF EXISTS generar_qr_desde_manual(VARCHAR);
DROP FUNCTION IF EXISTS buscar_producto_por_codigo_manual(VARCHAR);
DROP FUNCTION IF EXISTS trigger_generar_codigo_qr();
DROP FUNCTION IF EXISTS generar_codigo_qr(VARCHAR, VARCHAR);

-- 3. Eliminar índices (solo los que agregamos)
DROP INDEX IF EXISTS idx_inventario_codigo_manual;
DROP INDEX IF EXISTS idx_inventario_qr;
DROP INDEX IF EXISTS idx_inventario_categoria_material;
DROP INDEX IF EXISTS idx_inventario_nombre;

-- 4. NO eliminamos columnas para no perder datos
-- Si quieres eliminar columnas (¡CUIDADO! perderás datos):
/*
ALTER TABLE inventario_productos DROP COLUMN IF EXISTS codigo_manual;
ALTER TABLE inventario_productos DROP COLUMN IF EXISTS nombre_producto;
ALTER TABLE inventario_productos DROP COLUMN IF EXISTS categoria;
ALTER TABLE inventario_productos DROP COLUMN IF EXISTS material;
ALTER TABLE inventario_productos DROP COLUMN IF EXISTS unidad;
ALTER TABLE inventario_productos DROP COLUMN IF EXISTS origen;
ALTER TABLE inventario_productos DROP COLUMN IF EXISTS precio_mayorista;
ALTER TABLE inventario_productos DROP COLUMN IF EXISTS precio_oferta;
ALTER TABLE inventario_productos DROP COLUMN IF EXISTS foto_url;
ALTER TABLE inventario_productos DROP COLUMN IF EXISTS activo;
*/

SELECT 'Limpieza completada. Funciones, triggers e índices eliminados.' as mensaje;

-- ============================================================================
-- Ahora puedes ejecutar EJECUTAR_EN_NEON.sql sin conflictos
-- ============================================================================
