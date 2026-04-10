import { Router } from 'express';
import { query } from '../services/db.js';
import { getCached, setCache } from '../services/cache.js';

const router = Router();

// Lista produtos únicos (EAN + nome) de todas as tabelas de vendas
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'produtos_lista';
    const cached = getCached(cacheKey);
    if (cached) return res.json({ status: 'success', data: cached });

    const sql = `
      SELECT ean, cod_interno, MIN(produto) as produto FROM (
        SELECT ean, cod_interno, produto FROM vendas GROUP BY ean, cod_interno, produto
        UNION
        SELECT ean, cod_interno, produto FROM vendas_valefish GROUP BY ean, cod_interno, produto
      ) sub
      GROUP BY ean, cod_interno
      ORDER BY produto
    `;

    const result = await query(sql, []);
    const rows = result.rows;
    setCache(cacheKey, rows, 10); // cache 10 min
    res.json({ status: 'success', data: rows });
  } catch (err) {
    console.error('❌ Erro GET /api/produtos:', err);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

export default router;
