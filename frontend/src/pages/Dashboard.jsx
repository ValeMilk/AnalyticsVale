import { useState, useEffect, useCallback } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Zap } from 'lucide-react';
import api from '../api/client';
import Filters from '../components/Filters';
import StatCard from '../components/StatCard';
import SalesChart from '../components/SalesChart';
import MonthlyDayChart from '../components/MonthlyDayChart';
import RankingTable from '../components/RankingTable';
import LoadingSpinner from '../components/LoadingSpinner';

const ACAO_COLORS = {
  encarte: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Encarte' },
  oferta_interna: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Oferta Interna' },
  rebaixa: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500', label: 'Rebaixa' },
};

function AcaoAtivaCard({ acao }) {
  const c = ACAO_COLORS[acao.tipo] || { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400', label: acao.tipo };
  const fmtDate = (d) => { if (!d) return ''; const s = typeof d === 'string' ? d : d.toISOString(); const [y,m,day] = s.slice(0,10).split('-'); return `${day}/${m}`; };
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
      <span className={`mt-1 flex-shrink-0 w-2.5 h-2.5 rounded-full ${c.dot}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{acao.produto}</p>
        <p className="text-xs text-slate-400 mt-0.5">{fmtDate(acao.data_inicio)} → {fmtDate(acao.data_fim)}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>{c.label}</span>
        <span className="text-xs text-slate-400">{acao.vendor}</span>
      </div>
    </div>
  );
}

const fmt = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function defaultFilters() {
  const hoje = new Date();
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  return {
    data_inicio: primeiroDia.toISOString().slice(0, 10),
    data_fim: hoje.toISOString().slice(0, 10),
    vendor: 'ambos',
    eans: [],
    loja_ids: [],
  };
}

function defaultFilters2() {
  const hoje = new Date();
  const tresAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
  return {
    data_inicio: tresAtras.toISOString().slice(0, 10),
    data_fim: hoje.toISOString().slice(0, 10),
    vendor: 'ambos',
    eans: [],
    loja_ids: [],
  };
}

// Monta query string suportando arrays — usa | como separador (EANs podem conter vírgula)
function buildParams(filters) {
  const p = new URLSearchParams();
  if (filters.data_inicio) p.set('data_inicio', filters.data_inicio);
  if (filters.data_fim) p.set('data_fim', filters.data_fim);
  if (filters.vendor) p.set('vendor', filters.vendor);
  if (filters.eans?.length) p.set('eans', filters.eans.join('|'));
  if (filters.loja_ids?.length) p.set('loja_ids', filters.loja_ids.join('|'));
  return p.toString();
}

export default function Dashboard() {
  const [filters, setFilters] = useState(defaultFilters);
  const [filters2, setFilters2] = useState(defaultFilters2);
  const [resumo, setResumo] = useState(null);
  const [vendasDia, setVendasDia] = useState([]);
  const [vendasDiaMes, setVendasDiaMes] = useState([]);
  const [loadingDiaMes, setLoadingDiaMes] = useState(true);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acoes, setAcoes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [lojas, setLojas] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildParams(filters);
      const [resResumo, resVendasDia, resRanking] = await Promise.all([
        api.get(`/analytics/resumo?${params}`),
        api.get(`/analytics/vendas-dia?${params}`),
        api.get(`/analytics/ranking?limit=10&${params}`),
      ]);
      setResumo(resResumo.data.data);
      setVendasDia(resVendasDia.data.data);
      setRanking(resRanking.data.data);
    } catch (err) {
      console.error('❌ Dashboard: Erro ao carregar dados:', err.message, err.response?.status);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchDiaMes = useCallback(async () => {
    setLoadingDiaMes(true);
    try {
      const params = buildParams(filters2);
      const res = await api.get(`/analytics/vendas-dia-mes?${params}`);
      setVendasDiaMes(res.data.data);
    } catch (err) {
      console.error('❌ Dashboard: Erro ao carregar vendas-dia-mes:', err.message);
    } finally {
      setLoadingDiaMes(false);
    }
  }, [filters2]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchDiaMes(); }, [fetchDiaMes]);

  useEffect(() => {
    api.get('/acoes').then(res => setAcoes(res.data.data || [])).catch(() => {});
    api.get('/produtos').then(res => setProdutos(res.data.data || [])).catch(() => {});
    api.get('/lojas').then(res => setLojas(res.data.data || [])).catch(() => {});
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Visão consolidada Valemilk + Valefish</p>
      </div>

      <Filters filters={filters} onChange={setFilters} produtos={produtos} lojas={lojas} />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Vendas"
          value={resumo ? fmt(resumo.total_venda) : '—'}
          sub={resumo ? `${resumo.total_lojas} lojas ativas` : ''}
          color="blue"
        />
        <StatCard
          icon={ShoppingCart}
          label="Qtd Vendida"
          value={resumo ? Number(resumo.total_qtd).toLocaleString('pt-BR') : '—'}
          sub={resumo ? `${resumo.total_produtos} produtos` : ''}
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Sell In"
          value={resumo ? fmt(resumo.total_margem) : '—'}
          sub={resumo ? `${resumo.margem_percent}% de sell in` : ''}
          color="amber"
        />
        <StatCard
          icon={Zap}
          label="Ações Ativas"
          value={acoes.filter(a => { const hoje = new Date().toISOString().slice(0,10); const ini = (typeof a.data_inicio === 'string' ? a.data_inicio : a.data_inicio?.toISOString?.() || '').slice(0,10); const fim = (typeof a.data_fim === 'string' ? a.data_fim : a.data_fim?.toISOString?.() || '').slice(0,10); return hoje >= ini && hoje <= fim; }).length}
          sub="em vigor hoje"
          color="amber"
        />
      </div>

      {/* Sales Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Vendas Totais</h2>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Encarte</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Oferta Interna</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Rebaixa</span>
          </div>
        </div>
        <SalesChart data={vendasDia} acoes={acoes} vendor={filters.vendor} eansFiltros={filters.eans || []} />
      </div>

      {/* Monthly Day Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Vendas por Dia do Mês</h2>
            <p className="text-sm text-slate-400">Cada linha representa um mês — eixo X é o dia do mês</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Encarte</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Oferta Interna</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Rebaixa</span>
          </div>
        </div>
        <div className="mb-4">
          <Filters filters={filters2} onChange={setFilters2} produtos={produtos} lojas={lojas} />
        </div>
        {loadingDiaMes
          ? <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Carregando...</div>
          : <MonthlyDayChart data={vendasDiaMes} acoes={acoes} vendor={filters2.vendor} eansFiltros={filters2.eans || []} />
        }
      </div>

      {/* Bottom Grid: Ranking + Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Top 10 Produtos</h2>
          <RankingTable data={ranking} limit={10} />
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Ações Ativas</h2>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {(() => {
              const hoje = new Date().toISOString().slice(0, 10);
              const ativas = acoes.filter(a => {
                const ini = (typeof a.data_inicio === 'string' ? a.data_inicio : a.data_inicio?.toISOString?.() || '').slice(0, 10);
                const fim = (typeof a.data_fim === 'string' ? a.data_fim : a.data_fim?.toISOString?.() || '').slice(0, 10);
                return hoje >= ini && hoje <= fim;
              });
              if (ativas.length === 0) return <p className="text-slate-400 text-sm text-center py-4">Nenhuma ação ativa hoje</p>;
              return ativas.map((a, i) => <AcaoAtivaCard key={i} acao={a} />);
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
