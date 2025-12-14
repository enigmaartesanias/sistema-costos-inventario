import React, { useState, useEffect } from 'react';
import { getProducts } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { Plus, Minus, Trash, ShoppingCart } from 'lucide-react';

export default function SalesForm() {
    const { currentUser } = useAuth();
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Extra fields
    const [medioPago, setMedioPago] = useState('efectivo');
    const [cliente, setCliente] = useState('');

    useEffect(() => {
        getProducts().then(setProducts).catch(console.error).finally(() => setLoading(false));
    }, []);

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.cantidad >= product.stock_actual) {
                    alert("No hay más stock disponible");
                    return prev;
                }
                return prev.map(item => item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item);
            }
            return [...prev, { ...product, cantidad: 1 }];
        });
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = item.cantidad + delta;
                if (newQty < 1) return item;
                const product = products.find(p => p.id === id);
                if (newQty > product.stock_actual) {
                    alert("Stock insuficiente");
                    return item;
                }
                return { ...item, cantidad: newQty };
            }
            return item;
        }));
    };

    const total = cart.reduce((sum, item) => sum + (item.precio_venta * item.cantidad), 0);

    const handleSubmit = async () => {
        if (cart.length === 0) return;
        setProcessing(true);

        const saleData = {
            fecha: new Date().toISOString(),
            total: total,
            medio_pago: medioPago,
            cliente: cliente,
            usuario_id: currentUser?.uid,
            detalles: cart.map(item => ({
                producto_id: item.id,
                cantidad: item.cantidad,
                precio_unitario: item.precio_venta,
                subtotal: item.precio_venta * item.cantidad
            }))
        };

        try {
            const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_SALES;
            if (!webhookUrl) throw new Error("Webhook de ventas no configurado (VITE_N8N_WEBHOOK_SALES)");

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(saleData)
            });

            if (!response.ok) throw new Error("Error registrando venta");

            alert("Venta registrada con éxito!");
            setCart([]);
            setCliente('');
            // Reload products to update stock visually (simple approach)
            getProducts().then(setProducts);

        } catch (e) {
            console.error(e);
            alert("Error al procesar venta: " + e.message);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div>Cargando productos...</div>;

    return (
        <div className="grid md:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
            {/* Product Selection */}
            <div className="overflow-y-auto pr-2">
                <h3 className="font-bold text-gray-700 mb-2">Productos Disponibles</h3>
                <div className="grid grid-cols-2 gap-3">
                    {products.map(p => (
                        <div key={p.id}
                            onClick={() => p.stock_actual > 0 && addToCart(p)}
                            className={`border rounded-lg p-3 cursor-pointer transition hover:shadow-md ${p.stock_actual === 0 ? 'opacity-50 grayscale' : 'bg-white'}`}>
                            <div className="text-sm font-semibold">{p.tipo} {p.metal}</div>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-purple-600 font-bold">S/ {p.precio_venta}</span>
                                <span className="text-xs text-gray-500">Stock: {p.stock_actual}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cart & Checkout */}
            <div className="bg-white rounded-xl shadow-lg p-4 flex flex-col h-full">
                <h3 className="font-bold text-lg mb-4 flex items-center">
                    <ShoppingCart className="mr-2" /> Carrito de Venta
                </h3>

                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                    {cart.length === 0 ? (
                        <div className="text-gray-400 text-center py-10">Carrito vacío</div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                <div>
                                    <div className="text-sm font-medium">{item.tipo} {item.metal}</div>
                                    <div className="text-xs text-gray-500">S/ {item.precio_venta} x {item.cantidad}</div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 bg-gray-200 rounded"><Minus size={14} /></button>
                                    <span className="text-sm font-bold w-4 text-center">{item.cantidad}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 bg-gray-200 rounded"><Plus size={14} /></button>
                                    <button onClick={() => removeFromCart(item.id)} className="p-1 text-red-500 ml-2"><Trash size={14} /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between text-xl font-bold">
                        <span>Total</span>
                        <span>S/ {total.toFixed(2)}</span>
                    </div>

                    <input
                        type="text"
                        placeholder="Nombre del Cliente (Opcional)"
                        className="w-full p-2 border rounded"
                        value={cliente}
                        onChange={(e) => setCliente(e.target.value)}
                    />

                    <div className="flex space-x-2">
                        {['efectivo', 'yape', 'plin'].map(m => (
                            <button
                                key={m}
                                onClick={() => setMedioPago(m)}
                                className={`flex-1 py-1 px-2 rounded capitalized ${medioPago === m ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>

                    <button
                        disabled={cart.length === 0 || processing}
                        onClick={handleSubmit}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-lg shadow-lg disabled:opacity-50"
                    >
                        {processing ? 'Procesando...' : 'Confirmar Venta'}
                    </button>
                </div>
            </div>
        </div>
    );
}
