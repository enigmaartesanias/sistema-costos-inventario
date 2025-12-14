-- Verificar qué productos hay en inventario_productos
SELECT 
    id_inventario,
    codigo_qr,
    codigo_manual,
    nombre_producto,
    stock_actual,
    activo,
    creado_en
FROM inventario_productos
ORDER BY creado_en DESC;

-- Ver cuántos productos hay en total
SELECT COUNT(*) as total_productos FROM inventario_productos;

-- Ver si hay productos con activo = null
SELECT COUNT(*) as productos_sin_activo 
FROM inventario_productos 
WHERE activo IS NULL;
