import { useCallback, useEffect, useMemo, useState } from 'react';
import { chaveDeOrdenacao, descricaoDoFiltro, filtroVazio, primeiraDirecaoDaColuna } from './colunas';
import { soData } from '../../lib/formatar';

const collator = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });

function compararChaves(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return collator.compare(String(a), String(b));
}

function passaNoFiltro(coluna, filtro, linha) {
  if (coluna.tipo === 'categoria') {
    const sel = filtro.valores || [];
    if (!sel.length) return true;
    const v = coluna.valor(linha);
    if (Array.isArray(v)) return v.some((x) => sel.includes(String(x)));
    return v != null && v !== '' && sel.includes(String(v));
  }
  if (coluna.tipo === 'numero') {
    if (filtroVazio(filtro)) return true;
    const v = coluna.valor(linha);
    if (v == null || Number.isNaN(Number(v))) return false; // "sem dado" nunca casa com faixa
    if (filtro.de != null && filtro.de !== '' && Number(v) < Number(filtro.de)) return false;
    if (filtro.ate != null && filtro.ate !== '' && Number(v) > Number(filtro.ate)) return false;
    return true;
  }
  if (coluna.tipo === 'data') {
    if (filtroVazio(filtro)) return true;
    const v = soData(coluna.valor(linha));
    if (!v) return false;
    if (filtro.de && v < filtro.de) return false;
    if (filtro.ate && v > filtro.ate) return false;
    return true;
  }
  return true;
}

/**
 * Motor de estado da listagem. Recebe linhas (já filtradas pelos filtros DE TELA) + colunas,
 * devolve colunas visíveis, linhas filtradas/ordenadas/paginadas e as funções para mudar tudo.
 *
 * Regras embutidas:
 *  - "sem dado" (null) vai para o fim nas duas direções e nunca casa com filtro de faixa;
 *  - esconder uma coluna limpa o filtro e a ordenação dela;
 *  - nada persiste entre visitas.
 */
