import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useTituloDaPagina } from '../context/PaginaContext';
import { FiltrosDeVendas, paramsDeVendas } from '../components/filtros/FiltrosDeVendas';
import { CartaoDeResumo, FaixaDeResumo } from '../components/indicadores/CartaoDeResumo';
import { TabelaDeDados } from '../components/tabela/TabelaDeDados';
import { useTabelaDeDados } from '../components/tabela/useTabelaDeDados';
import { MenuExportar } from '../components/tabela/MenuExportar';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { BadgeDeTipoDeAcao, LegendaDeAcoes } from '../components/BadgeDeTipoDeAcao';
import SalesChart from '../components/SalesChart';
import MonthlyDayChart from '../components/MonthlyDayChart';
import { ROTULO_BANDEIRA } from '../components/filtros/Segmentado';
import { normEan } from '../config/acoes';
import { fmtData, fmtDataCurta, fmtMoeda, fmtNumero, fmtPct, hojeLocal, primeiroDiaDoMes, soData } from '../lib/formatar';
import { cn } from '../lib/cn';

const COLUNAS_RANKING = [
  {
    id: 'posicao',
    tipo: 'custom',
    rotulo: '#',
    fixa: true,
    ordenavel: false,
    larguraClasse: 'w-10',
    papelNoCartao: 'oculto',
    exportar: (r) => r._pos,
    renderizar: (r) => (
      <span
        className={cn(
          'inline-flex size-6 items-center justify-center rounded-md text-xs font-bold tabular-nums',
          r._pos === 1 ? 'bg-warning/15 text-warning' : r._pos === 2 ? 'bg-neutral-200 text-neutral-600' : r._pos === 3 ? 'bg-tertiary/15 text-tertiary' : 'bg-neutral-100 text-neutral-500'
        )}
      >
        {r._pos}
      </span>
    ),
  },
  {
    id: 'produto',
    tipo: 'texto',
    rotulo: 'Produto',
    fixa: true,
    larguraClasse: 'min-w-56',
    valor: (r) => r.produto,
    renderizar: (r) => (
      <div className="min-w-0">
        <p className="font-medium text-neutral-900">{r.produto}</p>
        <p className="text-xs text-neutral-400">
          EAN {normEan(r.ean)}
          {r.cod_interno ? ` · Cód. ${r.cod_interno}` : ''}
        </p>
      </div>
    ),
  },
  { id: 'qtd_total', tipo: 'numero', rotulo: 'Qtd', formato: 'quantidade', valor: (r) => Number(r.qtd_total) },
  { id: 'venda_total', tipo: 'numero', rotulo: 'Venda', formato: 'moeda', valor: (r) => Number(r.venda_total) },
  { id: 'margem', tipo: 'numero', rotulo: 'Sell In', formato: 'moeda', ajuda: 'Percentual fixo sobre a venda: 70% Valemilk, 75% Valefish', valor: (r) => Number(r.margem) },
  {
    id: 'margem_percent',
    tipo: 'numero',
    rotulo: 'Sell In %',
    formato: 'percentual',
    valor: (r) => Number(r.margem_percent),
    renderizar: (r) => {
      const v = Number(r.margem_percent);
      return <Badge variant={v >= 20 ? 'sucesso' : v >= 10 ? 'info' : 'perigo'}>{fmtPct(v)}</Badge>;
    },
  },
];
const ORDENACAO_RANKING = { colunaId: 'venda_total', direcao: 'desc' };

function AcaoAtiva({ acao }) {
  return (
    <div className="flex items-start gap-3 rounded-sm border border-neutral-100 p-3 transition-colors hover:bg-neutral-50">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-800">{acao.produto}</p>
        <p className="mt-0.5 text-xs text-neutral-400">
          {fmtDataCurta(acao.data_inicio)} → {fmtDataCurta(acao.data_fim)} · {ROTULO_BANDEIRA[acao.vendor] ?? acao.vendor}
        </p>
      </div>
      <BadgeDeTipoDeAcao tipo={acao.tipo} tamanho="sm" className="shrink-0" />
    </div>
  );
}

