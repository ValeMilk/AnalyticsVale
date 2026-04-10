import { Router } from 'express';
import { getVendasConsolidadas } from '../services/vendasService.js';

const router = Router();

function parseFilters(query) {
  return {
    dataInicio: query.data_inicio || null,
    dataFim: query.data_fim || null,
    lojaId: query.loja_id || null,
    ean: query.ean || null,
    vendor: query.vendor || 'ambos',
  };
}

router.get('/', async (req, res) => {
  try {
    const filters = parseFilters(req.query);
    const vendas = await getVendasConsolidadas(filters);
    res.json({
      status: 'success',
      data: vendas,
      metadata: {
        total_rows: vendas.length,
        periodo: `${filters.dataInicio || 'inicio'} a ${filters.dataFim || 'hoje'}`,
        vendor: filters.vendor,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ Erro em /api/vendas:', error);
    res.status(500).json({ status: 'error', error: error.message });
  }
});

export default router;
