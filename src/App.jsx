import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ProductionPage from './pages/ProductionPage';
import Catalog from './components/Catalog';
import SalesForm from './components/SalesForm';
import PurchaseForm from './components/PurchaseForm';
import ReportDashboard from './components/ReportDashboard';
import InventoryReport from './components/InventoryReport';
import InventoryInitialForm from './components/InventoryInitialForm';

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
          Enigma sistema erp
        </h1>
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="text-sm text-gray-700 font-medium hover:text-purple-600 transition-colors px-3 py-1 hover:bg-purple-50 rounded-lg"
          >
            🏠 Panel
          </a>
          <a
            href="https://artesaniasenigma.com/admin"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-purple-600 font-medium hover:text-purple-700 transition-colors"
          >
            Panel Admin
          </a>
          <button onClick={logout} className="text-sm text-red-500 font-medium">Salir</button>
        </div>
      </nav>

      <main className="container mx-auto px-4">
        {children}
      </main>
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
                    <p className="text-gray-500">Gestión del taller</p>
                  </div>

                  <div className="px-4 mb-8">
                    <ReportDashboard />
                  </div>

                  {/* Grid de módulos - 3 columnas en desktop, 2 en tablet, 1 en móvil */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto px-4">
                    <a href="/produccion" className="block p-8 bg-purple-100 rounded-2xl hover:bg-purple-200 transition-all hover:shadow-lg">
                      <div className="text-5xl mb-3 text-center">🔨</div>
                      <div className="font-bold text-lg text-purple-900 text-center">Producción</div>
                    </a>
                    <a href="/ventas" className="block p-8 bg-pink-100 rounded-2xl hover:bg-pink-200 transition-all hover:shadow-lg">
                      <div className="text-5xl mb-3 text-center">💰</div>
                      <div className="font-bold text-lg text-pink-900 text-center">Ventas</div>
                    </a>
                    <a href="/catalogo" className="block p-8 bg-blue-100 rounded-2xl hover:bg-blue-200 transition-all hover:shadow-lg">
                      <div className="text-5xl mb-3 text-center">📦</div>
                      <div className="font-bold text-lg text-blue-900 text-center">Catálogo</div>
                    </a>
                    <a href="/compras" className="block p-8 bg-green-100 rounded-2xl hover:bg-green-200 transition-all hover:shadow-lg">
                      <div className="text-5xl mb-3 text-center">🛒</div>
                      <div className="font-bold text-lg text-green-900 text-center">Compras</div>
                    </a>
                    <a href="/inventario" className="block p-8 bg-amber-100 rounded-2xl hover:bg-amber-200 transition-all hover:shadow-lg">
                      <div className="text-5xl mb-3 text-center">📊</div>
                      <div className="font-bold text-lg text-amber-900 text-center">Inventario</div>
                    </a>
                    <a href="/stock-inicial" className="block p-8 bg-indigo-100 rounded-2xl hover:bg-indigo-200 transition-all hover:shadow-lg">
                      <div className="text-5xl mb-3 text-center">📝</div>
                      <div className="font-bold text-lg text-indigo-900 text-center">Stock Inicial</div>
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

          <Route path="/inventario" element={
            <PrivateRoute>
              <Layout>
                <InventoryReport />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/stock-inicial" element={
            <PrivateRoute>
              <Layout>
                <InventoryInitialForm />
              </Layout>
            </PrivateRoute>
          } />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
