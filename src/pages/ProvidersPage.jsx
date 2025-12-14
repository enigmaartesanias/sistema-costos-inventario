import React from 'react';

const ProvidersPage = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white tracking-tight">Proveedores</h1>
                <button className="glass-btn">
                    + Nuevo Proveedor
                </button>
            </div>

            <div className="glass-card p-8 text-center text-slate-400">
                <p>Listado de Proveedores aparecerá aquí.</p>
            </div>
        </div>
    );
};

export default ProvidersPage;
