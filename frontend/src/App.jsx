import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VisaoProvider } from './context/VisaoContext';
import { PaginaProvider, useTituloDaPagina } from './context/PaginaContext';
import { ToastProvider } from './components/ui/Toast';
import { CascaDaFerramenta } from './components/layout/CascaDaFerramenta';
import { buttonVariants } from './components/ui/Button';
import LoadingSpinner from './components/LoadingSpinner';
import { primeiraRota } from './config/menu';
import Dashboard from './pages/Dashboard';
import Vendas from './pages/Vendas';
import Alertas from './pages/Alertas';
import Acoes from './pages/Acoes';
import AcoesAnalise from './pages/AcoesAnalise';
import Encartes from './pages/Encartes';
import Concorrencia from './pages/Concorrencia';
import Admin from './pages/Admin';
import Login from './pages/Login';

export default function App() {
  return (
    <AuthProvider>
      <VisaoProvider>
        <PaginaProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </PaginaProvider>
      </VisaoProvider>
    </AuthProvider>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="app-bg flex min-h-screen items-center justify-center">
        <LoadingSpinner mensagem="Validando sessão..." />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={location.state?.de ?? primeiraRota(user)} replace /> : <Login />} />
      <Route
        path="/*"
        element={user ? <AreaAutenticada /> : <Navigate to="/login" replace state={{ de: `${location.pathname}${location.search}` }} />}
      />
    </Routes>
  );
}

// A casca só monta o esqueleto; a guarda de sessão fica aqui, por fora dela.
function AreaAutenticada() {
  return (
    <CascaDaFerramenta>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/vendas" element={<Vendas />} />
        <Route path="/alertas" element={<Alertas />} />
        <Route path="/acoes" element={<Acoes />} />
        <Route path="/acoes-analise" element={<AcoesAnalise />} />
        <Route path="/encartes" element={<Encartes />} />
        <Route path="/concorrencia" element={<Concorrencia />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NaoEncontrada />} />
      </Routes>
    </CascaDaFerramenta>
  );
}

function NaoEncontrada() {
  useTituloDaPagina('Página não encontrada');
  return (
    <div className="superficie mx-auto flex max-w-lg flex-col items-center gap-4 p-8 text-center">
      <p className="text-base font-semibold text-neutral-900">Esta página não existe</p>
      <p className="text-sm text-neutral-500">O endereço pode ter mudado ou foi digitado errado.</p>
      <Link to="/" className={buttonVariants({ variant: 'outline' })}>
        Voltar ao início
      </Link>
    </div>
  );
}
