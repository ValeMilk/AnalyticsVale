import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3, Calendar, Search } from 'lucide-react';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

const fmt = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtPct = (v) => `${v > 0 ? '+' : ''}${Number(v).toFixed(1)}%`;
const fmtData = (s) => {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
};

const TIPOS = [
  { value: '', label: 'Todos' },
  { value: 'encarte', label: 'Encarte' },
  { value: 'oferta_interna', label: 'Oferta Interna' },
  { value: 'rebaixa', label: 'Rebaixa' },
];

const tipoColor = {
  encarte: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  oferta_interna: 'bg-green-500/10 text-green-600 border-green-500/20',
  rebaixa: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
};

const tipoLabel = { encarte: 'Encarte', oferta_interna: 'Oferta Interna', rebaixa: 'Rebaixa' };

function CelVariacao({ valor, isBase }) {
  if (isBase) return <td className="px-4 py-2.5 text-center text-xs text-slate-300 italic">base</td>;
  if (valor === null || valor === undefined) return <td className="px-4 py-2.5 text-center text-xs text-slate-300">—</td>;
  const pos = valor >= 0;
  return (
    <td className={`px-4 py-2.5 text-center text-xs font-bold ${pos ? 'text-green-600' : 'text-red-500'}`}>
      {valor > 0 ? '+' : ''}{Number(valor).toFixed(1)}%
    </td>
  );
}

function varVsBase(valorAtual, valorBase) {
  if (!valorBase || Number(valorBase) === 0) return null;
  return ((Number(valorAtual) - Number(valorBase)) / Number(valorBase)) * 100;
}

