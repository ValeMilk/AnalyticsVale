import { Router } from 'express';
import Encarte from '../models/Encarte.js';
import AcaoComercial from '../models/AcaoComercial.js';

const router = Router();

// Cria (ou recria) as ações comerciais vinculadas a um encarte
async function syncAcoes(encarte) {
  await AcaoComercial.deleteMany({ encarte_id: encarte._id });
  if (!encarte.itens?.length) return;
  const docs = encarte.itens.map(item => ({
    tipo: 'encarte',
    encarte_id: encarte._id,
    ean: item.ean,
    cod_interno: item.cod_interno || '',
    produto: item.produto,
    preco_normal: null,
    preco_acao: item.preco_oferta,
    data_inicio: encarte.data_inicio,
    data_fim: encarte.data_fim,
    vendor: encarte.vendor,
    observacao: encarte.titulo,
    ativo: true,
  }));
  await AcaoComercial.insertMany(docs);
}

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
    await syncAcoes(encarte);
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
    await syncAcoes(encarte);
    res.json({ status: 'success', data: encarte });
  } catch (err) {
    console.error('❌ PUT /api/encartes/:id:', err);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// DELETE /api/encartes/:id — excluir encarte
router.delete('/:id', async (req, res) => {
  try {
    const encarte = await Encarte.findByIdAndDelete(req.params.id);
    if (encarte) await AcaoComercial.deleteMany({ encarte_id: encarte._id });
    res.json({ status: 'success' });
  } catch (err) {
    console.error('❌ DELETE /api/encartes/:id:', err);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

export default router;
