import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Vendas from './pages/Vendas';
import Alertas from './pages/Alertas';
import Acoes from './pages/Acoes';
import AcoesAnalise from './pages/AcoesAnalise';
import Encartes from './pages/Encartes';

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex min-h-screen bg-cometa-bg">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <main className={`${collapsed ? 'ml-16' : 'ml-64'} flex-1 p-8 transition-all duration-300`}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vendas" element={<Vendas />} />
          <Route path="/alertas" element={<Alertas />} />
          <Route path="/acoes" element={<Acoes />} />
          <Route path="/acoes-analise" element={<AcoesAnalise />} />
          <Route path="/encartes" element={<Encartes />} />
        </Routes>
      </main>
    </div>
  );
}