function ErroInline({ mensagem, aoTentar }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm font-medium text-danger">Não foi possível carregar</p>
      <p className="text-xs text-neutral-500">{mensagem}</p>
      {aoTentar && (
        <Button variant="outline" size="sm" onClick={aoTentar}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

export default function Dashboard() {
  useTituloDaPagina('Dashboard', 'Visão consolidada Valemilk + Valefish');

  const padrao = useMemo(() => ({ data_inicio: primeiroDiaDoMes(0), data_fim: hojeLocal(), vendor: 'ambos', eans: [], loja_ids: [] }), []);
  const padraoMes = useMemo(() => ({ data_inicio: primeiroDiaDoMes(2), data_fim: hojeLocal(), vendor: 'ambos', eans: [], loja_ids: [] }), []);
  const [filtros, setFiltros] = useState(padrao);
  const [filtrosMes, setFiltrosMes] = useState(padraoMes);

  const [resumo, setResumo] = useState(undefined);
  const [vendasDia, setVendasDia] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const [vendasDiaMes, setVendasDiaMes] = useState([]);
  const [carregandoMes, setCarregandoMes] = useState(true);
  const [erroMes, setErroMes] = useState(null);

  const [acoes, setAcoes] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [lojas, setLojas] = useState([]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const params = paramsDeVendas(filtros);
      const [r1, r2, r3] = await Promise.all([
        api.get(`/analytics/resumo?${params}`),
        api.get(`/analytics/vendas-dia?${params}`),
        api.get(`/analytics/ranking?limit=10&${params}`),
      ]);
      setResumo(r1.data.data);
      setVendasDia(r2.data.data || []);
      setRanking((r3.data.data || []).map((r, i) => ({ ...r, _pos: i + 1 })));
    } catch (err) {
      setErro(err.response?.data?.error || err.message);
    } finally {
      setCarregando(false);
    }
  }, [filtros]);

  const carregarMes = useCallback(async () => {
    setCarregandoMes(true);
    setErroMes(null);
    try {
      const res = await api.get(`/analytics/vendas-dia-mes?${paramsDeVendas(filtrosMes)}`);
      setVendasDiaMes(res.data.data || []);
    } catch (err) {
      setErroMes(err.response?.data?.error || err.message);
    } finally {
      setCarregandoMes(false);
    }
  }, [filtrosMes]);

  useEffect(() => {
    carregar();
  }, [carregar]);
  useEffect(() => {
    carregarMes();
  }, [carregarMes]);

  useEffect(() => {
    api.get('/acoes').then((r) => setAcoes(r.data.data || [])).catch(() => setAcoes([]));
    api.get('/produtos').then((r) => setProdutos(r.data.data || [])).catch(() => {});
    api.get('/lojas').then((r) => setLojas(r.data.data || [])).catch(() => {});
  }, []);

  const hoje = hojeLocal();
  const acoesAtivas = useMemo(
    () =>
      (acoes || []).filter((a) => {
        const ini = soData(a.data_inicio);
        const fim = soData(a.data_fim);
        return ini && fim && hoje >= ini && hoje <= fim;
      }),
    [acoes, hoje]
  );

  const tabela = useTabelaDeDados({ linhas: ranking, colunas: COLUNAS_RANKING, ordenacaoPadrao: ORDENACAO_RANKING, passo: null });

  const filtrosParaExportar = [
    { rotulo: 'Período', valor: `${fmtData(filtros.data_inicio)} a ${fmtData(filtros.data_fim)}` },
    { rotulo: 'Bandeira', valor: ROTULO_BANDEIRA[filtros.vendor] ?? filtros.vendor },
  ];

  return (
    <div className="flex flex-col gap-6">
      <FiltrosDeVendas telaId="dashboard" filtros={filtros} onChange={setFiltros} padrao={padrao} produtos={produtos} lojas={lojas} />

      <FaixaDeResumo>
        <CartaoDeResumo rotulo="Total de vendas" valor={resumo && !carregando ? fmtMoeda(resumo.total_venda) : undefined} apoio={resumo ? `${resumo.total_lojas} lojas ativas` : undefined} />
        <CartaoDeResumo rotulo="Quantidade vendida" valor={resumo && !carregando ? fmtNumero(resumo.total_qtd) : undefined} apoio={resumo ? `${resumo.total_produtos} produtos` : undefined} />
        <CartaoDeResumo rotulo="Sell In" valor={resumo && !carregando ? fmtMoeda(resumo.total_margem) : undefined} apoio={resumo ? `${resumo.margem_percent}% da venda` : undefined} tom="sucesso" />
        <CartaoDeResumo rotulo="Ações ativas hoje" valor={acoes ? fmtNumero(acoesAtivas.length) : undefined} apoio="em vigor hoje" href="/acoes" tom={acoesAtivas.length ? 'alerta' : 'neutro'} />
      </FaixaDeResumo>

      <section className="superficie p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-neutral-800">Vendas totais por dia</h2>
          <LegendaDeAcoes />
        </div>
        {carregando ? <Skeleton className="h-80 w-full" /> : erro ? <ErroInline mensagem={erro} aoTentar={carregar} /> : <SalesChart data={vendasDia} acoes={acoes || []} vendor={filtros.vendor} eansFiltros={filtros.eans || []} />}
      </section>

      <section className="superficie p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-neutral-800">Vendas por dia do mês</h2>
            <p className="text-xs text-neutral-500">Cada linha é um mês · eixo X é o dia do mês</p>
          </div>
          <LegendaDeAcoes />
        </div>
        <div className="mb-4">
          <FiltrosDeVendas telaId="dashboard-mes" filtros={filtrosMes} onChange={setFiltrosMes} padrao={padraoMes} produtos={produtos} lojas={lojas} />
        </div>
        {carregandoMes ? <Skeleton className="h-72 w-full" /> : erroMes ? <ErroInline mensagem={erroMes} aoTentar={carregarMes} /> : <MonthlyDayChart data={vendasDiaMes} acoes={acoes || []} vendor={filtrosMes.vendor} eansFiltros={filtrosMes.eans || []} />}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="flex flex-col gap-3 xl:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-neutral-800">Top 10 produtos</h2>
            <MenuExportar titulo="Top 10 produtos" filtros={filtrosParaExportar} tabela={tabela} size="sm" desabilitado={carregando || !ranking.length} />
          </div>
          <TabelaDeDados tabela={tabela} chaveDaLinha={(r) => `${r.ean}-${r.cod_interno}`} carregando={carregando} erro={erro} aoTentarNovamente={carregar} vazio={{ mensagemVazio: 'Sem vendas no período', mensagemFiltrada: 'Nenhum produto corresponde aos filtros' }} />
        </section>

        <section className="superficie flex flex-col p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-800">Ações ativas</h2>
            <Link to="/acoes" className="text-xs font-medium text-secondary hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="flex max-h-[400px] flex-col gap-2 overflow-y-auto pr-1">
            {acoes === null ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : acoesAtivas.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-400">Nenhuma ação em vigor hoje</p>
            ) : (
              acoesAtivas.map((a) => <AcaoAtiva key={a._id} acao={a} />)
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
