import React from 'react';

const InventoryPage = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white tracking-tight">Inventario</h1>
                <button className="glass-btn">
                    + Nuevo Producto
                </button>
            </div>

            <div className="glass-card p-8 text-center text-slate-400">
                <p>Tabla de Productos aparecerá aquí.</p>
            </div>
        </div>
    );
};

export default InventoryPage;
