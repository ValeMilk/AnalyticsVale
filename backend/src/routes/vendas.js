import { Router } from 'express';
import { getVendasConsolidadas } from '../services/vendasService.js';

const router = Router();

function parseFilters(query) {
  // eans pode vir como eans[]=x&eans[]=y ou eans=x,y
  let eans = [];
  if (query['eans[]']) eans = Array.isArray(query['eans[]']) ? query['eans[]'] : [query['eans[]']];
  else if (query.eans) eans = Array.isArray(query.eans) ? query.eans : query.eans.split(',').filter(Boolean);

  let lojaIds = [];
  if (query['loja_ids[]']) lojaIds = Array.isArray(query['loja_ids[]']) ? query['loja_ids[]'] : [query['loja_ids[]']];
  else if (query.loja_ids) lojaIds = Array.isArray(query.loja_ids) ? query.loja_ids : query.loja_ids.split(',').filter(Boolean);

  return {
    dataInicio: query.data_inicio || null,
    dataFim: query.data_fim || null,
    lojaId: query.loja_id || null,
    lojaIds: lojaIds.length > 0 ? lojaIds : null,
    ean: query.ean || null,
    eans: eans.length > 0 ? eans : null,
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
