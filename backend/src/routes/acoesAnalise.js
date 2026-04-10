import { Router } from 'express';
import { analisarEficacia, analisarTodasAcoes } from '../services/acoesAnaliseService.js';

const router = Router();

// Análise de todas as ações
router.get('/', async (req, res) => {
  try {
    const filtros = {
      tipo: req.query.tipo || null,
      vendor: req.query.vendor || null,
      comp_inicio: req.query.comp_inicio || null,
      comp_fim: req.query.comp_fim || null,
    };
    const resultados = await analisarTodasAcoes(filtros);
    res.json({
      status: 'success',
      data: resultados,
      metadata: { total: resultados.length, timestamp: new Date().toISOString() },
    });
  } catch (err) {
    console.error('❌ Erro GET /api/acoes-analise:', err);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Análise de uma ação específica
router.get('/:id', async (req, res) => {
  try {
    const resultado = await analisarEficacia(req.params.id, req.query.comp_inicio || null, req.query.comp_fim || null);
    res.json({ status: 'success', data: resultado });
  } catch (err) {
    console.error('❌ Erro GET /api/acoes-analise/:id:', err);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

export default router;
