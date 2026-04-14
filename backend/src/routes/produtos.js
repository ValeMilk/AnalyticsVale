import { Router } from 'express';
import { query } from '../services/db.js';
import { getCached, setCache } from '../services/cache.js';

const router = Router();

// Palavras de marca/empresa removidas do nome
const MARCAS = ['vale milk', 'valemilk', 'valefish', 'vale fish'];

// Variantes que aparecem ANTES da gramatura e devem ser removidas
const VARIANTES_PRE = [
  'trad', 'tradicional', 'lig', 'light', 'zero', 'diet',
  'sem lac', 'sem/lac', 'semlac', 'zero lac', 'zero lactose', 'sem lactose',
  'integral', 'firme', 'batido', 'batida', 'natural', 'original',
  'classico', 'classica', 'premium', 'especial', 'defumado', 'defumada',
  'fatiado', 'fatiada', 'temperado', 'temperada', 'com sal', 'sem sal',
];

// Abreviações comuns → palavra base
const ABREV = {
  'req': 'requeijão', 'req.': 'requeijão',
  'beb': 'bebida', 'beb.': 'bebida',
  'lact': 'láctea', 'lact.': 'láctea',
  'muss': 'muçarela', 'muç': 'muçarela', 'muz': 'muçarela',
  'queij': 'queijo',
  'man': 'manteiga',
  'yog': 'iogurte', 'iog': 'iogurte',
  'crem': 'cremoso',
};

function inferirSubcategoria(nome) {
  if (!nome) return 'Outros';

  let s = nome;

  // 1. Remove marca
  for (const marca of MARCAS) {
    s = s.replace(new RegExp(marca, 'gi'), '');
  }

  // 2. Remove variantes que aparecem ANTES da gramatura (case-insensitive, palavra inteira)
  for (const v of VARIANTES_PRE) {
    s = s.replace(new RegExp(`\\b${v.replace(/[/]/g, '\\/')}\\b`, 'gi'), '');
  }

  // 3. Encontra gramatura/volume (ex: 400g, 200ml, 1kg, 540G)
  const gramMatch = s.match(/\b(\d+[,.]?\d*)\s*(g|kg|ml|l|gr)\b/i);

  if (gramMatch) {
    // 4. Mantém apenas o que vem ANTES da gramatura (remove sabor/variante que vem depois)
    const idx = s.indexOf(gramMatch[0]);
    s = s.slice(0, idx);
    const gram = gramMatch[0].replace(/\s+/, '').toUpperCase();

    // 5. Expande abreviações
    const words = s.trim().split(/\s+/);
    const expanded = words.map(w => {
      const low = w.toLowerCase().replace(/[^a-záéíóúâêôãõü]/g, '');
      return ABREV[low] || w;
    });

    const base = expanded
      .filter(w => w.trim().length > 1)
      .join(' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    const capitalizado = base.split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    return capitalizado ? `${capitalizado} ${gram}` : gram;
  }

  // Sem gramatura: usa o nome limpo
  const words = s.trim().split(/\s+/);
  const expanded = words.map(w => {
    const low = w.toLowerCase().replace(/[^a-záéíóúâêôãõü]/g, '');
    return ABREV[low] || w;
  });
  const base = expanded.filter(w => w.trim().length > 1).join(' ').trim();
  return base.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') || 'Outros';
}

// Lista produtos únicos (EAN + nome) de todas as tabelas de vendas
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'produtos_lista';
    const cached = getCached(cacheKey);
    if (cached) return res.json({ status: 'success', data: cached });

    const sql = `
      SELECT ean, cod_interno, MIN(produto) as produto FROM (
        SELECT ean, cod_interno, produto FROM vendas GROUP BY ean, cod_interno, produto
        UNION
        SELECT ean, cod_interno, produto FROM vendas_valefish GROUP BY ean, cod_interno, produto
      ) sub
      GROUP BY ean, cod_interno
      ORDER BY produto
    `;

    const result = await query(sql, []);
    const rows = result.rows.map(r => ({
      ...r,
      subcategoria: inferirSubcategoria(r.produto),
    }));
    setCache(cacheKey, rows, 10); // cache 10 min
    res.json({ status: 'success', data: rows });
  } catch (err) {
    console.error('❌ Erro GET /api/produtos:', err);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

export default router;