export function useTabelaDeDados({ linhas, colunas, ordenacaoPadrao = null, baseDasOpcoes, passo = 100 }) {
  const fixas = useMemo(() => colunas.filter((c) => c.fixa), [colunas]);
  const gerenciaveis = useMemo(() => colunas.filter((c) => !c.fixa), [colunas]);
  const porId = useMemo(() => new Map(colunas.map((c) => [c.id, c])), [colunas]);
  const ocultasPadrao = useMemo(() => new Set(gerenciaveis.filter((c) => c.padrao === false).map((c) => c.id)), [gerenciaveis]);

  const [ordem, setOrdem] = useState(null); // null = ordem do registro
  const [ocultas, setOcultas] = useState(null); // null = ocultasPadrao
  const [filtros, setFiltros] = useState({});
  const [ordenacao, setOrdenacao] = useState(null); // null = ordenacaoPadrao
  const [limite, setLimite] = useState(passo ?? Infinity);

  const ocultasEfetivas = ocultas ?? ocultasPadrao;

  const ordemEfetiva = useMemo(() => {
    const ids = gerenciaveis.map((c) => c.id);
    if (!ordem) return ids;
    const conhecidos = ordem.filter((id) => ids.includes(id));
    const faltantes = ids.filter((id) => !conhecidos.includes(id));
    return [...conhecidos, ...faltantes];
  }, [ordem, gerenciaveis]);

  const colunasVisiveis = useMemo(
    () => [...fixas, ...ordemEfetiva.filter((id) => !ocultasEfetivas.has(id)).map((id) => porId.get(id))],
    [fixas, ordemEfetiva, ocultasEfetivas, porId]
  );

  const opcoesDeCategoria = useMemo(() => {
    const base = baseDasOpcoes ?? linhas;
    const resultado = {};
    for (const c of colunas) {
      if (c.tipo !== 'categoria') continue;
      const set = new Set();
      for (const l of base) {
        const v = c.valor(l);
        if (Array.isArray(v)) v.forEach((x) => x != null && x !== '' && set.add(String(x)));
        else if (v != null && v !== '') set.add(String(v));
      }
      resultado[c.id] = [...set].sort(collator.compare);
    }
    return resultado;
  }, [colunas, baseDasOpcoes, linhas]);

  const linhasFiltradas = useMemo(() => {
    const ativos = Object.entries(filtros).filter(([id, f]) => porId.has(id) && !filtroVazio(f));
    if (!ativos.length) return linhas;
    return linhas.filter((l) => ativos.every(([id, f]) => passaNoFiltro(porId.get(id), f, l)));
  }, [linhas, filtros, porId]);

  const ordenacaoEfetiva = ordenacao ?? ordenacaoPadrao ?? null;
  const colunaOrdenacaoId = ordenacaoEfetiva?.colunaId ?? null;
  const direcaoOrdenacao = ordenacaoEfetiva?.direcao ?? null;

  const linhasOrdenadas = useMemo(() => {
    const c = colunaOrdenacaoId ? porId.get(colunaOrdenacaoId) : null;
    if (!c) return linhasFiltradas;
    const sinal = direcaoOrdenacao === 'desc' ? -1 : 1;
    const indexadas = linhasFiltradas.map((linha, indice) => ({ linha, indice, chave: chaveDeOrdenacao(c, linha) }));
    indexadas.sort((a, b) => {
      if (a.chave === null && b.chave === null) return a.indice - b.indice;
      if (a.chave === null) return 1; // sem dado sempre por último...
      if (b.chave === null) return -1; // ...nas duas direções
      const cmp = compararChaves(a.chave, b.chave);
      return cmp !== 0 ? cmp * sinal : a.indice - b.indice;
    });
    return indexadas.map((i) => i.linha);
  }, [linhasFiltradas, colunaOrdenacaoId, direcaoOrdenacao, porId]);

  const linhasVisiveis = useMemo(() => (passo == null ? linhasOrdenadas : linhasOrdenadas.slice(0, limite)), [linhasOrdenadas, limite, passo]);

  // Mudou o conjunto de dados ou os filtros → volta ao primeiro lote
  useEffect(() => {
    setLimite(passo ?? Infinity);
  }, [linhas, filtros, passo]);

  const definirFiltro = useCallback((id, filtro) => {
    setFiltros((atual) => {
      const novo = { ...atual };
      if (!filtro || filtroVazio(filtro)) delete novo[id];
      else novo[id] = filtro;
      return novo;
    });
  }, []);

  const alternarOrdenacao = useCallback(
    (id) => {
      const c = porId.get(id);
      if (!c) return;
      const primeira = primeiraDirecaoDaColuna(c);
      const segunda = primeira === 'asc' ? 'desc' : 'asc';
      const atual = ordenacao ?? ordenacaoPadrao ?? null;
      const ehColunaPadrao = ordenacaoPadrao?.colunaId === id;
      if (ehColunaPadrao) {
        // padrão → invertida → padrão
        const naPadrao = atual?.colunaId === id && atual.direcao === ordenacaoPadrao.direcao;
        setOrdenacao(naPadrao ? { colunaId: id, direcao: ordenacaoPadrao.direcao === 'asc' ? 'desc' : 'asc' } : null);
        return;
      }
      // primeira direção → segunda → volta para a ordenação padrão
      if (atual?.colunaId !== id) setOrdenacao({ colunaId: id, direcao: primeira });
      else if (atual.direcao === primeira) setOrdenacao({ colunaId: id, direcao: segunda });
      else setOrdenacao(null);
    },
    [ordenacao, ordenacaoPadrao, porId]
  );

  const alternarColuna = useCallback(
    (id) => {
      const estavaOculta = ocultasEfetivas.has(id);
      const nova = new Set(ocultasEfetivas);
      if (estavaOculta) nova.delete(id);
      else nova.add(id);
      setOcultas(nova);
      if (!estavaOculta) {
        setFiltros((f) => {
          if (!f[id]) return f;
          const n = { ...f };
          delete n[id];
          return n;
        });
        setOrdenacao((o) => (o?.colunaId === id ? null : o));
      }
    },
    [ocultasEfetivas]
  );

  const chips = useMemo(() => {
    const lista = [];
    for (const [id, f] of Object.entries(filtros)) {
      const c = porId.get(id);
      if (!c || filtroVazio(f)) continue;
      lista.push({ id: `filtro-${id}`, rotulo: c.rotulo, descricao: descricaoDoFiltro(c, f), remover: () => definirFiltro(id, null) });
    }
    if (ordenacao && porId.get(ordenacao.colunaId)) {
      const igualPadrao = ordenacaoPadrao && ordenacaoPadrao.colunaId === ordenacao.colunaId && ordenacaoPadrao.direcao === ordenacao.direcao;
      if (!igualPadrao) {
        const c = porId.get(ordenacao.colunaId);
        lista.push({
          id: 'ordenacao',
          rotulo: 'Ordenação',
          descricao: `${c.rotulo} (${ordenacao.direcao === 'asc' ? 'crescente' : 'decrescente'})`,
          remover: () => setOrdenacao(null),
        });
      }
    }
    return lista;
  }, [filtros, ordenacao, ordenacaoPadrao, porId, definirFiltro]);

  const limparTudo = useCallback(() => {
    setFiltros({});
    setOrdenacao(null);
  }, []);

  const restaurarPadrao = useCallback(() => {
    setOrdem(null);
    setOcultas(null);
  }, []);

  const total = linhasOrdenadas.length;
  const restantes = Math.max(0, total - linhasVisiveis.length);

  return {
    colunas,
    colunasVisiveis,
    linhasFiltradas,
    linhasOrdenadas,
    linhasVisiveis,
    total,
    restantes,
    passo,
    mostrarMais: () => setLimite((l) => l + (passo ?? 0)),
    filtros,
    definirFiltro,
    opcoesDeCategoria,
    ordenacaoEfetiva,
    ordenacaoPadrao,
    alternarOrdenacao,
    chips,
    temFiltroDeColuna: chips.some((c) => c.id.startsWith('filtro-')),
    limparTudo,
    propsDoGerenciador: {
      colunas: ordemEfetiva.map((id) => porId.get(id)),
      ocultas: ocultasEfetivas,
      alternar: alternarColuna,
      reordenar: setOrdem,
      restaurar: restaurarPadrao,
    },
  };
}
