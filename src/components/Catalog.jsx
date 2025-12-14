import React, { useEffect, useState } from 'react';
import { getProducts } from '../services/db';

export default function Catalog() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        async function loadProducts() {
            try {
                const data = await getProducts();
                setProducts(data);
            } catch (err) {
                setError("Error al cargar productos. Verifica tu conexión a Neon.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadProducts();
    }, []);

    const filteredProducts = products.filter(p => {
        const term = filter.toLowerCase();
        return (
            p.metal.toLowerCase().includes(term) ||
            p.tipo.toLowerCase().includes(term) ||
            p.precio_venta.toString().includes(term)
        );
    });

    if (loading) return <div className="text-center p-10"><div className="animate-spin h-8 w-8 border-4 border-purple-500 rounded-full border-t-transparent mx-auto"></div></div>;
    if (error) return <div className="text-center text-red-500 p-10">{error}</div>;

    return (
        <div className="pb-20">
            <div className="sticky top-0 bg-gray-50 z-10 py-2">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 px-2">Catálogo</h2>
                <input
                    type="text"
                    placeholder="Buscar..."
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-sm"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                {filteredProducts.map(p => (
                    <div key={p.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 flex flex-col">
                        <div className="aspect-square bg-gray-200 relative">
                            {p.imagen_url ? (
                                <img src={p.imagen_url} alt={`${p.tipo} ${p.metal}`} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">Sin foto</div>
                            )}
                            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                                Stock: {p.stock_actual}
                            </div>
                        </div>
                        <div className="p-3 flex-1 flex flex-col justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-800 text-sm md:text-base">{p.tipo} de {p.metal}</h3>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                                <span className="text-purple-600 font-bold">S/ {p.precio_venta}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredProducts.length === 0 && (
                <div className="text-center text-gray-500 mt-10">No se encontraron productos.</div>
            )}
        </div>
    );
}
