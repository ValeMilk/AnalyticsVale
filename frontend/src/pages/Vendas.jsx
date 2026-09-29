import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/client';
import { useTituloDaPagina } from '../context/PaginaContext';
import { AppHeader } from '../components/layout/AppHeader';
import { FiltrosDeVendas } from '../components/filtros/FiltrosDeVendas';
import { SearchInput } from '../components/filtros/SearchInput';
import { ROTULO_BANDEIRA } from '../components/filtros/Segmentado';
import { TabelaDeDados } from '../components/tabela/TabelaDeDados';
import { useTabelaDeDados } from '../components/tabela/useTabelaDeDados';
import { GerenciadorDeColunas } from '../components/tabela/GerenciadorDeColunas';
import { MenuExportar } from '../components/tabela/MenuExportar';
import { Badge } from '../components/ui/Badge';
import { BadgeDeTipoDeAcao } from '../components/BadgeDeTipoDeAcao';
import { ROTULO_TIPO_ACAO, normEan } from '../config/acoes';
import { fmtData, fmtMoeda, hojeLocal, soData, somarDias } from '../lib/formatar';

// Barra lateral colorida por tipo de ação (via variável CSS dos tokens)
const CLASSE_LINHA_POR_TIPO = {
  encarte: '[&>td:first-child]:shadow-[inset_4px_0_0_var(--acao-encarte)]',
  oferta_interna: '[&>td:first-child]:shadow-[inset_4px_0_0_var(--acao-oferta-interna)]',
  rebaixa: '[&>td:first-child]:shadow-[inset_4px_0_0_var(--acao-rebaixa)]',
};

// Ação vigente para uma venda (data dentro do período + mesmo código interno ou EAN)
function acaoDaVenda(venda, acoes) {
  const dataVenda = soData(venda.data);
  if (!dataVenda) return null;
  const codVenda = venda.cod_interno != null ? String(venda.cod_interno).trim() : '';
  const eanVenda = normEan(venda.ean);
  return (
    acoes.find((a) => {
      const ini = soData(a.data_inicio);
      const fim = soData(a.data_fim);
      if (!ini || !fim || !(ini <= dataVenda && fim >= dataVenda)) return false;
      const codAcao = a.cod_interno != null ? String(a.cod_interno).trim() : '';
      if (codVenda && codAcao && codVenda === codAcao) return true;
      const eanAcao = normEan(a.ean);
      return Boolean(eanVenda && eanAcao && eanVenda === eanAcao);
    }) || null
  );
}

function montarColunas(acoes) {
  return [
    { id: 'data', tipo: 'data', rotulo: 'Data', fixa: true, larguraClasse: 'w-28', papelNoCartao: 'etiqueta', valor: (v) => soData(v.data), renderizar: (v) => fmtData(v.data) },
    { id: 'produto', tipo: 'texto', rotulo: 'Produto', fixa: true, larguraClasse: 'min-w-56', papelNoCartao: 'titulo', valor: (v) => v.produto },
    { id: 'loja', tipo: 'categoria', rotulo: 'Loja', comBusca: true, valor: (v) => v.nome_loja },
    {
      id: 'bandeira',
      tipo: 'categoria',
      rotulo: 'Bandeira',
      valor: (v) => v.bandeira,
      renderizar: (v) => <Badge variant={v.bandeira === 'Valemilk' ? 'info' : 'neutro'}>{v.bandeira}</Badge>,
    },
    {
      id: 'acao',
      tipo: 'categoria',
      rotulo: 'Ação',
      ajuda: 'Ação comercial em vigor na data da venda para este produto',
      papelNoCartao: 'status',
      valor: (v) => {
        const a = acaoDaVenda(v, acoes);
        return a ? ROTULO_TIPO_ACAO[a.tipo] ?? a.tipo : null;
      },
      renderizar: (v) => {
        const a = acaoDaVenda(v, acoes);
        return a ? <BadgeDeTipoDeAcao tipo={a.tipo} /> : <span className="text-neutral-400">-</span>;
      },
    },
    { id: 'ean', tipo: 'texto', rotulo: 'EAN', escondeNoCelular: true, valor: (v) => normEan(v.ean) },
    { id: 'cod_interno', tipo: 'texto', rotulo: 'Código', padrao: false, valor: (v) => (v.cod_interno != null ? String(v.cod_interno) : null) },
    { id: 'qtd', tipo: 'numero', rotulo: 'Qtd', formato: 'quantidade', valor: (v) => Number(v.qtd) },
    { id: 'venda', tipo: 'numero', rotulo: 'Venda', formato: 'moeda', valor: (v) => Number(v.venda) },
    { id: 'custo', tipo: 'numero', rotulo: 'Custo', formato: 'moeda', escondeNoCelular: true, valor: (v) => (v.custo == null ? null : Number(v.custo)) },
    {
      id: 'margem',
      tipo: 'numero',
      rotulo: 'Sell In',
      formato: 'moeda',
      ajuda: 'Venda menos o custo informado na linha',
      valor: (v) => Number(v.venda || 0) - Number(v.custo || 0),
    },
  ];
}

