import { query } from './db.js';
import { getCached, setCache } from './cache.js';
import AcaoComercial from '../models/AcaoComercial.js';

/**
 * Análise de eficácia de uma ação comercial.
 * Compara vendas durante a ação vs período de comparação (customizado ou anterior automático).
 */
export async function analisarEficacia(acaoId, compInicio = null, compFim = null) {
  const acao = await AcaoComercial.findById(acaoId);
  if (!acao) throw new Error('Ação não encontrada');

  const inicio = acao.data_inicio;
  const fim = acao.data_fim;
  const duracaoDias = Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24)) + 1;

  // Período de comparação: customizado ou anterior automático
  let inicioAnterior, fimAnterior;
  if (compInicio && compFim) {
    inicioAnterior = new Date(compInicio);
    fimAnterior = new Date(compFim);
  } else {
    inicioAnterior = new Date(inicio);
    inicioAnterior.setDate(inicioAnterior.getDate() - duracaoDias);
    fimAnterior = new Date(inicio);
    fimAnterior.setDate(fimAnterior.getDate() - 1);
  }
  const diasComp = Math.ceil((fimAnterior - inicioAnterior) / (1000 * 60 * 60 * 24)) + 1;

  const tables = getTablesForVendor(acao.vendor);
  const identifier = acao.cod_interno || acao.ean;
  const idField = acao.cod_interno ? 'cod_interno' : 'ean';

  const [vendasAcao, vendasAnterior] = await Promise.all([
    queryVendasPeriodo(tables, identifier, idField, inicio, fim),
    queryVendasPeriodo(tables, identifier, idField, inicioAnterior, fimAnterior),
  ]);

  const variacao = calcularVariacao(vendasAnterior, vendasAcao);

  return {
    acao: {
      _id: acao._id,
      tipo: acao.tipo,
      produto: acao.produto,
      ean: acao.ean,
      cod_interno: acao.cod_interno,
      preco_acao: acao.preco_acao,
      preco_normal: acao.preco_normal,
      data_inicio: acao.data_inicio,
      data_fim: acao.data_fim,
      vendor: acao.vendor,
    },
    periodo_acao: {
      inicio: inicio.toISOString().slice(0, 10),
      fim: fim.toISOString().slice(0, 10),
      dias: duracaoDias,
      ...vendasAcao,
    },
    periodo_anterior: {
      inicio: inicioAnterior.toISOString().slice(0, 10),
      fim: fimAnterior.toISOString().slice(0, 10),
      dias: diasComp,
      ...vendasAnterior,
    },
    variacao,
    eficaz: variacao.qtd_percent > 0 && variacao.venda_percent > 0,
  };
}

/**
 * Análise de todas as ações ativas/recentes — executa em paralelo com cache
 */
export async function analisarTodasAcoes(filtros = {}) {
  const cacheKey = `analise_todas_${JSON.stringify(filtros)}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const filter = {};
  if (filtros.tipo) filter.tipo = filtros.tipo;
  if (filtros.vendor) filter.vendor = filtros.vendor;

  const acoes = await AcaoComercial.find(filter).sort({ data_inicio: -1 }).limit(50);

  const resultados = await Promise.allSettled(
    acoes.map(acao => analisarEficacia(acao._id, filtros.comp_inicio, filtros.comp_fim))
  );

  const dados = resultados
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value)
    .sort((a, b) => (b.variacao.venda_percent || 0) - (a.variacao.venda_percent || 0));

  setCache(cacheKey, dados, 3); // cache 3 min
  return dados;
}

// ---- Helpers ----

function getTablesForVendor(vendor) {
  const tables = [];
  if (vendor === 'ambos' || vendor === 'valemilk') tables.push({ t: 'vendas', pct: 0.70 });
  if (vendor === 'ambos' || vendor === 'valefish') tables.push({ t: 'vendas_valefish', pct: 0.75 });
  return tables;
}

async function queryVendasPeriodo(tables, identifier, idField, inicio, fim) {
  // EANs no banco podem ter vírgula no final (ex: "7898200380663,"). Normaliza para aceitar ambos.
  const whereClause = idField === 'ean'
    ? `(ean = $1 OR ean = $1 || ',')`
    : `${idField} = $1`;
  const eanNorm = idField === 'ean' ? identifier.replace(/,+$/, '') : identifier;

  const unions = tables.map(({ t, pct }) =>
    `SELECT qtd, venda, venda * ${pct} as margem FROM ${t} WHERE ${whereClause} AND data >= $2 AND data <= $3`
  ).join(' UNION ALL ');

  const sql = `
    SELECT COALESCE(SUM(qtd), 0) as qtd,
           COALESCE(SUM(venda), 0) as venda,
           COALESCE(SUM(margem), 0) as margem
    FROM (${unions}) sub
  `;

  const res = await query(sql, [eanNorm, inicio.toISOString().slice(0, 10), fim.toISOString().slice(0, 10)]);
  const r = res.rows[0];
  const venda = Number(r.venda);
  const margem = Number(r.margem);
  return {
    qtd: Number(r.qtd),
    venda,
    margem,
    margem_percent: venda > 0 ? (margem / venda * 100) : 0,
  };
}

function calcularVariacao(anterior, atual) {
  const pct = (novo, velho) => {
    if (velho === 0) return novo > 0 ? 100 : 0;
    return ((novo - velho) / velho) * 100;
  };

  return {
    qtd_diff: atual.qtd - anterior.qtd,
    qtd_percent: Number(pct(atual.qtd, anterior.qtd).toFixed(2)),
    venda_diff: Number((atual.venda - anterior.venda).toFixed(2)),
    venda_percent: Number(pct(atual.venda, anterior.venda).toFixed(2)),
    margem_diff: Number((atual.margem - anterior.margem).toFixed(2)),
    margem_percent: Number(pct(atual.margem, anterior.margem).toFixed(2)),
  };
}
