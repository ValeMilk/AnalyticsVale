import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import api from '../api/client';
import Filters from '../components/Filters';
import LoadingSpinner from '../components/LoadingSpinner';

const fmt = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const ACAO_COLORS = {
  encarte: { bg: 'bg-blue-500/10', border: 'border-l-blue-500', label: 'Encarte', dot: 'bg-blue-400' },
  oferta_interna: { bg: 'bg-green-500/10', border: 'border-l-green-500', label: 'Oferta Interna', dot: 'bg-green-400' },
  rebaixa: { bg: 'bg-orange-500/10', border: 'border-l-orange-500', label: 'Rebaixa', dot: 'bg-orange-400' },
};

function defaultFilters() {
  const hoje = new Date();
  const trintaDias = new Date(hoje);
  trintaDias.setDate(hoje.getDate() - 30);
  return {
    data_inicio: trintaDias.toISOString().slice(0, 10),
    data_fim: hoje.toISOString().slice(0, 10),
    vendor: 'ambos',
  };
}

export default function Vendas() {
  const [filters, setFilters] = useState(defaultFilters);
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [acoes, setAcoes] = useState([]);
  const [acoesLoaded, setAcoesLoaded] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters).toString();
      const { data } = await api.get(`/vendas?${params}`);
      setVendas(data.data || []);
    } catch (err) {
      console.error('Erro ao carregar vendas:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Carrega ações comerciais para highlight
  useEffect(() => {
    api.get('/acoes').then(res => { setAcoes(res.data.data || []); setAcoesLoaded(true); }).catch(() => setAcoesLoaded(true));
  }, []);

  // Verifica se uma venda (data + cod_interno) cai dentro de alguma ação
  const getAcaoParaVenda = (venda) => {
    const dataVenda = venda.data?.slice(0, 10);
    if (!dataVenda) return null;
    const codVenda = venda.cod_interno?.toString().trim();
    const eanVenda = venda.ean?.replace(/,/g, '').trim();
    return acoes.find(a => {
      const ini = a.data_inicio?.slice(0, 10);
      const ending = a.data_fim?.slice(0, 10);
      if (!(ini <= dataVenda && ending >= dataVenda)) return false;
      // Match por cod_interno (preferido) ou EAN normalizado
      const codAcao = a.cod_interno?.toString().trim();
      if (codVenda && codAcao && codVenda === codAcao) return true;
      const eanAcao = a.ean?.replace(/,/g, '').trim();
      return eanVenda && eanAcao && eanVenda === eanAcao;
    }) || null;
  };

  const filtered = vendas.filter((v) => {
    return !search || v.produto?.toLowerCase().includes(search.toLowerCase()) || v.ean?.includes(search);
  });

  if (loading || !acoesLoaded) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vendas</h1>
        <p className="text-slate-500 text-sm mt-1">Dados consolidados de vendas diárias</p>
      </div>

      {/* Filtros */}
      <Filters filters={filters} onChange={setFilters} />

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
      </div>

      {/* Tabela */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span>Legenda:</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500/30 border-l-2 border-blue-500" /> Encarte</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500/30 border-l-2 border-green-500" /> Oferta Interna</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500/30 border-l-2 border-orange-500" /> Rebaixa</span>
      </div>

      {/* Tabela dados */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Loja</th>
                <th className="px-4 py-3">Bandeira</th>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">EAN</th>
                <th className="px-4 py-3 text-right">Qtd</th>
                <th className="px-4 py-3 text-right">Venda</th>
                <th className="px-4 py-3 text-right">Custo</th>
                <th className="px-4 py-3 text-right">Sell In</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((v, i) => {
                const margem = (Number(v.venda) || 0) - (Number(v.custo) || 0);
                const acaoAtiva = getAcaoParaVenda(v);
                const cor = acaoAtiva ? ACAO_COLORS[acaoAtiva.tipo] : null;
                return (
                  <tr key={i} className={`border-b border-slate-100 transition-colors ${cor ? `${cor.bg} border-l-4 ${cor.border}` : 'hover:bg-slate-50'}`}>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="flex items-center gap-2">
                        {v.data?.slice(0, 10)}
                        {cor && <span className={`w-2 h-2 rounded-full ${cor.dot}`} title={cor.label} />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-900">{v.nome_loja}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                        v.bandeira === 'Valemilk' ? 'bg-royal/10 text-royal' : 'bg-cyan-500/10 text-cyan-600'
                      }`}>
                        {v.bandeira}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-900 max-w-[200px] truncate">{v.produto}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{v.ean}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{v.qtd}</td>
                    <td className="px-4 py-3 text-right text-slate-900 font-medium">{fmt(v.venda)}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{fmt(v.custo)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${margem >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {fmt(margem)}
                    </td>
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
