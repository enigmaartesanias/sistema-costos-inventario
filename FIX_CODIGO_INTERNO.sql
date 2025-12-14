-- ============================================================================
-- FIX: Hacer codigo_interno OPCIONAL o generar automáticamente
-- ============================================================================

-- Opción 1: Hacer que codigo_interno acepte NULL
ALTER TABLE inventario_productos 
ALTER COLUMN codigo_interno DROP NOT NULL;

-- Opción 2: Darle un valor por defecto automático
-- (Si prefieres que siempre tenga un valor)
/*
ALTER TABLE inventario_productos 
ALTER COLUMN codigo_interno SET DEFAULT 'AUTO-' || nextval('inventario_productos_id_inventario_seq')::text;
*/

-- Verificar el cambio
SELECT 
    column_name, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'inventario_productos' 
  AND column_name = 'codigo_interno';

SELECT 'codigo_interno ahora es NULLABLE' as mensaje;

-- ============================================================================
-- LISTO! Ahora el formulario debería funcionar
-- ============================================================================
