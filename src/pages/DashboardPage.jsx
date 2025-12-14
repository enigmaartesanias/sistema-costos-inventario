import React from 'react';

const DashboardPage = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Placeholder Stats Cards */}
                {[1, 2, 3].map((item) => (
                    <div key={item} className="glass-card p-6 flex flex-col items-start gap-2">
                        <span className="text-slate-400 text-sm font-medium">Metric {item}</span>
                        <span className="text-3xl font-bold text-white">000</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DashboardPage;
