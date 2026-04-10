import { query } from './db.js';
import { getCached, setCache } from './cache.js';
import config from '../config/index.js';

export async function getEstoque(tabela, bandeira, filters = {}) {
  const cacheKey = `estoque_${tabela}_${JSON.stringify(filters)}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const conditions = [];
  const params = [];
  let i = 1;

  if (filters.lojaId) {
    conditions.push(`loja_id = $${i++}`);
    params.push(filters.lojaId);
  }
  if (filters.ean) {
    conditions.push(`ean = $${i++}`);
    params.push(filters.ean);
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const sql = `
    SELECT snapshot_ts, loja_id, codigo_produto, descricao_produto, ean,
           estq_loja, estq_avaria
    FROM ${tabela}
    ${where}
    ORDER BY descricao_produto
    LIMIT 1000
  `;
  
  try {
    console.log('📊 getEstoque - tabela:', tabela, 'filters:', filters);
    const res = await query(sql, params);
    const rows = res.rows.map(r => ({ ...r, bandeira }));
    setCache(cacheKey, rows, config.cacheTtl);
    return rows;
  } catch (err) {
    console.error('❌ Erro na query de estoque:', { tabela, sql: sql.slice(0, 100), error: err.message });
    throw err;
  }
}

export async function getEstoqueConsolidado(filters = {}) {
  const vendor = filters.vendor || 'ambos';
  const results = [];

  if (vendor === 'ambos' || vendor === 'valemilk') {
    results.push(...await getEstoque('estoque', 'Valemilk', filters));
  }
  if (vendor === 'ambos' || vendor === 'valefish') {
    results.push(...await getEstoque('estoque_valefish', 'Valefish', filters));
  }

  return results;
}