const ORDENACAO_PADRAO = { colunaId: 'data', direcao: 'desc' };

export default function Vendas() {
  useTituloDaPagina('Vendas', 'Vendas diárias por loja e produto');

  const padrao = useMemo(() => ({ data_inicio: somarDias(hojeLocal(), -30), data_fim: hojeLocal(), vendor: 'ambos', eans: [], loja_ids: [] }), []);
  const [filtros, setFiltros] = useState(padrao);
  const [busca, setBusca] = useState('');
  const [vendas, setVendas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [acoes, setAcoes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [lojas, setLojas] = useState([]);

  useEffect(() => {
    api.get('/produtos').then((r) => setProdutos(r.data.data || [])).catch(() => {});
    api.get('/lojas').then((r) => setLojas(r.data.data || [])).catch(() => {});
    api.get('/acoes').then((r) => setAcoes(r.data.data || [])).catch(() => {});
  }, []);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const params = new URLSearchParams();
      if (filtros.data_inicio) params.set('data_inicio', filtros.data_inicio);
      if (filtros.data_fim) params.set('data_fim', filtros.data_fim);
      if (filtros.vendor) params.set('vendor', filtros.vendor);
      filtros.eans?.forEach((e) => params.append('eans[]', e));
      filtros.loja_ids?.forEach((l) => params.append('loja_ids[]', l));
      const { data } = await api.get(`/vendas?${params.toString()}`);
      setVendas(data.data || []);
    } catch (err) {
      setErro(err.response?.data?.error || err.message);
    } finally {
      setCarregando(false);
    }
  }, [filtros]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const colunas = useMemo(() => montarColunas(acoes), [acoes]);

  const linhas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return vendas;
    return vendas.filter((v) => v.produto?.toLowerCase().includes(q) || normEan(v.ean).includes(q) || String(v.cod_interno ?? '').includes(q));
  }, [vendas, busca]);

  const tabela = useTabelaDeDados({ linhas, colunas, ordenacaoPadrao: ORDENACAO_PADRAO, baseDasOpcoes: vendas, passo: 100 });

  const totais = useCallback(
    (lista) =>
      lista.reduce(
        (acc, v) => {
          acc.qtd += Number(v.qtd || 0);
          acc.venda += Number(v.venda || 0);
          acc.custo += Number(v.custo || 0);
          acc.margem += Number(v.venda || 0) - Number(v.custo || 0);
          return acc;
        },
        { qtd: 0, venda: 0, custo: 0, margem: 0 }
      ),
    []
  );
  const totaisDaTela = useMemo(() => totais(tabela.linhasFiltradas), [tabela.linhasFiltradas, totais]);

  const filtrosParaExportar = [
    { rotulo: 'Período', valor: `${fmtData(filtros.data_inicio)} a ${fmtData(filtros.data_fim)}` },
    { rotulo: 'Bandeira', valor: ROTULO_BANDEIRA[filtros.vendor] ?? filtros.vendor },
    ...(busca ? [{ rotulo: 'Busca', valor: busca }] : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <AppHeader
        filters={<p className="text-sm text-neutral-500">Até 1.000 linhas por bandeira, mais recentes primeiro. Restrinja o período ou os produtos para ver tudo.</p>}
        actionsSlot={
          <>
            <MenuExportar titulo="Vendas" filtros={filtrosParaExportar} tabela={tabela} linhasCompletas={vendas} totais={totais} desabilitado={carregando || !vendas.length} />
            <GerenciadorDeColunas {...tabela.propsDoGerenciador} />
          </>
        }
      />

      <FiltrosDeVendas
        telaId="vendas"
        filtros={filtros}
        onChange={setFiltros}
        padrao={padrao}
        produtos={produtos}
        lojas={lojas}
        slotFixo={<SearchInput value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto, EAN ou código..." />}
      />

      <TabelaDeDados
        tabela={tabela}
        chaveDaLinha={(v, i) => `${v.data}-${v.loja_id}-${v.ean}-${v.plu ?? ''}-${i ?? ''}`}
        classeDaLinha={(v) => {
          const a = acaoDaVenda(v, acoes);
          return a ? CLASSE_LINHA_POR_TIPO[a.tipo] : undefined;
        }}
        carregando={carregando}
        erro={erro}
        aoTentarNovamente={carregar}
        temFiltroDeTela={Boolean(busca)}
        onLimparFiltrosDeTela={() => setBusca('')}
        fixarPrimeiraColuna
        totais={{
          qtd: totaisDaTela.qtd.toLocaleString('pt-BR', { maximumFractionDigits: 2 }),
          venda: fmtMoeda(totaisDaTela.venda),
          custo: fmtMoeda(totaisDaTela.custo),
          margem: fmtMoeda(totaisDaTela.margem),
        }}
        vazio={{ mensagemVazio: 'Nenhuma venda no período', mensagemFiltrada: 'Nenhuma venda corresponde aos filtros' }}
      />
    </div>
  );
}
