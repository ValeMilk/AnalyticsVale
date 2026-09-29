import { useState, useEffect, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import api from '../api/client';
import { useTituloDaPagina } from '../context/PaginaContext';
import { AppHeader } from '../components/layout/AppHeader';
import { PainelDeFiltros, CampoDeFiltro, filtrosAtivos } from '../components/filtros/PainelDeFiltros';
import { SearchInput } from '../components/filtros/SearchInput';
import { Segmentado } from '../components/filtros/Segmentado';
import { CartaoDeResumo, FaixaDeResumo } from '../components/indicadores/CartaoDeResumo';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { BadgeDeTipoDeAcao } from '../components/BadgeDeTipoDeAcao';
import { TIPOS_ACAO, ROTULO_TIPO_ACAO, normEan } from '../config/acoes';
import { fmtData, fmtDiaSemana, fmtMoeda, fmtNumero, fmtPctComSinal, hojeLocal } from '../lib/formatar';
import { cn } from '../lib/cn';

const OPCOES_TIPO = [{ value: '', label: 'Todos' }, ...TIPOS_ACAO.map((t) => ({ value: t.value, label: t.label }))];

function CelVariacao({ valor, isBase, destaque }) {
  if (isBase) return <td className={cn('px-2 py-2 text-center text-xs italic text-neutral-400', destaque)}>base</td>;
  if (valor === null || valor === undefined) return <td className={cn('px-2 py-2 text-center text-xs text-neutral-300', destaque)}>—</td>;
  return <td className={cn('px-2 py-2 text-center text-xs font-bold tabular-nums', valor >= 0 ? 'text-success' : 'text-danger', destaque)}>{fmtPctComSinal(valor)}</td>;
}

function varVsBase(atual, base) {
  if (!base || Number(base) === 0) return null;
  return ((Number(atual) - Number(base)) / Number(base)) * 100;
}

/** Tabela pivô: uma coluna por ação do mesmo produto, lado a lado; a melhor (maior fat/dia) é a base. */
function ProdutoGrupo({ grupo }) {
  const { produto, ean, cod_interno, vendor, acoes } = grupo;
  const melhorIdx = acoes.reduce((best, item, i) => (Number(item.periodo_acao.venda_dia) > Number(acoes[best].periodo_acao.venda_dia) ? i : best), 0);
  const base = acoes[melhorIdx];
  const varias = acoes.length > 1;
  const destaque = (i) => (varias && i === melhorIdx ? 'bg-success/5' : '');
  const rotuloLinha = 'bg-neutral-50/70 px-2 py-2 text-xs font-medium text-neutral-500';

  return (
    <section className="superficie overflow-hidden">
      <header className="flex flex-col gap-2 border-b border-neutral-200 bg-neutral-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-neutral-900 sm:text-base">{produto}</h3>
          <p className="mt-0.5 text-xs text-neutral-500">
            {cod_interno && <span>Cód. {cod_interno} · </span>}
            {vendor} · EAN {normEan(ean)}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {[...new Set(acoes.map((a) => a.acao.tipo))].map((t) => (
            <BadgeDeTipoDeAcao key={t} tipo={t} tamanho="sm" />
          ))}
          <span className="text-xs text-neutral-500">{acoes.length === 1 ? '1 ação' : `${acoes.length} ações`}</span>
        </div>
      </header>

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-neutral-200">
              <th scope="col" className="w-28 bg-neutral-50/70 px-2 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                Métrica
              </th>
              {acoes.map((item, i) => (
                <th key={i} scope="col" className={cn('min-w-44 border-l border-neutral-100 px-2 py-3 text-center', destaque(i))}>
                  <div className="text-xs font-semibold text-neutral-700">
                    {fmtData(item.periodo_acao.inicio)} <span className="font-normal text-neutral-400">({fmtDiaSemana(item.periodo_acao.inicio)})</span>
                    {' → '}
                    {fmtData(item.periodo_acao.fim)} <span className="font-normal text-neutral-400">({fmtDiaSemana(item.periodo_acao.fim)})</span>
                  </div>
                  <BadgeDeTipoDeAcao tipo={item.acao.tipo} tamanho="sm" className="mt-1" />
                  {varias && i === melhorIdx && <div className="mt-1 text-[10px] font-semibold text-success">★ Base (melhor fat/dia)</div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-neutral-100">
              <td className={rotuloLinha}>Preço da ação</td>
              {acoes.map((item, i) => (
                <td key={i} className={cn('border-l border-neutral-100 px-2 py-2 text-center text-xs tabular-nums text-neutral-700', destaque(i))}>
                  {fmtMoeda(item.acao.preco_acao)}
                  {item.acao.preco_normal ? <span className="ml-1 text-neutral-400 line-through">{fmtMoeda(item.acao.preco_normal)}</span> : null}
                </td>
              ))}
            </tr>
            <tr className="border-b border-neutral-100">
              <td className={rotuloLinha}>
                Vendas ao preço
                <div className="text-[10px] font-normal text-neutral-400">PDV vs. cadastrado</div>
              </td>
              {acoes.map((item, i) => {
                const qtdPreco = item.periodo_acao.qtd_preco_acao || 0;
                const qtdTotal = item.periodo_acao.qtd || 0;
                const pct = qtdTotal > 0 ? (qtdPreco / qtdTotal) * 100 : 0;
                return (
                  <td key={i} className={cn('border-l border-neutral-100 px-2 py-2 text-center', destaque(i))}>
                    <div className="text-sm font-bold tabular-nums text-neutral-900">{fmtNumero(qtdPreco)} un.</div>
                    <div className={cn('text-[10px] font-semibold', pct >= 80 ? 'text-success' : pct >= 50 ? 'text-warning' : 'text-danger')}>{pct.toFixed(0)}% do total</div>
                  </td>
                );
              })}
            </tr>
            <tr className="border-b border-neutral-100">
              <td className={rotuloLinha}>Qtd/dia</td>
              {acoes.map((item, i) => (
                <td key={i} className={cn('border-l border-neutral-100 px-2 py-2 text-center', destaque(i))}>
                  <div className="text-sm font-bold tabular-nums text-neutral-900">{fmtNumero(item.periodo_acao.qtd_dia, 1)}</div>
                  <div className="text-[10px] text-neutral-400">
                    {fmtNumero(item.periodo_acao.qtd)} em {item.periodo_acao.dias}d
                  </div>
                </td>
              ))}
            </tr>
            {varias && (
              <tr className="border-b border-neutral-100">
                <td className={cn(rotuloLinha, 'pl-4')}>↳ vs. base</td>
                {acoes.map((item, i) => (
                  <CelVariacao key={i} isBase={i === melhorIdx} valor={varVsBase(item.periodo_acao.qtd_dia, base.periodo_acao.qtd_dia)} destaque={cn('border-l border-neutral-100', destaque(i))} />
                ))}
              </tr>
            )}
            <tr className="border-b border-neutral-100">
              <td className={rotuloLinha}>Fat/dia</td>
              {acoes.map((item, i) => (
                <td key={i} className={cn('border-l border-neutral-100 px-2 py-2 text-center', destaque(i))}>
                  <div className="text-sm font-bold tabular-nums text-neutral-900">{fmtMoeda(item.periodo_acao.venda_dia)}</div>
                  <div className="text-[10px] text-neutral-400">{fmtMoeda(item.periodo_acao.venda)} total</div>
                </td>
              ))}
            </tr>
            {varias && (
              <tr className="border-b border-neutral-100">
                <td className={cn(rotuloLinha, 'pl-4')}>↳ vs. base</td>
                {acoes.map((item, i) => (
                  <CelVariacao key={i} isBase={i === melhorIdx} valor={varVsBase(item.periodo_acao.venda_dia, base.periodo_acao.venda_dia)} destaque={cn('border-l border-neutral-100', destaque(i))} />
                ))}
              </tr>
            )}
            <tr className="border-b border-neutral-100">
              <td className={rotuloLinha}>Sell In/dia</td>
              {acoes.map((item, i) => (
                <td key={i} className={cn('border-l border-neutral-100 px-2 py-2 text-center', destaque(i))}>
                  <div className="text-sm font-bold tabular-nums text-neutral-900">{fmtMoeda(item.periodo_acao.margem_dia)}</div>
                  <div className="text-[10px] text-neutral-400">{fmtMoeda(item.periodo_acao.margem)} total</div>
                </td>
              ))}
            </tr>
            {varias && (
              <tr className="border-b border-neutral-100">
                <td className={cn(rotuloLinha, 'pl-4')}>↳ vs. base</td>
                {acoes.map((item, i) => (
                  <CelVariacao key={i} isBase={i === melhorIdx} valor={varVsBase(item.periodo_acao.margem_dia, base.periodo_acao.margem_dia)} destaque={cn('border-l border-neutral-100', destaque(i))} />
                ))}
              </tr>
            )}
            <tr>
              <td className={rotuloLinha}>Resultado</td>
              {acoes.map((item, i) => {
                const eficaz = varias ? i === melhorIdx : item.eficaz;
                return (
                  <td key={i} className={cn('border-l border-neutral-100 px-2 py-2 text-center', destaque(i))}>
                    <span className={cn('rounded-full border px-2.5 py-1 text-xs font-bold', eficaz ? 'border-success/30 bg-success/10 text-success' : 'border-danger/30 bg-danger/10 text-danger')}>
                      {eficaz ? '✓ Eficaz' : '✗ Ineficaz'}
                    </span>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function AcoesAnalise() {
  useTituloDaPagina('Análise de eficácia', 'Compare ações do mesmo produto lado a lado');

  const [analises, setAnalises] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [produtos, setProdutos] = useState([]);

  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState('');
  const [compInicio, setCompInicio] = useState('');
  const [compFim, setCompFim] = useState('');
  const [subcategoria, setSubcategoria] = useState('');
  const [eanSelecionado, setEanSelecionado] = useState('');

  useEffect(() => {
    api.get('/produtos').then((r) => setProdutos(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelado = false;
    const buscar = async () => {
      setCarregando(true);
      setErro(null);
      try {
        const p = new URLSearchParams();
        if (tipo) p.set('tipo', tipo);
        if (compInicio) p.set('comp_inicio', compInicio);
        if (compFim) p.set('comp_fim', compFim);
        const qs = p.toString();
        const res = await api.get(`/acoes-analise${qs ? `?${qs}` : ''}`);
        if (!cancelado) setAnalises(res.data.data || []);
      } catch (err) {
        if (!cancelado) setErro(err.response?.data?.error || err.message);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    };
    buscar();
    return () => {
      cancelado = true;
    };
  }, [tipo, compInicio, compFim]);

  const subcategorias = useMemo(() => [...new Set(produtos.map((p) => p.subcategoria).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [produtos]);
  const produtosDaSubcat = useMemo(() => (subcategoria ? produtos.filter((p) => p.subcategoria === subcategoria) : produtos), [produtos, subcategoria]);

  const eansAtivos = useMemo(() => {
    if (eanSelecionado) return [eanSelecionado];
    if (subcategoria) return produtosDaSubcat.map((p) => normEan(p.ean)).filter(Boolean);
    return [];
  }, [eanSelecionado, subcategoria, produtosDaSubcat]);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return analises.filter((a) => {
      if (eansAtivos.length > 0 && !eansAtivos.includes(normEan(a.acao.ean))) return false;
      if (q && !(a.acao.produto?.toLowerCase().includes(q) || normEan(a.acao.ean).includes(q) || String(a.acao.cod_interno ?? '').includes(q))) return false;
      return true;
    });
  }, [analises, eansAtivos, busca]);

  const grupos = useMemo(() => {
    const mapa = {};
    filtradas.forEach((item) => {
      const chave = normEan(item.acao.ean) || item.acao.produto;
      (mapa[chave] ||= { produto: item.acao.produto, ean: item.acao.ean, cod_interno: item.acao.cod_interno, vendor: item.acao.vendor, acoes: [] }).acoes.push(item);
    });
    Object.values(mapa).forEach((g) => g.acoes.sort((a, b) => (a.periodo_acao.inicio || '').localeCompare(b.periodo_acao.inicio || '')));
    return Object.values(mapa).sort((a, b) => a.produto.localeCompare(b.produto, 'pt-BR'));
  }, [filtradas]);

  const totalEficaz = grupos.reduce((acc, g) => acc + (g.acoes.length === 1 ? (g.acoes[0].eficaz ? 1 : 0) : 1), 0);
  const totalIneficaz = filtradas.length - totalEficaz;

  const ativos = filtrosAtivos([
    tipo && { id: 'tipo', rotulo: `Tipo: ${ROTULO_TIPO_ACAO[tipo]}`, onRemover: () => setTipo('') },
    subcategoria && {
      id: 'sub',
      rotulo: `Subcategoria: ${subcategoria}`,
      onRemover: () => {
        setSubcategoria('');
        setEanSelecionado('');
      },
    },
    eanSelecionado && { id: 'produto', rotulo: `Produto: ${produtos.find((p) => normEan(p.ean) === eanSelecionado)?.produto ?? eanSelecionado}`, onRemover: () => setEanSelecionado('') },
    (compInicio || compFim) && {
      id: 'comp',
      rotulo: `Comparação: ${fmtData(compInicio) || '…'} → ${fmtData(compFim) || '…'}`,
      onRemover: () => {
        setCompInicio('');
        setCompFim('');
      },
    },
  ]);
  const limparTudo = () => {
    setTipo('');
    setSubcategoria('');
    setEanSelecionado('');
    setCompInicio('');
    setCompFim('');
    setBusca('');
  };
  const temFiltro = ativos.length > 0 || Boolean(busca);

  return (
    <div className="flex flex-col gap-6">
      <AppHeader
        filters={
          <p className="text-sm text-neutral-500">
            {compInicio && compFim ? `Comparando com o período ${fmtData(compInicio)} → ${fmtData(compFim)}.` : 'Comparação automática: período equivalente imediatamente anterior a cada ação.'}
          </p>
        }
      />

      <FaixaDeResumo>
        <CartaoDeResumo rotulo="Produtos" valor={carregando ? undefined : fmtNumero(grupos.length)} />
        <CartaoDeResumo rotulo="Total de ações" valor={carregando ? undefined : fmtNumero(filtradas.length)} />
        <CartaoDeResumo rotulo="Eficazes" valor={carregando ? undefined : fmtNumero(totalEficaz)} tom="sucesso" />
        <CartaoDeResumo rotulo="Ineficazes" valor={carregando ? undefined : fmtNumero(totalIneficaz)} tom={totalIneficaz > 0 ? 'perigo' : 'neutro'} />
      </FaixaDeResumo>

      <PainelDeFiltros telaId="acoes-analise" ativos={ativos} onLimparTudo={limparTudo} abrirQuando={Boolean(compInicio || compFim)} slotFixo={<SearchInput value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto, EAN ou código..." />}>
        <CampoDeFiltro rotulo="Subcategoria" htmlFor="analise-sub">
          <Select
            id="analise-sub"
            value={subcategoria}
            onChange={(e) => {
              setSubcategoria(e.target.value);
              setEanSelecionado('');
            }}
          >
            <option value="">Todas</option>
            {subcategorias.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </CampoDeFiltro>
        <CampoDeFiltro rotulo="Produto" htmlFor="analise-produto">
          <Select id="analise-produto" value={eanSelecionado} onChange={(e) => setEanSelecionado(e.target.value)}>
            <option value="">Todos</option>
            {produtosDaSubcat.map((p) => (
              <option key={p.ean} value={normEan(p.ean)}>
                {p.produto}
              </option>
            ))}
          </Select>
        </CampoDeFiltro>
        <CampoDeFiltro rotulo="Tipo de ação">
          <Segmentado rotulo="Tipo de ação" opcoes={OPCOES_TIPO} valor={tipo} onChange={setTipo} className="h-10 items-center" />
        </CampoDeFiltro>
        <CampoDeFiltro rotulo="Comparar com — início" htmlFor="analise-comp-ini" ajuda="Deixe em branco para o período anterior automático">
          <Input id="analise-comp-ini" type="date" value={compInicio} max={hojeLocal()} onChange={(e) => setCompInicio(e.target.value)} />
        </CampoDeFiltro>
        <CampoDeFiltro rotulo="Comparar com — fim" htmlFor="analise-comp-fim">
          <Input id="analise-comp-fim" type="date" value={compFim} min={compInicio || undefined} max={hojeLocal()} onChange={(e) => setCompFim(e.target.value)} />
        </CampoDeFiltro>
      </PainelDeFiltros>

      {carregando ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : erro ? (
        <div className="superficie p-8 text-center">
          <p className="text-sm font-medium text-danger">Não foi possível carregar as análises</p>
          <p className="mt-1 text-xs text-neutral-500">{erro}</p>
        </div>
      ) : grupos.length === 0 ? (
        <div className="superficie flex flex-col items-center gap-3 p-12 text-center">
          <BarChart3 className="size-10 text-neutral-300" aria-hidden />
          <p className="text-base font-medium text-neutral-700">{temFiltro ? 'Nenhuma ação corresponde aos filtros' : 'Nenhuma análise disponível'}</p>
          <p className="text-sm text-neutral-400">{temFiltro ? 'Ajuste o recorte para ver outras ações.' : 'Cadastre ações comerciais para começar.'}</p>
          {temFiltro && (
            <Button variant="secondary" size="sm" onClick={limparTudo}>
              Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {grupos.map((g, i) => (
            <ProdutoGrupo key={normEan(g.ean) || g.produto || i} grupo={g} />
          ))}
        </div>
      )}
    </div>
  );
}
