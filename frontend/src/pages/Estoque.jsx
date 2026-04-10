import { useState, useEffect, useCallback } from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Estoque() {
  const [estoque, setEstoque] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [vendor, setVendor] = useState('ambos');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/estoque?vendor=${vendor}`);
      setEstoque(data.data || []);
    } catch (err) {
      console.error('Erro ao carregar estoque:', err);
    } finally {
      setLoading(false);
    }
  }, [vendor]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = estoque.filter((item) => {
    const matchSearch = !search
      || item.descricao_produto?.toLowerCase().includes(search.toLowerCase())
      || item.ean?.includes(search);
    const qtd = Number(item.estq_loja) || 0;
    const matchStatus = filtroStatus === 'todos'
      || (filtroStatus === 'zerado' && qtd === 0)
      || (filtroStatus === 'baixo' && qtd > 0 && qtd <= 50)
      || (filtroStatus === 'ok' && qtd > 50);
    return matchSearch && matchStatus;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Estoque</h1>
        <p className="text-slate-500 text-sm mt-1">Posição de estoque por loja e produto</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar produto ou EAN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-royal"
          />
        </div>
        <div className="flex gap-2">
          {['ambos', 'valemilk', 'valefish'].map((v) => (
            <button
              key={v}
              onClick={() => setVendor(v)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                vendor === v
                  ? 'bg-royal/10 text-royal border border-royal/20'
                  : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-900'
              }`}
            >
              {v === 'ambos' ? 'Todas' : v === 'valemilk' ? 'Valemilk' : 'Valefish'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {[
            { key: 'todos', label: 'Todos' },
            { key: 'zerado', label: 'Zerado' },
            { key: 'baixo', label: 'Baixo' },
            { key: 'ok', label: 'OK' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFiltroStatus(key)}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filtroStatus === key
                  ? key === 'zerado' ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                    : key === 'baixo' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                    : 'bg-royal/10 text-royal border border-royal/20'
                  : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">EAN</th>
                <th className="px-4 py-3">Loja</th>
                <th className="px-4 py-3">Bandeira</th>
                <th className="px-4 py-3 text-right">Estoque</th>
                <th className="px-4 py-3 text-right">Avaria</th>
                <th className="px-4 py-3">Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((item, i) => {
                const qtd = Number(item.estq_loja) || 0;
                const avaria = Number(item.estq_avaria) || 0;
                const status = qtd === 0 ? 'zerado' : qtd <= 50 ? 'baixo' : 'ok';

                return (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      {status === 'zerado' && (
                        <span className="flex items-center gap-1 text-red-400 text-xs font-semibold">
                          <AlertTriangle size={14} /> ZERADO
                        </span>
                      )}
                      {status === 'baixo' && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 text-xs font-medium">BAIXO</span>
                      )}
                      {status === 'ok' && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 text-xs font-medium">OK</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-900 max-w-[200px] truncate">{item.descricao_produto}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{item.ean}</td>
                    <td className="px-4 py-3 text-slate-600">{item.loja_id}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                        item.bandeira === 'Valemilk' ? 'bg-royal/10 text-royal' : 'bg-cyan-500/10 text-cyan-600'
                      }`}>
                        {item.bandeira}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${
                      status === 'zerado' ? 'text-red-600' : status === 'baixo' ? 'text-amber-600' : 'text-slate-900'
                    }`}>
                      {qtd}
                    </td>
                    <td className={`px-4 py-3 text-right ${avaria > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                      {avaria}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{item.snapshot_ts}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-200 text-xs text-slate-400">
          Exibindo {Math.min(filtered.length, 200)} de {filtered.length} registros
        </div>
      </div>
    </div>
  );
}
