import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Users, Menu, X, Box } from 'lucide-react';
import clsx from 'clsx';

const SidebarLink = ({ to, icon: Icon, label, onClick }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium",
                isActive
                    ? "bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)] border border-cyan-500/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            )
        }
    >
        <Icon size={20} className="group-hover:scale-110 transition-transform" />
        <span>{label}</span>
    </NavLink>
);

const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0f1e] to-black text-slate-100 font-sans selection:bg-cyan-500/30">

            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 glass sticky top-0 z-50 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg">
                        <Box size={20} className="text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">Inventario</span>
                </div>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            <div className="flex h-screen overflow-hidden">

                {/* Sidebar Backdrop (Mobile) */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside
                    className={clsx(
                        "fixed lg:static inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:translate-x-0 glass border-r border-white/5 flex flex-col",
                        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                >
                    <div className="p-6 flex items-center gap-3 border-b border-white/5">
                        <div className="p-2.5 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20">
                            <Box size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-xl tracking-tight">Inventario</h1>
                            <p className="text-xs text-slate-500 font-medium">Panel de Control</p>
                        </div>
                    </div>

                    <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Menu Principal</div>
                        <SidebarLink
                            to="/"
                            icon={LayoutDashboard}
                            label="Dashboard"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                        <SidebarLink
                            to="/inventory"
                            icon={Package}
                            label="Inventario"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                        <SidebarLink
                            to="/providers"
                            icon={Users}
                            label="Proveedores"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                    </nav>

                    <div className="p-4 border-t border-white/5">
                        <div className="glass-card p-4 flex items-center gap-3 bg-gradient-to-br from-slate-800/50 to-slate-900/50">
                            <div className="w-10 h-10 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-400 font-bold border border-cyan-500/20">
                                A
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium truncate">Admin User</p>
                                <p className="text-xs text-slate-500 truncate">admin@inventario.app</p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto relative scroll-smooth">
                    {/* Decorative background blobs */}
                    <div className="absolute top-0 left-0 w-full h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>

                    <div className="p-4 lg:p-8 max-w-7xl mx-auto pb-20">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
