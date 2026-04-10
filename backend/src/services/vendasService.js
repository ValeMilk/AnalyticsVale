import { query } from './db.js';
import { getCached, setCache } from './cache.js';
import config from '../config/index.js';

function buildWhereClause(filters, startParam = 1) {
  const conditions = [];
  const params = [];
  let i = startParam;

  if (filters.dataInicio) {
    conditions.push(`data >= $${i++}`);
    params.push(filters.dataInicio);
  }
  if (filters.dataFim) {
    conditions.push(`data <= $${i++}`);
    params.push(filters.dataFim);
  }
  // Suporta múltiplas lojas (array) ou loja única (string)
  if (filters.lojaIds && filters.lojaIds.length > 0) {
    const placeholders = filters.lojaIds.map(() => `$${i++}`).join(', ');
    conditions.push(`loja_id IN (${placeholders})`);
    params.push(...filters.lojaIds);
  } else if (filters.lojaId) {
    conditions.push(`loja_id = $${i++}`);
    params.push(filters.lojaId);
  }
  // Suporta múltiplos EANs (array) ou EAN único (string)
  if (filters.eans && filters.eans.length > 0) {
    const placeholders = filters.eans.map(() => `$${i++}`).join(', ');
    conditions.push(`ean IN (${placeholders})`);
    params.push(...filters.eans);
  } else if (filters.ean) {
    conditions.push(`ean = $${i++}`);
    params.push(filters.ean);
  }

  return {
    where: conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '',
    params,
  };
}

export async function getVendas(tabela, bandeira, filters = {}) {
  const cacheKey = `vendas_${tabela}_${JSON.stringify(filters)}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { where, params } = buildWhereClause(filters);
  const sql = `
    SELECT data, loja_id, nome_loja, cnpj_loja, ean, cod_interno, plu,
           produto, qtd, venda, custo
    FROM ${tabela}
    ${where}
    ORDER BY data DESC
    LIMIT 1000
  `;
  const res = await query(sql, params);
  const rows = res.rows.map(r => ({ ...r, bandeira }));
  setCache(cacheKey, rows, config.cacheTtl);
  return rows;
}

export async function getVendasConsolidadas(filters = {}) {
  const vendor = filters.vendor || 'ambos';
  const results = [];

  if (vendor === 'ambos' || vendor === 'valemilk') {
    results.push(...await getVendas('vendas', 'Valemilk', filters));
  }
  if (vendor === 'ambos' || vendor === 'valefish') {
    results.push(...await getVendas('vendas_valefish', 'Valefish', filters));
  }

  return results.sort((a, b) => String(b.data).localeCompare(String(a.data)));
}

export async function getVendasPorDia(filters = {}) {
  const vendor = filters.vendor || 'ambos';
  const cacheKey = `vendas_dia_${JSON.stringify(filters)}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { where, params } = buildWhereClause(filters);

  const queries = [];
  if (vendor === 'ambos' || vendor === 'valemilk') {
    queries.push(`SELECT data, SUM(venda) as venda, SUM(venda * 0.70) as margem, SUM(qtd) as qtd FROM vendas ${where} GROUP BY data`);
  }
  if (vendor === 'ambos' || vendor === 'valefish') {
    queries.push(`SELECT data, SUM(venda) as venda, SUM(venda * 0.75) as margem, SUM(qtd) as qtd FROM vendas_valefish ${where} GROUP BY data`);
  }

  const sql = queries.length === 2
    ? `SELECT data, SUM(venda) as venda, SUM(margem) as margem, SUM(qtd) as qtd FROM (${queries.join(' UNION ALL ')}) sub GROUP BY data ORDER BY data`
    : `${queries[0]} ORDER BY data`;

  const res = await query(sql, params);
  const rows = res.rows.map(r => ({
    ...r,
    venda: Number(r.venda),
    margem: Number(r.margem),
    qtd: Number(r.qtd),
  }));
  setCache(cacheKey, rows, config.cacheTtl);
  return rows;
}

