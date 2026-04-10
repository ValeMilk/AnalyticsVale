import { Router } from 'express';
import { getEstoqueConsolidado } from '../services/estoqueService.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const filters = {
      lojaId: req.query.loja_id || null,
      ean: req.query.ean || null,
      vendor: req.query.vendor || 'ambos',
    };
    const estoque = await getEstoqueConsolidado(filters);
    res.json({
      status: 'success',
      data: estoque,
      metadata: {
        total_rows: estoque.length,
        vendor: filters.vendor,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ Erro em /api/estoque:', error);
    res.status(500).json({ status: 'error', error: error.message });
  }
});

export default router;
