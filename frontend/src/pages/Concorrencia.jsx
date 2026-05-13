import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, TrendingDown, TrendingUp, Minus, RefreshCw, Store, Calendar, Tag } from 'lucide-react';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

const fmt = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—';

function DiffBadge({ nosso, concorrente }) {
  if (!nosso) return null;
  const diff = nosso - concorrente;
  const pct = ((diff / nosso) * 100).toFixed(1);
  if (Math.abs(diff) < 0.01) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
        <Minus size={11} /> Igual
      </span>
    );
  }
  if (diff > 0) {
    // concorrente mais barato
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
        <TrendingDown size={11} /> {pct}% mais barato
      </span>
    );
  }
  // concorrente mais caro
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-600">
      <TrendingUp size={11} /> {Math.abs(pct)}% mais caro
    </span>
  );
}

function ItemCard({ item }) {
  const ativo = item.validity_start_date <= new Date().toISOString().slice(0, 10) &&
                item.validity_finish_date >= new Date().toISOString().slice(0, 10);

  return (
    <div className={`bg-white rounded-xl border ${item.nossa_acao ? 'border-royal/30' : 'border-slate-200'} p-4 shadow-sm`}>
      <div className="flex items-start gap-3">
        {/* Badge rede */}
        <div className="shrink-0 mt-0.5">
          <span className="inline-block bg-slate-100 text-slate-700 text-xs font-bold px-2 py-1 rounded-lg">
            {item.network_name || '—'}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <p className="text-sm font-semibold text-slate-800 leading-tight">{item.description}</p>
            <p className="text-base font-bold text-slate-900 shrink-0">{fmt(item.value)}</p>
          </div>

          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar size={11} />
              {fmtDate(item.validity_start_date)} → {fmtDate(item.validity_finish_date)}
            </span>
            {item.leaflet_name && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Tag size={11} />
                {item.leaflet_name}
              </span>
            )}
            {ativo && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                Ativo
              </span>
            )}
          </div>

          {/* Nossa ação (conflito de período) */}
          {item.nossa_acao && (
            <div className="mt-2 flex flex-wrap items-center gap-2 bg-royal/5 border border-royal/20 rounded-lg px-3 py-2">
              <span className="text-xs text-slate-500">Nossa ação ({item.nossa_acao.tipo}):</span>
              <span className="text-xs font-bold text-royal">{fmt(item.nossa_acao.preco_acao)}</span>
              <span className="text-xs text-slate-400">
                {fmtDate(item.nossa_acao.data_inicio?.slice(0,10))} → {fmtDate(item.nossa_acao.data_fim?.slice(0,10))}
              </span>
              <DiffBadge nosso={item.nossa_acao.preco_acao} concorrente={item.value} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Concorrencia() {
  const [dados, setDados] = useState([]);
  const [redes, setRedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [redeSel] = useState('COMETA'); // sempre filtrado por COMETA
  const [somenteConflito, setSomenteConflito] = useState(false);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const debounceRef = useRef(null);

  // Debounce na busca: só dispara request 600ms após parar de digitar
  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchDebounced(val), 600);
  };

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const params = new URLSearchParams();
      if (searchDebounced) params.set('search', searchDebounced);
      if (redeSel) params.set('network', redeSel);
      if (dataInicio) params.set('data_inicio', dataInicio);
      if (dataFim) params.set('data_fim', dataFim);

      const res = await api.get(`/concorrencia?${params}`);
      setDados(res.data.data || []);
      setRedes(res.data.metadata?.redes || []);
    } catch (err) {
      setErro(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [searchDebounced, redeSel, dataInicio, dataFim]);

  useEffect(() => { carregar(); }, [carregar]);

  const filtrados = somenteConflito ? dados.filter(d => d.nossa_acao) : dados;

  const conflitos = dados.filter(d => d.nossa_acao).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Concorrência</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Ações promocionais dos concorrentes</p>
        </div>
        <button
          onClick={carregar}
          disabled={loading}
          className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-royal hover:border-royal/30 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Resumo rápido */}
      {!loading && !erro && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Total de ações</p>
            <p className="text-2xl font-bold text-slate-900">{dados.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Redes monitoradas</p>
            <p className="text-2xl font-bold text-slate-900">{redes.length}</p>
          </div>
          <div className={`col-span-2 sm:col-span-1 bg-white rounded-xl border p-4 shadow-sm ${conflitos > 0 ? 'border-red-200 bg-red-50' : 'border-slate-200'}`}>
            <p className="text-xs text-slate-500 mb-1">Conflito com nossas ações</p>
            <p className={`text-2xl font-bold ${conflitos > 0 ? 'text-red-600' : 'text-slate-900'}`}>{conflitos}</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        {/* Rede fixada */}
        <div className="flex items-center gap-2">
          <Store size={14} className="text-slate-400" />
          <span className="text-xs text-slate-500">Rede monitorada:</span>
          <span className="text-xs font-bold text-royal bg-royal/10 px-2 py-0.5 rounded-full">COMETA</span>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar produto ou EAN..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:border-royal focus:outline-none"
          />
        </div>

        {/* Datas */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">De</label>
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:border-royal focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Até</label>
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:border-royal focus:outline-none" />
          </div>
        </div>

        {/* Toggle conflitos */}
        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <div
            onClick={() => setSomenteConflito(v => !v)}
            className={`w-10 h-5 rounded-full transition-colors relative ${somenteConflito ? 'bg-royal' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${somenteConflito ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-sm text-slate-600 font-medium">Somente conflitos com nossas ações</span>
        </label>
      </div>

      {/* Lista */}
      {loading && (
        <div className="flex justify-center py-16">
          <LoadingSpinner message="Carregando dados do mercado..." />
        </div>
      )}

      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-semibold mb-1">Erro ao carregar</p>
          <p className="text-red-500 text-sm">{erro}</p>
          <button onClick={carregar} className="mt-3 px-4 py-2 bg-red-100 text-red-600 rounded-xl text-sm font-medium hover:bg-red-200 transition-colors">
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !erro && filtrados.length === 0 && (
        <div className="text-center py-16">
          <Store size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-400 font-medium">Nenhuma ação encontrada</p>
        </div>
      )}

      {!loading && !erro && filtrados.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">{filtrados.length} ação(ões) encontrada(s)</p>
          {filtrados.map((item, i) => (
            <ItemCard key={`${item.item_id}_${item.leaflet_id}_${i}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