export async function getResumo(filters = {}) {
  const vendor = filters.vendor || 'ambos';
  const cacheKey = `resumo_${JSON.stringify(filters)}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { where, params } = buildWhereClause(filters);

  const tables = [];
  if (vendor === 'ambos' || vendor === 'valemilk') tables.push('vendas');
  if (vendor === 'ambos' || vendor === 'valefish') tables.push('vendas_valefish');

  const unions = tables.map(t => {
    const pct = t === 'vendas' ? 0.70 : 0.75;
    return `SELECT venda, venda * ${pct} as margem, qtd, ean, loja_id FROM ${t} ${where}`;
  }).join(' UNION ALL ');

  const sql = `
    SELECT
      COALESCE(SUM(venda), 0) as total_venda,
      COALESCE(SUM(margem), 0) as total_margem,
      COALESCE(SUM(qtd), 0) as total_qtd,
      COUNT(DISTINCT ean) as total_produtos,
      COUNT(DISTINCT loja_id) as total_lojas
    FROM (${unions}) sub
  `;
  const res = await query(sql, params);
  const r = res.rows[0];
  const totalVenda = Number(r.total_venda);
  const totalMargem = Number(r.total_margem);
  const resultado = {
    total_venda: totalVenda,
    total_margem: totalMargem,
    total_qtd: Number(r.total_qtd),
    margem_percent: totalVenda > 0 ? (totalMargem / totalVenda * 100).toFixed(2) : '0.00',
    total_produtos: Number(r.total_produtos),
    total_lojas: Number(r.total_lojas),
  };
  setCache(cacheKey, resultado, config.cacheTtl);
  return resultado;
}

export async function getRankingProdutos(filters = {}, limit = 20) {
  const vendor = filters.vendor || 'ambos';
  const cacheKey = `ranking_${JSON.stringify(filters)}_${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { where, params } = buildWhereClause(filters);

  const tables = [];
  if (vendor === 'ambos' || vendor === 'valemilk') tables.push('vendas');
  if (vendor === 'ambos' || vendor === 'valefish') tables.push('vendas_valefish');

  const unions = tables.map(t => {
    const pct = t === 'vendas' ? 0.70 : 0.75;
    return `SELECT ean, cod_interno, produto, qtd, venda, venda * ${pct} as margem FROM ${t} ${where}`;
  }).join(' UNION ALL ');
  const safeLimit = Math.min(Math.max(limit, 1), 200);

  const sql = `
    SELECT ean, cod_interno, MIN(produto) as produto,
           SUM(qtd) as qtd_total, SUM(venda) as venda_total, SUM(margem) as margem_total
    FROM (${unions}) sub
    GROUP BY ean, cod_interno
    ORDER BY venda_total DESC
    LIMIT ${safeLimit}
  `;
  const res = await query(sql, params);
  const rows = res.rows.map(r => {
    const v = Number(r.venda_total);
    const m = Number(r.margem_total);
    return {
      ...r,
      qtd_total: Number(r.qtd_total),
      venda_total: v,
      margem: m,
      margem_percent: v > 0 ? (m / v * 100).toFixed(2) : '0.00',
    };
  });
  setCache(cacheKey, rows, config.cacheTtl);
  return rows;
}

export async function getVendasPorLoja(filters = {}) {
  const vendor = filters.vendor || 'ambos';
  const cacheKey = `vendas_loja_${JSON.stringify(filters)}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { where, params } = buildWhereClause(filters);

  const tables = [];
  if (vendor === 'ambos' || vendor === 'valemilk') tables.push({ t: 'vendas', b: 'Valemilk' });
  if (vendor === 'ambos' || vendor === 'valefish') tables.push({ t: 'vendas_valefish', b: 'Valefish' });

  const unions = tables.map(({ t, b }) => {
    const pct = t === 'vendas' ? 0.70 : 0.75;
    return `SELECT loja_id, nome_loja, '${b}' as bandeira, qtd, venda, venda * ${pct} as margem FROM ${t} ${where}`;
  }).join(' UNION ALL ');

  const sql = `
    SELECT loja_id, MIN(nome_loja) as nome_loja, MIN(bandeira) as bandeira,
           SUM(qtd) as qtd, SUM(venda) as venda, SUM(margem) as margem
    FROM (${unions}) sub
    GROUP BY loja_id
    ORDER BY venda DESC
  `;
  const res = await query(sql, params);
  const rows = res.rows.map(r => {
    const v = Number(r.venda);
    const m = Number(r.margem);
    return {
      ...r,
      qtd: Number(r.qtd),
      venda: v,
      margem: m,
      margem_percent: v > 0 ? (m / v * 100).toFixed(2) : '0.00',
    };
  });
  setCache(cacheKey, rows, config.cacheTtl);
  return rows;
}

export async function getVendasPorDiaMes(filters = {}) {
  const vendor = filters.vendor || 'ambos';
  const cacheKey = `vendas_dia_mes_${JSON.stringify(filters)}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { where, params } = buildWhereClause(filters);

  const queries = [];
  if (vendor === 'ambos' || vendor === 'valemilk') {
    queries.push(`SELECT TO_CHAR(data, 'YYYY-MM') as mes, EXTRACT(DAY FROM data)::int as dia, SUM(venda) as venda, SUM(qtd) as qtd FROM vendas ${where} GROUP BY mes, dia`);
  }
  if (vendor === 'ambos' || vendor === 'valefish') {
    queries.push(`SELECT TO_CHAR(data, 'YYYY-MM') as mes, EXTRACT(DAY FROM data)::int as dia, SUM(venda) as venda, SUM(qtd) as qtd FROM vendas_valefish ${where} GROUP BY mes, dia`);
  }

  const sql = queries.length === 2
    ? `SELECT mes, dia, SUM(venda) as venda, SUM(qtd) as qtd FROM (${queries.join(' UNION ALL ')}) sub GROUP BY mes, dia ORDER BY mes, dia`
    : `${queries[0]} ORDER BY mes, dia`;

  const res = await query(sql, params);
  const rows = res.rows.map(r => ({
    mes: r.mes,
    dia: Number(r.dia),
    venda: Number(r.venda),
    qtd: Number(r.qtd),
  }));
  setCache(cacheKey, rows, config.cacheTtl);
  return rows;
}