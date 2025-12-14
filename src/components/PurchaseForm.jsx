import React, { useState, useEffect } from 'react';
import sql from '../services/neon';

export default function PurchaseForm() {
    const [formData, setFormData] = useState({
        proveedor_id: '',
        producto_id: '',
        cantidad: 1,
        costo_unitario: '',
        observaciones: ''
    });

    const [proveedores, setProveedores] = useState([]);
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                // Cargar proveedores y productos en paralelo
                const [provResult, prodResult] = await Promise.all([
                    sql('SELECT id, nombre FROM proveedores ORDER BY nombre'),
                    sql('SELECT id, nombre FROM productos ORDER BY nombre')
                ]);

                setProveedores(provResult || []);
                setProductos(prodResult || []);
            } catch (err) {
                console.error("Error cargando datos:", err);
            } finally {
                setInitialLoading(false);
            }
        }
        loadData();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await sql(
                'INSERT INTO compras (proveedor_id, producto_id, cantidad, costo_unitario, observaciones) VALUES ($1, $2, $3, $4, $5)',
                [
                    formData.proveedor_id,
                    formData.producto_id,
                    formData.cantidad,
                    formData.costo_unitario,
                    formData.observaciones
                ]
            );

            alert("Compra registrada exitosamente");
            setFormData({
                proveedor_id: '',
                producto_id: '',
                cantidad: 1,
                costo_unitario: '',
                observaciones: ''
            });

        } catch (error) {
            console.error(error);
            alert("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return <div className="text-center p-10 text-gray-500">Cargando datos...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="card">
                <div className="mb-6 border-b border-gray-100 pb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Registrar Compra</h2>
                    <p className="text-sm text-gray-500 mt-1">Ingresa los detalles de la nueva adquisición de mercadería.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Proveedor y Producto */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Proveedor *</label>
                            <select
                                name="proveedor_id"
                                className="input-field"
                                value={formData.proveedor_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Seleccionar Proveedor</option>
                                {proveedores.map(p => (
                                    <option key={p.id} value={p.id}>{p.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Producto *</label>
                            <select
                                name="producto_id"
                                className="input-field"
                                value={formData.producto_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Seleccionar Producto</option>
                                {productos.map(p => (
                                    <option key={p.id} value={p.id}>{p.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Cantidad y Costo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Cantidad *</label>
                            <input
                                type="number"
                                name="cantidad"
                                min="1"
                                className="input-field"
                                value={formData.cantidad}
                                onChange={handleChange}
                                required
                                placeholder="Ej: 10"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Costo Unitario (S/) *</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-gray-400">S/</span>
                                <input
                                    type="number"
                                    name="costo_unitario"
                                    step="0.01"
                                    className="input-field pl-10"
                                    value={formData.costo_unitario}
                                    onChange={handleChange}
                                    required
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Observaciones */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Observaciones</label>
                        <textarea
                            name="observaciones"
                            rows="3"
                            className="input-field resize-none"
                            value={formData.observaciones}
                            onChange={handleChange}
                            placeholder="Detalles adicionales de la compra..."
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`btn-primary w-full flex justify-center items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Registrando...
                                </>
                            ) : (
                                'Guardar Compra'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
