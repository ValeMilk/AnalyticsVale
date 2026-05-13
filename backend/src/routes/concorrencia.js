import { Router } from 'express';
import config from '../config/index.js';
import AcaoComercial from '../models/AcaoComercial.js';

const router = Router();

const INFOMARKET_ENDPOINT = '/api/v1/infomarket?limit=10000';

// GET /api/concorrencia — busca ações de concorrentes do Infomarket
// Parâmetros opcionais: network, search, data_inicio, data_fim
router.get('/', async (req, res) => {
  try {
    const { token, url } = config.infomarket;
    if (!token) {
      return res.status(503).json({ status: 'error', error: 'INFOMARKET_TOKEN não configurado no servidor' });
    }

    // Busca da API externa
    const response = await fetch(`${url}${INFOMARKET_ENDPOINT}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(502).json({ status: 'error', error: `Infomarket retornou ${response.status}` });
    }

    const raw = await response.json();
    let dados = Array.isArray(raw) ? raw : [];

    // Remove duplicatas por item+encarte (uma linha por produto/encarte, sem repetição por loja)
    const vistos = new Set();
    dados = dados.filter(d => {
      const key = `${d.item_id}_${d.leaflet_id}`;
      if (vistos.has(key)) return false;
      vistos.add(key);
      return true;
    });

    // Filtros opcionais
    const { network, search, data_inicio, data_fim } = req.query;
    if (network) {
      dados = dados.filter(d => d.network_name?.toLowerCase() === network.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      dados = dados.filter(d =>
        d.description?.toLowerCase().includes(q) ||
        String(d.eans || '').includes(search)
      );
    }
    if (data_inicio) {
      dados = dados.filter(d => d.validity_finish_date >= data_inicio);
    }
    if (data_fim) {
      dados = dados.filter(d => d.validity_start_date <= data_fim);
    }

    // Ordena por data início decrescente
    dados.sort((a, b) => (b.validity_start_date || '').localeCompare(a.validity_start_date || ''));

    // Coleta todos os EANs para cruzar com nossas ações
    const todosEans = [...new Set(
      dados.flatMap(d => {
        if (Array.isArray(d.eans)) return d.eans.map(String);
        if (d.eans) return [String(d.eans)];
        return [];
      })
    )];

    // Busca nossas ações ativas para os mesmos EANs
    const nossasAcoes = await AcaoComercial.find({
      ean: { $in: todosEans },
      ativo: true,
    }).select('ean preco_acao tipo data_inicio data_fim vendor').lean();

    // Monta lookup: ean → melhor nossa ação ativa
    const hoje = new Date();
    const nossasMap = {};
    for (const a of nossasAcoes) {
      const inicio = new Date(a.data_inicio);
      const fim = new Date(a.data_fim);
      if (inicio <= hoje && fim >= hoje) {
        // Mantém o menor preço se houver múltiplas
        if (!nossasMap[a.ean] || a.preco_acao < nossasMap[a.ean].preco_acao) {
          nossasMap[a.ean] = a;
        }
      }
    }

    // Adiciona campo nossa_acao em cada item
    const resultado = dados.map(d => {
      const eans = Array.isArray(d.eans) ? d.eans.map(String) : d.eans ? [String(d.eans)] : [];
      const eanMatch = eans.find(e => nossasMap[e]);
      return {
        ...d,
        nossa_acao: eanMatch ? nossasMap[eanMatch] : null,
      };
    });

    // Lista de redes únicas (para filtros no front)
    const redes = [...new Set(dados.map(d => d.network_name).filter(Boolean))].sort();

    res.json({
      status: 'success',
      data: resultado,
      metadata: { total: resultado.length, redes },
    });
  } catch (err) {
    console.error('❌ GET /api/concorrencia:', err);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

export default router;
