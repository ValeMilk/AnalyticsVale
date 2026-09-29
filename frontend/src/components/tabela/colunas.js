import { fmtData, formatarNumero, soData } from '../../lib/formatar';

/**
 * Contrato de coluna — união discriminada por `tipo`. O tipo decide sozinho qual cabeçalho,
 * qual filtro e qual ordenação a coluna ganha.
 *
 * Campos comuns:
 *   id, rotulo, ajuda?, larguraClasse?, alinhamento? ('left'|'right'), padrao? (visível de início),
 *   fixa? (sempre visível, sempre primeiro, fora do gerenciador), escondeNoCelular?,
 *   papelNoCartao? ('titulo'|'etiqueta'|'status'|'campo'|'oculto'), ordenavel?, chaveDeOrdenacao?(l), exportar?(l)
 *
 * Por tipo:
 *   texto:     valor(l) → string|null, renderizar?(l)
 *   numero:    valor(l) → number|null, formato? ('moeda'|'quantidade'|'inteiro'|'percentual'), filtravel?, renderizar?(l)
 *   data:      valor(l) → 'aaaa-mm-dd'|null, renderizar(l) OBRIGATÓRIO (formata a partir da string crua)
 *   categoria: valor(l) → string|string[]|null, comBusca?, renderizar?(l)
 *   custom:    renderizar(l) OBRIGATÓRIO
 */

export const primeiraDirecaoDaColuna = (c) => (c.tipo === 'numero' || c.tipo === 'data' ? 'desc' : 'asc');

export const alinhamentoDaColuna = (c) => c.alinhamento ?? (c.tipo === 'numero' ? 'right' : 'left');

export const colunaOrdenavel = (c) => c.ordenavel ?? c.tipo !== 'custom';

export const colunaFiltravel = (c) => c.tipo === 'categoria' || c.tipo === 'data' || (c.tipo === 'numero' && c.filtravel !== false);

export function papelEfetivo(c) {
  if (c.papelNoCartao) return c.papelNoCartao;
  if (c.escondeNoCelular) return 'oculto';
  if (c.fixa) return 'titulo';
  return 'campo';
}

export function valorBruto(c, l) {
  if (c.tipo === 'custom') return null;
  const v = c.valor(l);
  return v === '' || v === undefined ? null : v;
}

export function chaveDeOrdenacao(c, l) {
  if (c.chaveDeOrdenacao) {
    const k = c.chaveDeOrdenacao(l);
    return k === '' || k === undefined ? null : k;
  }
  const v = valorBruto(c, l);
  if (Array.isArray(v)) return v.length ? v.join(', ') : null;
  if (c.tipo === 'numero') return v == null || Number.isNaN(Number(v)) ? null : Number(v);
  if (c.tipo === 'data') return soData(v);
  return v;
}

/** Texto puro do valor (para título/etiqueta de cartão e exportação) */
export function valorComoTexto(c, l) {
  const v = valorBruto(c, l);
  if (v === null) return '';
  if (Array.isArray(v)) return v.join(', ');
  if (c.tipo === 'numero') return formatarNumero(v, c.formato);
  if (c.tipo === 'data') return fmtData(v);
  return String(v);
}

export function valorParaExportar(c, l) {
  if (c.exportar) return c.exportar(l);
  if (c.tipo === 'custom') return null;
  return valorBruto(c, l);
}

export function filtroVazio(f) {
  if (!f) return true;
  if (f.valores) return f.valores.length === 0;
  return (f.de == null || f.de === '') && (f.ate == null || f.ate === '');
}

export function descricaoDoFiltro(c, f) {
  if (c.tipo === 'categoria') {
    const v = f.valores || [];
    return v.length <= 3 ? v.join(', ') : `${v.slice(0, 2).join(', ')} +${v.length - 2}`;
  }
  const fmt = c.tipo === 'numero' ? (x) => formatarNumero(x, c.formato) : fmtData;
  const temDe = f.de != null && f.de !== '';
  const temAte = f.ate != null && f.ate !== '';
  if (temDe && temAte) return `de ${fmt(f.de)} até ${fmt(f.ate)}`;
  if (temDe) return `a partir de ${fmt(f.de)}`;
  return `até ${fmt(f.ate)}`;
}
