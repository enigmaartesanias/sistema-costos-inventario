import React, { useState, useEffect } from 'react';
import sql from '../services/neon';
import { Package, AlertCircle, Filter, Search, TrendingDown } from 'lucide-react';

const CATEGORIAS = ['Todos', 'Anillo', 'Arete', 'Collar', 'Pulsera', 'Dije'];
const MATERIALES = ['Todos', 'Plata', 'Alpaca', 'Bronce', 'Oro'];

export default function InventoryReport() {
    const [inventario, setInventario] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        categoria: 'Todos',
        material: 'Todos',
        soloStockBajo: false,
        soloActivos: true,
        busqueda: ''
    });

    useEffect(() => {
        cargarInventario();
    }, []);

    const cargarInventario = async () => {
        setLoading(true);
        try {
            console.log('🔍 Cargando inventario...');

            // Consultar directamente la tabla inventario_productos
            const result = await sql(
                `SELECT 
                    id_inventario,
                    codigo_qr,
                    codigo_manual,
                    codigo_interno,
                    nombre_producto,
                    categoria,
                    material,
                    unidad,
                    origen,
                    costo_unitario,
                    precio_venta,
                    precio_mayorista,
                    precio_oferta,
                    stock_actual,
                    stock_minimo,
                    CASE 
                        WHEN stock_actual <= stock_minimo THEN true 
                        ELSE false 
                    END as stock_bajo,
                    foto_url,
                    activo,
                    creado_en,
                    ultima_actualizacion
                FROM inventario_productos
                ORDER BY nombre_producto`
            );

            console.log('✅ Productos cargados:', result.length);
            console.log('📦 Datos:', result);
            setInventario(result);
        } catch (error) {
            console.error('❌ Error al cargar inventario:', error);
            console.error('Detalles del error:', error.message);
            alert(`Error al cargar inventario: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Aplicar filtros
    const inventarioFiltrado = inventario.filter(item => {
        // Filtro por categoría
        if (filters.categoria !== 'Todos' && item.categoria !== filters.categoria) {
            return false;
        }

        // Filtro por material
        if (filters.material !== 'Todos' && item.material !== filters.material) {
            return false;
        }

        // Filtro por stock bajo
        if (filters.soloStockBajo && !item.stock_bajo) {
            return false;
        }

        // Filtro por activos
        if (filters.soloActivos && !item.activo) {
            return false;
        }

        // Búsqueda por nombre, código QR o código manual
        if (filters.busqueda) {
            const busqueda = filters.busqueda.toLowerCase();
            const nombre = (item.nombre_producto || '').toLowerCase();
            const codigoQR = (item.codigo_qr || '').toLowerCase();
            const codigoManual = (item.codigo_manual || '').toLowerCase();
            const codigoInterno = (item.codigo_interno || '').toLowerCase();
            if (!nombre.includes(busqueda) &&
                !codigoQR.includes(busqueda) &&
                !codigoManual.includes(busqueda) &&
                !codigoInterno.includes(busqueda)) {
                return false;
            }
        }

        return true;
    });

    // Estadísticas rápidas
    const stats = {
        total: inventarioFiltrado.length,
        stockBajo: inventarioFiltrado.filter(i => i.stock_bajo).length,
        valorTotal: inventarioFiltrado.reduce((sum, i) => sum + (i.stock_actual * i.precio_venta || 0), 0),
        costoTotal: inventarioFiltrado.reduce((sum, i) => sum + (i.stock_actual * i.costo_unitario || 0), 0)
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Reporte de Inventario</h2>
                <p className="text-gray-500 text-sm">Stock actual de productos con filtros avanzados</p>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="card border-l-4 border-blue-500">
                    <div className="text-xs text-gray-500 mb-1">Total Productos</div>
                    <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                </div>
                <div className="card border-l-4 border-red-500">
                    <div className="text-xs text-gray-500 mb-1">Stock Bajo</div>
                    <div className="text-2xl font-bold text-red-600">{stats.stockBajo}</div>
                </div>
                <div className="card border-l-4 border-green-500">
                    <div className="text-xs text-gray-500 mb-1">Valor Venta</div>
                    <div className="text-lg font-bold text-green-600">S/ {stats.valorTotal.toFixed(2)}</div>
                </div>
                <div className="card border-l-4 border-purple-500">
                    <div className="text-xs text-gray-500 mb-1">Costo Total</div>
                    <div className="text-lg font-bold text-purple-600">S/ {stats.costoTotal.toFixed(2)}</div>
                </div>
            </div>

            {/* Filtros */}
            <div className="card mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter size={18} className="text-gray-600" />
                    <h3 className="text-sm font-bold text-gray-800">Filtros</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Búsqueda */}
                    <div className="lg:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Buscar</label>
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Nombre o código..."
                                className="input-field pl-9 text-sm"
                                value={filters.busqueda}
                                onChange={(e) => setFilters({ ...filters, busqueda: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Categoría */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
                        <select
                            className="input-field text-sm"
                            value={filters.categoria}
                            onChange={(e) => setFilters({ ...filters, categoria: e.target.value })}
                        >
                            {CATEGORIAS.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Material */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Material</label>
                        <select
                            className="input-field text-sm"
                            value={filters.material}
                            onChange={(e) => setFilters({ ...filters, material: e.target.value })}
                        >
                            {MATERIALES.map(mat => (
                                <option key={mat} value={mat}>{mat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Checkboxes */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Opciones</label>
                        <div className="space-y-1">
                            <label className="flex items-center gap-2 text-xs cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filters.soloStockBajo}
                                    onChange={(e) => setFilters({ ...filters, soloStockBajo: e.target.checked })}
                                    className="rounded text-red-600"
                                />
                                Solo stock bajo
                            </label>
                            <label className="flex items-center gap-2 text-xs cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filters.soloActivos}
                                    onChange={(e) => setFilters({ ...filters, soloActivos: e.target.checked })}
                                    className="rounded text-purple-600"
                                />
                                Solo activos
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla de Inventario */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="text-center py-8 text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                        Cargando inventario...
                    </div>
                ) : inventarioFiltrado.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Package size={48} className="mx-auto mb-2 text-gray-300" />
                        No hay productos que coincidan con los filtros
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Producto</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Código</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Categoría</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Material</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Stock</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Stock Mín</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Costo</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Precio</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {inventarioFiltrado.map((item) => (
                                    <tr key={item.id_inventario} className={`hover:bg-gray-50 ${item.stock_bajo ? 'bg-red-50/30' : ''}`}>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {item.foto_url && (
                                                    <img src={item.foto_url} alt={item.nombre_producto} className="w-8 h-8 object-cover rounded" />
                                                )}
                                                <span className="font-medium text-gray-800">{item.nombre_producto}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">{item.codigo_qr || item.codigo_interno}</td>
                                        <td className="px-4 py-3 text-gray-600">{item.categoria}</td>
                                        <td className="px-4 py-3 text-gray-600">{item.material}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`font-bold ${item.stock_bajo ? 'text-red-600' : 'text-gray-800'}`}>
                                                {item.stock_actual}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-500">{item.stock_minimo}</td>
                                        <td className="px-4 py-3 text-right text-gray-600">S/ {parseFloat(item.costo_unitario || 0).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right font-medium text-green-600">S/ {parseFloat(item.precio_venta || 0).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-center">
                                            {item.stock_bajo ? (
                                                <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                                                    <TrendingDown size={12} />
                                                    Bajo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                                    <Package size={12} />
                                                    OK
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Nota informativa */}
            {stats.stockBajo > 0 && (
                <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg flex items-start gap-3">
                    <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <div className="font-medium text-amber-800 text-sm">Atención: Stock bajo detectado</div>
                        <div className="text-xs text-amber-700 mt-1">
                            Hay {stats.stockBajo} producto(s) con stock por debajo del mínimo. Considera programar producción.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