function ProdutoGrupo({ grupo }) {
  const { produto, ean, cod_interno, vendor, acoes } = grupo;
  const tiposBadge = [...new Set(acoes.map(a => a.acao.tipo))];

  // melhor ação = maior faturamento durante = base de comparação
  const melhorIdx = acoes.reduce((best, item, i) =>
    Number(item.periodo_acao.venda) > Number(acoes[best].periodo_acao.venda) ? i : best, 0);
  const base = acoes[melhorIdx];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header do produto */}
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900">{produto}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {cod_interno && <span>Cód. {cod_interno} · </span>}
            {vendor} · EAN: {ean?.replace(/,+$/, '')}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {tiposBadge.map(t => (
            <span key={t} className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${tipoColor[t] || tipoColor.encarte}`}>
              {tipoLabel[t]}
            </span>
          ))}
          <span className="text-xs text-slate-400 ml-2">{acoes.length} ação{acoes.length !== 1 ? 'ões' : ''}</span>
        </div>
      </div>

      {/* Tabela de comparação horizontal */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide w-36 bg-slate-50/60">Métrica</th>
              {acoes.map((item, i) => (
                <th key={i} className={`px-4 py-3 text-center min-w-[150px] border-l border-slate-100 ${i === melhorIdx && acoes.length > 1 ? 'bg-green-50/60' : ''}`}>
                  <div className="text-xs font-bold text-slate-700">
                    {fmtData(item.periodo_acao.inicio)} → {fmtData(item.periodo_acao.fim)}
                  </div>
                  {i === melhorIdx && acoes.length > 1 && (
                    <div className="text-[10px] text-green-600 font-semibold mt-1">★ Base (melhor resultado)</div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Preço */}
            <tr className="border-b border-slate-100 bg-slate-50/40">
              <td className="px-4 py-2.5 text-xs text-slate-400 font-medium bg-slate-50/60">Preço ação</td>
              {acoes.map((item, i) => (
                <td key={i} className={`px-4 py-2.5 text-center text-xs text-slate-600 border-l border-slate-100 ${i === melhorIdx && acoes.length > 1 ? 'bg-green-50/40' : ''}`}>
                  {fmt(item.acao.preco_acao)}
                  {item.acao.preco_normal && <span className="ml-1 text-slate-300 line-through">{fmt(item.acao.preco_normal)}</span>}
                </td>
              ))}
            </tr>
            {/* Quantidade */}
            <tr className="border-b border-slate-100">
              <td className="px-4 py-2.5 text-xs text-slate-400 font-medium bg-slate-50/60">Qtd vendida</td>
              {acoes.map((item, i) => (
                <td key={i} className={`px-4 py-2.5 text-center border-l border-slate-100 ${i === melhorIdx && acoes.length > 1 ? 'bg-green-50/40' : ''}`}>
                  <div className="text-sm font-bold text-slate-900">{Number(item.periodo_acao.qtd).toLocaleString('pt-BR')}</div>
                </td>
              ))}
            </tr>
            {/* Var Qtd vs base */}
            {acoes.length > 1 && (
              <tr className="border-b border-slate-100 bg-slate-50/40">
                <td className="px-4 py-2 text-xs text-slate-400 font-medium bg-slate-50/60 pl-6">↳ vs base</td>
                {acoes.map((item, i) => (
                  <CelVariacao key={i} isBase={i === melhorIdx} valor={varVsBase(item.periodo_acao.qtd, base.periodo_acao.qtd)} />
                ))}
              </tr>
            )}
            {/* Faturamento */}
            <tr className="border-b border-slate-100">
              <td className="px-4 py-2.5 text-xs text-slate-400 font-medium bg-slate-50/60">Faturamento</td>
              {acoes.map((item, i) => (
                <td key={i} className={`px-4 py-2.5 text-center border-l border-slate-100 ${i === melhorIdx && acoes.length > 1 ? 'bg-green-50/40' : ''}`}>
                  <div className="text-sm font-bold text-slate-900">{fmt(item.periodo_acao.venda)}</div>
                </td>
              ))}
            </tr>
            {/* Var Fat vs base */}
            {acoes.length > 1 && (
              <tr className="border-b border-slate-100 bg-slate-50/40">
                <td className="px-4 py-2 text-xs text-slate-400 font-medium bg-slate-50/60 pl-6">↳ vs base</td>
                {acoes.map((item, i) => (
                  <CelVariacao key={i} isBase={i === melhorIdx} valor={varVsBase(item.periodo_acao.venda, base.periodo_acao.venda)} />
                ))}
              </tr>
            )}
            {/* Sell In */}
            <tr className="border-b border-slate-100">
              <td className="px-4 py-2.5 text-xs text-slate-400 font-medium bg-slate-50/60">Sell In</td>
              {acoes.map((item, i) => (
                <td key={i} className={`px-4 py-2.5 text-center border-l border-slate-100 ${i === melhorIdx && acoes.length > 1 ? 'bg-green-50/40' : ''}`}>
                  <div className="text-sm font-bold text-slate-900">{fmt(item.periodo_acao.margem)}</div>
                </td>
              ))}
            </tr>
            {/* Var Sell In vs base */}
            {acoes.length > 1 && (
              <tr className="border-b border-slate-100 bg-slate-50/40">
                <td className="px-4 py-2 text-xs text-slate-400 font-medium bg-slate-50/60 pl-6">↳ vs base</td>
                {acoes.map((item, i) => (
                  <CelVariacao key={i} isBase={i === melhorIdx} valor={varVsBase(item.periodo_acao.margem, base.periodo_acao.margem)} />
                ))}
              </tr>
            )}
            {/* Resultado */}
            <tr>
              <td className="px-4 py-3 text-xs text-slate-400 font-medium bg-slate-50/60">Resultado</td>
              {acoes.map((item, i) => {
                const eEficaz = acoes.length > 1 ? i === melhorIdx : item.eficaz;
                return (
                  <td key={i} className={`px-4 py-3 text-center border-l border-slate-100 ${i === melhorIdx && acoes.length > 1 ? 'bg-green-50/40' : ''}`}>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${eEficaz ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                      {eEficaz ? '✓ Eficaz' : '✗ Ineficaz'}
                    </span>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AcoesAnalise() {
  const [analises, setAnalises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [compInicio, setCompInicio] = useState('');
  const [compFim, setCompFim] = useState('');
  const [buscaProduto, setBuscaProduto] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const searchParams = new URLSearchParams();
        if (filtroTipo) searchParams.set('tipo', filtroTipo);
        if (compInicio) searchParams.set('comp_inicio', compInicio);
        if (compFim) searchParams.set('comp_fim', compFim);
        const qs = searchParams.toString();
        const res = await api.get(`/acoes-analise${qs ? '?' + qs : ''}`);
        setAnalises(res.data.data);
      } catch (err) {
        console.error('Erro ao carregar análises:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [filtroTipo, compInicio, compFim]);

  const analiseFiltradas = analises.filter(a => {
    if (!buscaProduto) return true;
    const termo = buscaProduto.toLowerCase();
    return a.acao.produto?.toLowerCase().includes(termo) ||
      a.acao.ean?.includes(buscaProduto) ||
      a.acao.cod_interno?.toString().includes(buscaProduto);
  });

  // Agrupa por produto (chave = ean normalizado ou nome do produto)
  const grupos = useMemo(() => {
    const mapa = {};
    analiseFiltradas.forEach(item => {
      const key = item.acao.ean?.replace(/,+$/, '') || item.acao.produto;
      if (!mapa[key]) {
        mapa[key] = {
          produto: item.acao.produto,
          ean: item.acao.ean,
          cod_interno: item.acao.cod_interno,
          vendor: item.acao.vendor,
          acoes: [],
        };
      }
      mapa[key].acoes.push(item);
    });
    // Ordena ações de cada grupo por data de início
    Object.values(mapa).forEach(g => {
      g.acoes.sort((a, b) => (a.periodo_acao.inicio || '').localeCompare(b.periodo_acao.inicio || ''));
    });
    // Ordena grupos pelo nome do produto
    return Object.values(mapa).sort((a, b) => a.produto.localeCompare(b.produto));
  }, [analiseFiltradas]);

  // Nova lógica: por grupo, a melhor ação é eficaz; se só 1 ação, usa o resultado do backend
  const totalEficaz = grupos.reduce((acc, g) => {
    if (g.acoes.length === 1) return acc + (g.acoes[0].eficaz ? 1 : 0);
    return acc + 1; // cada grupo com múltiplas ações tem exatamente 1 eficaz (a melhor)
  }, 0);
  const totalIneficaz = analiseFiltradas.length - totalEficaz;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Análise de Eficácia</h1>
        <p className="text-slate-500 mt-1">Compare ações do mesmo produto lado a lado</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 text-center shadow-sm">
          <p className="text-3xl font-bold text-slate-900">{grupos.length}</p>
          <p className="text-sm text-slate-500 mt-1">Produtos</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 text-center shadow-sm">
          <p className="text-3xl font-bold text-slate-900">{analiseFiltradas.length}</p>
          <p className="text-sm text-slate-500 mt-1">Total de Ações</p>
        </div>
        <div className="bg-white rounded-xl border border-green-500/20 p-5 text-center shadow-sm">
          <p className="text-3xl font-bold text-green-600">{totalEficaz}</p>
          <p className="text-sm text-slate-500 mt-1">Eficazes</p>
        </div>
        <div className="bg-white rounded-xl border border-red-500/20 p-5 text-center shadow-sm">
          <p className="text-3xl font-bold text-red-600">{totalIneficaz}</p>
          <p className="text-sm text-slate-500 mt-1">Ineficazes</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          {/* Busca Produto */}
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Produto</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={buscaProduto} onChange={(e) => setBuscaProduto(e.target.value)}
                placeholder="Buscar por nome ou código..."
                className="bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-slate-900 text-xs focus:border-royal focus:outline-none w-56" />
            </div>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Tipo de Ação</label>
            <div className="flex gap-2">
              {TIPOS.map(t => (
                <button key={t.value} onClick={() => setFiltroTipo(t.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${filtroTipo === t.value ? 'bg-royal/10 text-royal border-royal/20' : 'border-slate-200 text-slate-500 hover:text-slate-900'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Período de Comparação */}
          <div className="flex items-end gap-2 ml-auto">
            <Calendar size={16} className="text-slate-400 mb-2" />
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Comparar com - Início</label>
              <input type="date" value={compInicio} onChange={(e) => setCompInicio(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 text-xs focus:border-royal focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Fim</label>
              <input type="date" value={compFim} onChange={(e) => setCompFim(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 text-xs focus:border-royal focus:outline-none" />
            </div>
            {(compInicio || compFim) && (
              <button onClick={() => { setCompInicio(''); setCompFim(''); }}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-900 border border-slate-200 hover:border-slate-300 transition-all">
                Limpar
              </button>
            )}
          </div>
        </div>
        {(compInicio && compFim) && (
          <p className="text-xs text-royal mt-3">Comparando com período customizado: {compInicio} → {compFim}</p>
        )}
        {(!compInicio && !compFim) && (
          <p className="text-xs text-slate-400 mt-3">Comparação automática: período equivalente anterior à ação</p>
        )}
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="space-y-4">
          {analiseFiltradas.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
              <BarChart3 size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-400 text-lg">Nenhuma análise disponível</p>
              <p className="text-slate-300 text-sm mt-1">Cadastre ações comerciais primeiro</p>
            </div>
          ) : grupos.map((grupo, i) => (
            <ProdutoGrupo key={grupo.ean || grupo.produto || i} grupo={grupo} />
          ))}
        </div>
      )}
    </div>
  );
}
