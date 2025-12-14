import React, { useEffect, useState } from 'react';
import sql from '../services/neon';
import { Edit, Trash2, Image as ImageIcon } from 'lucide-react';

export default function ProductionList({ onEdit, refreshTrigger }) {
    const [producciones, setProducciones] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProducciones = async () => {
        try {
            setLoading(true);
            const data = await sql(`
                SELECT 
                    pt.id_produccion,
                    pt.fecha_produccion,
                    pt.cantidad_producida,
                    pt.costo_total_produccion,
                    p.nombre_producto,
                    p.foto_url,
                    p.precio_venta,
                    p.id_producto,
                    p.metal,
                    p.tipo_producto,
                    pt.costo_materiales,
                    pt.horas_trabajo,
                    pt.costo_hora,
                    pt.costo_herramientas,
                    pt.otros_gastos
                FROM produccion_taller pt
                JOIN productos p ON pt.id_producto = p.id_producto
                ORDER BY pt.fecha_produccion DESC
                LIMIT 20
            `);
            setProducciones(data);
        } catch (error) {
            console.error("Error cargando historial:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducciones();
    }, [refreshTrigger]);

    const handleDelete = async (productionId, productoId, cantidad) => {
        if (!window.confirm("¿Seguro que deseas eliminar este registro?")) return;

        try {
            await sql('DELETE FROM produccion_taller WHERE id_produccion = $1', [productionId]);
            // Opcional: ¿Restar stock? Por seguridad mejor no tocar stock automático para evitar desajustes complejos,
            // o preguntar al usuario. Por ahora solo eliminamos el registro de costo.

            fetchProducciones();
        } catch (error) {
            alert("Error al eliminar: " + error.message);
        }
    };

    if (loading) return <div className="text-center p-4 text-gray-500">Cargando historial...</div>;

    return (
        <div className="card mt-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 px-2">Historial Reciente</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-sm text-gray-500 border-b border-gray-200">
                            <th className="py-3 px-4">Fecha</th>
                            <th className="py-3 px-4">Producto</th>
                            <th className="py-3 px-4 text-center">Cant.</th>
                            <th className="py-3 px-4 text-right">Costo Total</th>
                            <th className="py-3 px-4 text-right">P. Venta</th>
                            <th className="py-3 px-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-gray-700">
                        {producciones.map((item) => (
                            <tr key={item.id_produccion} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                <td className="py-3 px-4">
                                    {new Date(item.fecha_produccion).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                                            {item.foto_url ? (
                                                <img src={item.foto_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="w-5 h-5 m-auto text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{item.nombre_producto}</p>
                                            <p className="text-xs text-gray-500">{item.tipo_producto} - {item.metal}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-center font-bold">
                                    {item.cantidad_producida}
                                </td>
                                <td className="py-3 px-4 text-right text-gray-900 font-medium">
                                    S/ {Number(item.costo_total_produccion).toFixed(2)}
                                </td>
                                <td className="py-3 px-4 text-right text-gray-500">
                                    S/ {Number(item.precio_venta).toFixed(2)}
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => onEdit(item)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                            title="Editar"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id_produccion)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {producciones.length === 0 && (
                            <tr>
                                <td colSpan="6" className="py-8 text-center text-gray-400">
                                    No hay producciones registradas recientemente.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
