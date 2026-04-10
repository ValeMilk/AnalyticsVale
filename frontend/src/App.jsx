import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Vendas from './pages/Vendas';
import Alertas from './pages/Alertas';
import Acoes from './pages/Acoes';
import AcoesAnalise from './pages/AcoesAnalise';

export default function App() {
  return (
    <div className="flex min-h-screen bg-cometa-bg">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vendas" element={<Vendas />} />
          <Route path="/alertas" element={<Alertas />} />
          <Route path="/acoes" element={<Acoes />} />
          <Route path="/acoes-analise" element={<AcoesAnalise />} />
        </Routes>
      </main>
    </div>
  );
}
