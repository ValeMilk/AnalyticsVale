import { Router } from 'express';
import { query } from '../services/db.js';
import { getCached, setCache } from '../services/cache.js';

const router = Router();

// Lista lojas únicas com filtro opcional de vendor
router.get('/', async (req, res) => {
  try {
    const vendor = req.query.vendor || 'ambos';
    const cacheKey = `lojas_lista_${vendor}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json({ status: 'success', data: cached });

    const queries = [];
    if (vendor === 'ambos' || vendor === 'valemilk') {
      queries.push(`SELECT loja_id, MIN(nome_loja) as nome_loja, 'valemilk' as bandeira FROM vendas GROUP BY loja_id`);
    }
    if (vendor === 'ambos' || vendor === 'valefish') {
      queries.push(`SELECT loja_id, MIN(nome_loja) as nome_loja, 'valefish' as bandeira FROM vendas_valefish GROUP BY loja_id`);
    }

    const sql = queries.length === 2
      ? `SELECT loja_id, MIN(nome_loja) as nome_loja, STRING_AGG(DISTINCT bandeira, '/') as bandeira FROM (${queries.join(' UNION ALL ')}) sub GROUP BY loja_id ORDER BY nome_loja`
      : `${queries[0]} ORDER BY nome_loja`;

    const result = await query(sql, []);
    setCache(cacheKey, result.rows, 10);
    res.json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error('❌ Erro GET /api/lojas:', err);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

export default router;
