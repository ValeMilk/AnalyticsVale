import { useState } from 'react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Bell, Tag, BarChart3, Newspaper, Store } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Vendas from './pages/Vendas';
import Alertas from './pages/Alertas';
import Acoes from './pages/Acoes';
import AcoesAnalise from './pages/AcoesAnalise';
import Encartes from './pages/Encartes';
import Concorrencia from './pages/Concorrencia';
import Admin from './pages/Admin';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';

const BOTTOM_NAV = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/acoes-analise', label: 'Análise', icon: BarChart3 },
  { to: '/encartes', label: 'Encartes', icon: Newspaper },
  { to: '/concorrencia', label: 'Mercado', icon: Store },
  { to: '/acoes', label: 'Ações', icon: Tag },
];

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AppShell() {
  const { user, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-cometa-bg"><LoadingSpinner /></div>;
  if (!user) return <Login />;

  return (
    <div className="flex min-h-screen bg-cometa-bg">
      {/* Sidebar — oculta no mobile */}
      <div className="hidden sm:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      </div>

      {/* Conteúdo principal */}
      <main className={`flex-1 p-4 sm:p-8 pb-20 sm:pb-8 transition-all duration-300 ${
        collapsed ? 'sm:ml-16' : 'sm:ml-64'
      }`}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vendas" element={<Vendas />} />
          <Route path="/alertas" element={<Alertas />} />
          <Route path="/acoes" element={<Acoes />} />
          <Route path="/acoes-analise" element={<AcoesAnalise />} />
          <Route path="/encartes" element={<Encartes />} />
          <Route path="/concorrencia" element={<Concorrencia />} />
          <Route path="/admin" element={
            <PrivateRoute adminOnly>
              <Admin />
            </PrivateRoute>
          } />
          <Route path="/login" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Bottom nav — apenas mobile */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex">
        {BOTTOM_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-royal' : 'text-slate-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-colors ${
                  isActive ? 'bg-royal/10' : ''
                }`}>
                  <Icon size={20} />
                </div>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/*" element={<AppShell />} />
    </Routes>
  );
}

function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen bg-cometa-bg"><LoadingSpinner /></div>;
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}
