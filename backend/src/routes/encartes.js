import { Router } from 'express';
import Encarte from '../models/Encarte.js';

const router = Router();

// GET /api/encartes — listar todos (mais recentes primeiro)
router.get('/', async (req, res) => {
  try {
    const { vendor, ativo } = req.query;
    const filter = {};
    if (vendor) filter.vendor = vendor;
    if (ativo !== undefined) filter.ativo = ativo === 'true';

    const encartes = await Encarte.find(filter).sort({ data_inicio: -1 }).limit(200);
    res.json({ status: 'success', data: encartes });
  } catch (err) {
    console.error('❌ GET /api/encartes:', err);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// POST /api/encartes — criar encarte
router.post('/', async (req, res) => {
  try {
    const { titulo, data_inicio, data_fim, vendor, itens, observacao } = req.body;
    if (!titulo || !data_inicio || !data_fim || !itens?.length) {
      return res.status(400).json({ status: 'error', error: 'titulo, data_inicio, data_fim e ao menos 1 item são obrigatórios' });
    }
    const encarte = new Encarte({ titulo, data_inicio, data_fim, vendor, itens, observacao });
    await encarte.save();
    res.status(201).json({ status: 'success', data: encarte });
  } catch (err) {
    console.error('❌ POST /api/encartes:', err);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// PUT /api/encartes/:id — editar encarte
router.put('/:id', async (req, res) => {
  try {
    const encarte = await Encarte.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!encarte) return res.status(404).json({ status: 'error', error: 'Encarte não encontrado' });
    res.json({ status: 'success', data: encarte });
  } catch (err) {
    console.error('❌ PUT /api/encartes/:id:', err);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// DELETE /api/encartes/:id — excluir encarte
router.delete('/:id', async (req, res) => {
  try {
    await Encarte.findByIdAndDelete(req.params.id);
    res.json({ status: 'success' });
  } catch (err) {
    console.error('❌ DELETE /api/encartes/:id:', err);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

export default router;
