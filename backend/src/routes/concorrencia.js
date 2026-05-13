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
    // Normaliza: remove zeros à esquerda e converte para string
    const normEan = (e) => String(e).replace(/^0+/, '') || String(e);

    const todosEans = [...new Set(
      dados.flatMap(d => {
        let eanList = [];
        if (Array.isArray(d.eans)) eanList = d.eans.map(String);
        else if (d.eans) eanList = [String(d.eans)];
        // Inclui versão com e sem zeros à esquerda
        return eanList.flatMap(e => [e, normEan(e)]);
      })
    )];

    // Busca TODAS as nossas ações (sem filtro de data — vamos checar sobreposição por item)
    const nossasAcoes = await AcaoComercial.find({
      ean: { $in: todosEans },
      ativo: true,
    }).select('ean preco_acao tipo data_inicio data_fim vendor').lean();

    // Monta lookup: ean → lista de nossas ações
    const nossasMap = {};
    for (const a of nossasAcoes) {
      const keys = [a.ean, normEan(a.ean)];
      for (const key of keys) {
        if (!nossasMap[key]) nossasMap[key] = [];
        nossasMap[key].push(a);
      }
    }

    // Adiciona campo nossa_acao em cada item: busca ação com sobreposição de datas
    const resultado = dados.map(d => {
      const eanList = Array.isArray(d.eans) ? d.eans.map(String) : d.eans ? [String(d.eans)] : [];
      const compInicio = d.validity_start_date;
      const compFim = d.validity_finish_date;

      let melhorAcao = null;
      for (const e of eanList) {
        const acoes = nossasMap[e] || nossasMap[normEan(e)] || [];
        for (const a of acoes) {
          const nossaInicio = a.data_inicio?.toISOString?.().slice(0, 10) || String(a.data_inicio).slice(0, 10);
          const nossaFim   = a.data_fim?.toISOString?.().slice(0, 10)    || String(a.data_fim).slice(0, 10);
          // Sobreposição: nossa ação começa antes do fim do concorrente E termina após o início
          const overlap = nossaInicio <= compFim && nossaFim >= compInicio;
          if (overlap) {
            // Mantém a ação com menor preço em caso de múltiplas
            if (!melhorAcao || a.preco_acao < melhorAcao.preco_acao) {
              melhorAcao = a;
            }
          }
        }
      }
      return { ...d, nossa_acao: melhorAcao };
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
