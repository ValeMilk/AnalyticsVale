import { Router } from 'express';
import { getRankingProdutos, getVendasPorDia, getVendasPorDiaMes, getVendasPorLoja, getResumo } from '../services/vendasService.js';

const router = Router();

function parseFilters(query) {
  // eans e loja_ids vêm separados por | (pipe) para evitar conflito com vírgulas nos EANs
  const eans = query.eans
    ? String(query.eans).split('|').map(s => s.trim()).filter(Boolean)
    : query.ean ? [query.ean.trim()] : [];
  const lojaIds = query.loja_ids
    ? String(query.loja_ids).split('|').map(s => s.trim()).filter(Boolean)
    : query.loja_id ? [query.loja_id.trim()] : [];
  return {
    dataInicio: query.data_inicio || null,
    dataFim: query.data_fim || null,
    lojaId: lojaIds[0] || null,
    lojaIds: lojaIds,
    ean: eans[0] || null,
    eans: eans,
    vendor: query.vendor || 'ambos',
  };
}

router.get('/ranking', async (req, res) => {
  try {
    const filters = parseFilters(req.query);
    const limit = parseInt(req.query.limit) || 20;
    const data = await getRankingProdutos(filters, limit);
    res.json({
      status: 'success',
      data,
      metadata: { total_rows: data.length, vendor: filters.vendor, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.error('❌ Erro em /api/analytics/ranking:', error);
    res.status(500).json({ status: 'error', error: error.message });
  }
});

router.get('/vendas-dia', async (req, res) => {
  try {
    const filters = parseFilters(req.query);
    const data = await getVendasPorDia(filters);
    res.json({
      status: 'success',
      data,
      metadata: { total_rows: data.length, vendor: filters.vendor, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.error('❌ Erro em /api/analytics/vendas-dia:', error);
    res.status(500).json({ status: 'error', error: error.message });
  }
});

router.get('/vendas-loja', async (req, res) => {
  try {
    const filters = parseFilters(req.query);
    const data = await getVendasPorLoja(filters);
    res.json({
      status: 'success',
      data,
      metadata: { total_rows: data.length, vendor: filters.vendor, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.error('❌ Erro em /api/analytics/vendas-loja:', error);
    res.status(500).json({ status: 'error', error: error.message });
  }
});

router.get('/resumo', async (req, res) => {
  try {
    const filters = parseFilters(req.query);
    const data = await getResumo(filters);
    res.json({
      status: 'success',
      data,
      metadata: {
        periodo: `${filters.dataInicio || 'inicio'} a ${filters.dataFim || 'hoje'}`,
        vendor: filters.vendor,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ Erro em /api/analytics/resumo:', error);
    res.status(500).json({ status: 'error', error: error.message });
  }
});

router.get('/vendas-dia-mes', async (req, res) => {
  try {
    const filters = parseFilters(req.query);
    const data = await getVendasPorDiaMes(filters);
    res.json({
      status: 'success',
      data,
      metadata: { total_rows: data.length, vendor: filters.vendor, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.error('❌ Erro em /api/analytics/vendas-dia-mes:', error);
    res.status(500).json({ status: 'error', error: error.message });
  }
});

export default router;
