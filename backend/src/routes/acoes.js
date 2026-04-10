import { Router } from 'express';
import AcaoComercial from '../models/AcaoComercial.js';

const router = Router();

// Listar ações (com filtros opcionais)
router.get('/', async (req, res) => {
  try {
    const { tipo, vendor, ativo, ean } = req.query;
    const filter = {};
    if (tipo) filter.tipo = tipo;
    if (vendor) filter.vendor = vendor;
    if (ativo !== undefined) filter.ativo = ativo === 'true';
    if (ean) filter.ean = ean;

    const acoes = await AcaoComercial.find(filter).sort({ data_inicio: -1 }).limit(200);
    res.json({ status: 'success', data: acoes, metadata: { total: acoes.length } });
  } catch (err) {
    console.error('❌ Erro GET /api/acoes:', err);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Buscar uma ação por ID
router.get('/:id', async (req, res) => {
  try {
    const acao = await AcaoComercial.findById(req.params.id);
    if (!acao) return res.status(404).json({ status: 'error', error: 'Ação não encontrada' });
    res.json({ status: 'success', data: acao });
  } catch (err) {
    console.error('❌ Erro GET /api/acoes/:id:', err);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Criar nova ação (suporta lote com array de produtos)
router.post('/', async (req, res) => {
  try {
    const { tipo, produtos: produtosList, preco_normal, preco_acao, data_inicio, data_fim, vendor, observacao,
            // compatibilidade com formato antigo (produto único)
            ean, produto } = req.body;

    if (!tipo || !preco_acao || !data_inicio || !data_fim) {
      return res.status(400).json({ status: 'error', error: 'Campos obrigatórios: tipo, preco_acao, data_inicio, data_fim' });
    }

    // Montar lista de produtos (multi ou single)
    let items = [];
    if (Array.isArray(produtosList) && produtosList.length > 0) {
      items = produtosList.map(p => ({ ean: p.ean, produto: p.produto, cod_interno: p.cod_interno || '' }));
    } else if (ean && produto) {
      items = [{ ean, produto, cod_interno: '' }];
    } else {
      return res.status(400).json({ status: 'error', error: 'Informe ao menos um produto' });
    }

    const docs = items.map(p => ({
      tipo,
      ean: p.ean,
      produto: p.produto,
      cod_interno: p.cod_interno,
      preco_normal: preco_normal ? Number(preco_normal) : null,
      preco_acao: Number(preco_acao),
      data_inicio: new Date(data_inicio),
      data_fim: new Date(data_fim),
      vendor: vendor || 'ambos',
      observacao: observacao || '',
    }));

    const acoes = await AcaoComercial.insertMany(docs);
    res.status(201).json({ status: 'success', data: acoes, metadata: { total: acoes.length } });
  } catch (err) {
    console.error('❌ Erro POST /api/acoes:', err);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Atualizar ação
router.put('/:id', async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.data_inicio) updates.data_inicio = new Date(updates.data_inicio);
    if (updates.data_fim) updates.data_fim = new Date(updates.data_fim);

    const acao = await AcaoComercial.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!acao) return res.status(404).json({ status: 'error', error: 'Ação não encontrada' });
    res.json({ status: 'success', data: acao });
  } catch (err) {
    console.error('❌ Erro PUT /api/acoes/:id:', err);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Deletar ação
router.delete('/:id', async (req, res) => {
  try {
    const acao = await AcaoComercial.findByIdAndDelete(req.params.id);
    if (!acao) return res.status(404).json({ status: 'error', error: 'Ação não encontrada' });
    res.json({ status: 'success', data: { message: 'Ação removida' } });
  } catch (err) {
    console.error('❌ Erro DELETE /api/acoes/:id:', err);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

export default router;
