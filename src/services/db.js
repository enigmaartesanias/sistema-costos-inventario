import { neon } from '@neondatabase/serverless';

// Configurar la conexión utilizando la variable de entorno
const sql = neon(import.meta.env.VITE_DATABASE_URL ? import.meta.env.VITE_DATABASE_URL : "postgresql://dummy:dummy@dummy.neon.tech/dummy");

export async function getProducts() {
    try {
        // Consulta para obtener productos con nombres de metal y tipo
        const result = await sql`
      SELECT 
        p.id, 
        p.precio_venta, 
        p.stock_actual, 
        p.imagen_url, 
        p.activo,
        m.nombre as metal, 
        t.nombre as tipo,
        p.metal_id,
        p.tipo_id
      FROM productos p
      JOIN metales m ON p.metal_id = m.id
      JOIN tipos_producto t ON p.tipo_id = t.id
      WHERE p.activo = true
      ORDER BY p.creado_en DESC
    `;
        return result;
    } catch (error) {
        console.error("Error fetching products from Neon:", error);
        throw error;
    }
}

export async function getDailyStats() {
    try {
        // Totales de hoy (usando COALESCE para evitar nulls)
        const todayStats = await sql`
      SELECT 
        COALESCE(SUM(total), 0) as total_ventas,
        COUNT(*) as cantidad_ventas
      FROM ventas 
      WHERE DATE(fecha) = CURRENT_DATE
    `;

        // Mejor producto (simplificado)
        const bestSeller = await sql`
      SELECT 
        t.nombre || ' ' || m.nombre as nombre_producto
      FROM venta_detalle vd
      JOIN productos p ON vd.producto_id = p.id
      JOIN metales m ON p.metal_id = m.id
      JOIN tipos_producto t ON p.tipo_id = t.id
      GROUP BY p.metal_id, p.tipo_id, m.nombre, t.nombre
      ORDER BY SUM(vd.cantidad) DESC
      LIMIT 1
    `;

        return {
            total_ventas: parseFloat(todayStats[0]?.total_ventas || 0).toFixed(2),
            cantidad_ventas: todayStats[0]?.cantidad_ventas || 0,
            best_seller: bestSeller[0]?.nombre_producto || 'Ninguno'
        };
    } catch (error) {
        console.error("Error fetching stats:", error);
        // Return empty state or fake data if DB fails
        return { total_ventas: '0.00', cantidad_ventas: 0, best_seller: 'N/A' };
    }
}
