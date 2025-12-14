import React, { useEffect, useState } from 'react';
import { neon } from '@neondatabase/serverless';

// Reusing connection logic or importing if desired. 
// For simplicity in this component, defining sql here or we could export 'sql' from db.js
// Let's import the one from db.js if we exported it, but we didn't export 'sql' constant, only getProducts.
// I will create a new ad-hoc query here or update db.js. 
// Let's update this to use a new function I'll add to db.js: getDailyStats.
// But first, let's write this component assuming getDailyStats exists, then I'll update db.js.

import { ArrowUpRight, DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';
import { getDailyStats } from '../services/db';

export default function ReportDashboard() {
    const [stats, setStats] = useState({ total_ventas: 0, cantidad_ventas: 0, best_seller: 'N/A' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const data = await getDailyStats();
                setStats(data);
            } catch (error) {
                console.error("Error loading stats", error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) return <div className="p-4 animate-pulse">Cargando métricas...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-4 text-white shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-purple-100 text-sm">Ventas Hoy</span>
                        <DollarSign className="w-5 h-5 opacity-80" />
                    </div>
                    <div className="text-2xl font-bold">S/ {stats.total_ventas || '0.00'}</div>
                    <div className="text-xs text-purple-200 mt-1 flex items-center">
                        <ArrowUpRight className="w-3 h-3 mr-1" /> Hoy
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 text-gray-800 shadow-md border border-purple-50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 text-sm">Transacciones</span>
                        <ShoppingBag className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="text-2xl font-bold">{stats.cantidad_ventas || 0}</div>
                    <div className="text-xs text-gray-400 mt-1">Registradas hoy</div>
                </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-gray-600 font-medium mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-pink-500" />
                    Producto Top
                </h3>
                <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl mr-4">
                        👑
                    </div>
                    <div>
                        <div className="font-bold text-gray-800">{stats.best_seller || 'Ninguno'}</div>
                        <div className="text-sm text-gray-500">Más vendido este mes</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
