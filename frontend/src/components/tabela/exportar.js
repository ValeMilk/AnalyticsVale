import { alinhamentoDaColuna, valorParaExportar } from './colunas';
import { fmtData, formatarNumero, hojeLocal } from '../../lib/formatar';

/**
 * Documento intermediário comum a todos os formatos: cada gerador só LÊ isto,
 * sem repetir "que coluna, em que ordem, com que máscara".
 * { titulo, filtros: [{rotulo, valor}], colunas: [{id, rotulo, alinhamento, largura}],
 *   linhas: [[{texto, numero}]], totais: [{texto, numero}] | null, geradoEm }
 */
export function montarDocumento({ titulo, filtros = [], colunas, linhas, totais = null }) {
  const cols = colunas.filter((c) => c.tipo !== 'custom' || c.exportar);
  return {
    titulo,
    filtros,
    colunas: cols.map((c) => ({ id: c.id, rotulo: c.rotulo, alinhamento: alinhamentoDaColuna(c), largura: c.tipo === 'numero' ? 14 : 28 })),
    linhas: linhas.map((l) => cols.map((c) => celulaDeExportacao(c, valorParaExportar(c, l)))),
    totais: totais ? cols.map((c) => celulaDeExportacao(c, totais[c.id] ?? null)) : null,
    geradoEm: new Date().toLocaleString('pt-BR'),
  };
}

function celulaDeExportacao(coluna, valor) {
  if (valor === null || valor === undefined || valor === '') return { texto: '', numero: null };
  if (typeof valor === 'number') {
    return { texto: coluna.tipo === 'numero' ? formatarNumero(valor, coluna.formato) : String(valor), numero: valor };
  }
  if (coluna.tipo === 'data') return { texto: fmtData(valor), numero: null };
  if (Array.isArray(valor)) return { texto: valor.join(', '), numero: null };
  return { texto: String(valor), numero: null };
}

const numeroPtBr = (n) => String(n).replace('.', ',');

/** CSV com ; e vírgula decimal (abre direto no Excel em pt-BR). Números vão crus, não formatados. */
export function gerarCsv(doc) {
  const sep = ';';
  const esc = (t) => `"${String(t ?? '').replace(/"/g, '""')}"`;
  const linhas = [];
  linhas.push(esc(doc.titulo));
  doc.filtros.forEach((f) => linhas.push(esc(`${f.rotulo}: ${f.valor}`)));
  linhas.push(esc(`Gerado em: ${doc.geradoEm}`));
  linhas.push('');
  linhas.push(doc.colunas.map((c) => esc(c.rotulo)).join(sep));
  doc.linhas.forEach((l) => linhas.push(l.map((c) => esc(c.numero != null ? numeroPtBr(c.numero) : c.texto)).join(sep)));
  if (doc.totais) linhas.push(doc.totais.map((c, i) => esc(c.numero != null ? numeroPtBr(c.numero) : c.texto || (i === 0 ? 'Total' : ''))).join(sep));
  return `﻿${linhas.join('\r\n')}`;
}

/** Texto separado por tab, para colar direto numa planilha */
export function textoParaPlanilha(doc) {
  const linhas = [doc.colunas.map((c) => c.rotulo).join('\t')];
  doc.linhas.forEach((l) => linhas.push(l.map((c) => (c.numero != null ? numeroPtBr(c.numero) : c.texto)).join('\t')));
  if (doc.totais) linhas.push(doc.totais.map((c, i) => (c.numero != null ? numeroPtBr(c.numero) : c.texto || (i === 0 ? 'Total' : ''))).join('\t'));
  return linhas.join('\n');
}

export async function copiarParaPlanilha(doc) {
  await navigator.clipboard.writeText(textoParaPlanilha(doc));
}

export function baixarArquivo(conteudo, nome, tipo = 'text/plain;charset=utf-8') {
  const blob = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function nomeDeArquivo(titulo, extensao) {
  const base = titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base || 'exportacao'}-${hojeLocal()}.${extensao}`;
}
