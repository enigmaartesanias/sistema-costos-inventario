import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ProductionPage from './pages/ProductionPage';
import Catalog from './components/Catalog';
import SalesForm from './components/SalesForm';
import PurchaseForm from './components/PurchaseForm';
import ReportDashboard from './components/ReportDashboard';

// Componente para proteger rutas privadas
const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Layout básico con navegación (temporal)
const Layout = ({ children }) => {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      <nav className="bg-white shadow p-4 mb-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
          Joyería
        </h1>
        <button onClick={logout} className="text-sm text-red-500 font-medium">Salir</button>
      </nav>

      <main className="container mx-auto px-4">
        {children}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 flex justify-around text-xs shadow-lg z-20">
        <a href="/produccion" className="flex flex-col items-center p-2 text-gray-600 hover:text-purple-600">
          {/* Hammer Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9" /><path d="M17.64 15 22 10.64" /><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25V7.86c0-.55-.45-1-1-1H14.14c-.83 0-1.64.32-2.25.92L9.64 10" /><path d="m17.38 5.38-1.57 1.57c-.83.83-1.64 1.25-2.25 1.57" /></svg>
          <span className="mt-1">Producción</span>
        </a>
        <a href="/catalogo" className="flex flex-col items-center p-2 text-gray-600 hover:text-purple-600">
          {/* Grid/Catalog Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
          <span className="mt-1">Catálogo</span>
        </a>
        <a href="/ventas" className="flex flex-col items-center p-2 text-gray-600 hover:text-purple-600">
          {/* Shopping Bag Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
          <span className="mt-1">Venta</span>
        </a>
        <a href="/compras" className="flex flex-col items-center p-2 text-gray-600 hover:text-purple-600">
          {/* Shopping Cart Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
          <span className="mt-1">Compras</span>
        </a>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <div className="py-6">
                  <div className="mb-8 p-4">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Panel Principal</h2>
                    <p className="text-gray-500">Resumen del día</p>
                  </div>

                  <div className="px-4 mb-8">
                    <ReportDashboard />
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto px-4">
                    <a href="/produccion" className="block p-6 bg-purple-100 rounded-xl hover:bg-purple-200 transition">
                      <div className="text-4xl mb-2">🔨</div>
                      <div className="font-semibold text-purple-900">Producir</div>
                    </a>
                    <a href="/ventas" className="block p-6 bg-pink-100 rounded-xl hover:bg-pink-200 transition">
                      <div className="text-4xl mb-2">💰</div>
                      <div className="font-semibold text-pink-900">Vender</div>
                    </a>
                  </div>
                </div>
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/produccion" element={
            <PrivateRoute>
              <Layout>
                <ProductionPage />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/catalogo" element={
            <PrivateRoute>
              <Layout>
                <Catalog />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/ventas" element={
            <PrivateRoute>
              <Layout>
                <SalesForm />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/compras" element={
            <PrivateRoute>
              <Layout>
                <PurchaseForm />
              </Layout>
            </PrivateRoute>
          } />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
