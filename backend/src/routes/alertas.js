import { Router } from 'express';
import { getVendasPorDia } from '../services/vendasService.js';
import { gerarAlertasVendasDia } from '../services/alertasService.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const vendor = req.query.vendor || 'ambos';

    const hoje = new Date();
    const seteDiasAtras = new Date(hoje);
    seteDiasAtras.setDate(hoje.getDate() - 7);

    const vendasDia = await getVendasPorDia({
      dataInicio: seteDiasAtras.toISOString().slice(0, 10),
      dataFim: hoje.toISOString().slice(0, 10),
      vendor,
    });

    const todos = gerarAlertasVendasDia(vendasDia);

    res.json({
      status: 'success',
      data: {
        total: todos.length,
        criticos: todos.filter(a => a.tipo === 'critico').length,
        avisos: todos.filter(a => a.tipo === 'aviso').length,
        alertas: todos,
      },
      metadata: { vendor, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.error('❌ Erro em /api/alertas:', error);
    res.status(500).json({ status: 'error', error: error.message });
  }
});

export default router;
