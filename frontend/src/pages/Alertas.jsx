import { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, ShoppingCart } from 'lucide-react';
import api from '../api/client';
import AlertCard from '../components/AlertCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Alertas() {
  const [data, setData] = useState({ alertas: [], total: 0, criticos: 0, avisos: 0 });
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get('/alertas');
        setData(res.data.data || { alertas: [], total: 0, criticos: 0, avisos: 0 });
      } catch (err) {
        console.error('Erro ao carregar alertas:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const alertasFiltrados = data.alertas.filter((a) => {
    if (filtro === 'todos') return true;
    if (filtro === 'criticos') return a.tipo === 'critico';
    if (filtro === 'avisos') return a.tipo === 'aviso';
    return true;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Alertas</h1>
        <p className="text-slate-500 text-sm mt-1">Monitoramento automático de vendas</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{data.total}</p>
            <p className="text-xs text-slate-500">Total</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-red-500/20 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-600">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{data.criticos}</p>
            <p className="text-xs text-slate-500">Críticos</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-amber-500/20 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{data.avisos}</p>
            <p className="text-xs text-slate-500">Avisos</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'criticos', label: 'Críticos' },
          { key: 'avisos', label: 'Avisos' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFiltro(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filtro === key
                ? 'bg-royal/10 text-royal border border-royal/20'
                : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista de Alertas */}
      <div className="space-y-3">
        {alertasFiltrados.map((alerta, i) => (
          <AlertCard key={i} alerta={alerta} />
        ))}
        {alertasFiltrados.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <p className="text-slate-400 text-lg">Nenhum alerta encontrado</p>
            <p className="text-slate-300 text-sm mt-1">Todos os indicadores estão normais</p>
          </div>
        )}
      </div>
    </div>
  );
}
