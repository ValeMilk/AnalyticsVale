import { query } from './db.js';
import { getCached, setCache } from './cache.js';
import AcaoComercial from '../models/AcaoComercial.js';

/**
 * Análise de eficácia de uma ação pelo ID (uso externo / rota individual)
 */
export async function analisarEficacia(acaoId, compInicio = null, compFim = null) {
  const cacheKey = `analise_${acaoId}_${compInicio}_${compFim}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const acao = await AcaoComercial.findById(acaoId);
  if (!acao) throw new Error('Ação não encontrada');

  const resultado = await _calcularAnalise(acao, compInicio, compFim);
  setCache(cacheKey, resultado, 15);
  return resultado;
}

/**
 * Análise interna — recebe o objeto da ação direto, sem nova query ao MongoDB
 */
async function _calcularAnalise(acao, compInicio = null, compFim = null) {
  const inicio = acao.data_inicio;
  const fim = acao.data_fim;
  const duracaoDias = Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24)) + 1;

  let inicioAnterior, fimAnterior;
  if (compInicio && compFim) {
    inicioAnterior = new Date(compInicio);
    fimAnterior = new Date(compFim);
  } else {
    inicioAnterior = new Date(inicio);
    inicioAnterior.setDate(inicioAnterior.getDate() - duracaoDias);
    fimAnterior = new Date(inicio);
    fimAnterior.setDate(fimAnterior.getDate() - 1);
  }
  const diasComp = Math.ceil((fimAnterior - inicioAnterior) / (1000 * 60 * 60 * 24)) + 1;

  const tables = getTablesForVendor(acao.vendor);
  const identifier = acao.cod_interno || acao.ean;
  const idField = acao.cod_interno ? 'cod_interno' : 'ean';

  const [vendasAcao, vendasAnterior] = await Promise.all([
    queryVendasPeriodo(tables, identifier, idField, inicio, fim),
    queryVendasPeriodo(tables, identifier, idField, inicioAnterior, fimAnterior),
  ]);

  const variacao = calcularVariacao(vendasAnterior, vendasAcao, diasComp, duracaoDias);

  return {
    acao: {
      _id: acao._id,
      tipo: acao.tipo,
      produto: acao.produto,
      ean: acao.ean,
      cod_interno: acao.cod_interno,
      preco_acao: acao.preco_acao,
      preco_normal: acao.preco_normal,
      data_inicio: acao.data_inicio,
      data_fim: acao.data_fim,
      vendor: acao.vendor,
    },
    periodo_acao: {
      inicio: inicio.toISOString().slice(0, 10),
      fim: fim.toISOString().slice(0, 10),
      dias: duracaoDias,
      ...vendasAcao,
      qtd_dia: duracaoDias > 0 ? Number((vendasAcao.qtd / duracaoDias).toFixed(2)) : 0,
      venda_dia: duracaoDias > 0 ? Number((vendasAcao.venda / duracaoDias).toFixed(2)) : 0,
      margem_dia: duracaoDias > 0 ? Number((vendasAcao.margem / duracaoDias).toFixed(2)) : 0,
    },
    periodo_anterior: {
      inicio: inicioAnterior.toISOString().slice(0, 10),
      fim: fimAnterior.toISOString().slice(0, 10),
      dias: diasComp,
      ...vendasAnterior,
      qtd_dia: diasComp > 0 ? Number((vendasAnterior.qtd / diasComp).toFixed(2)) : 0,
      venda_dia: diasComp > 0 ? Number((vendasAnterior.venda / diasComp).toFixed(2)) : 0,
      margem_dia: diasComp > 0 ? Number((vendasAnterior.margem / diasComp).toFixed(2)) : 0,
    },
    variacao,
    eficaz: variacao.qtd_dia_percent > 0 && variacao.venda_dia_percent > 0,
  };
}

/**
 * Análise de todas as ações — 1 query por produto único via CASE WHEN (muito mais eficiente)
 */
export async function analisarTodasAcoes(filtros = {}) {
  const cacheKey = `analise_todas_${JSON.stringify(filtros)}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const filter = {};
  if (filtros.tipo) filter.tipo = filtros.tipo;
  if (filtros.vendor) filter.vendor = filtros.vendor;

  const acoes = await AcaoComercial.find(filter).sort({ data_inicio: -1 }).limit(200);

  // Pré-calcular períodos para todas as ações (sem I/O)
  const acoesInfo = acoes.map(acao => {
    const inicio = acao.data_inicio;
    const fim = acao.data_fim;
    const duracaoDias = Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24)) + 1;
    let inicioAnterior, fimAnterior;
    if (filtros.comp_inicio && filtros.comp_fim) {
      inicioAnterior = new Date(filtros.comp_inicio);
      fimAnterior = new Date(filtros.comp_fim);
    } else {
      inicioAnterior = new Date(inicio);
      inicioAnterior.setDate(inicioAnterior.getDate() - duracaoDias);
      fimAnterior = new Date(inicio);
      fimAnterior.setDate(fimAnterior.getDate() - 1);
    }
    const diasComp = Math.ceil((fimAnterior - inicioAnterior) / (1000 * 60 * 60 * 24)) + 1;
    const identifier = acao.cod_interno || acao.ean;
    const idField = acao.cod_interno ? 'cod_interno' : 'ean';
    return { acao, inicio, fim, inicioAnterior, fimAnterior, duracaoDias, diasComp, identifier, idField };
  });

  // Agrupar por produto único → 1 query por produto (em vez de 2 por ação)
  const grupos = new Map();
  acoesInfo.forEach(info => {
    const key = `${info.identifier}||${info.idField}||${info.acao.vendor}`;
    if (!grupos.has(key)) {
      grupos.set(key, { identifier: info.identifier, idField: info.idField, vendor: info.acao.vendor, items: [] });
    }
    grupos.get(key).items.push(info);
  });

  // Executar 1 query por produto em paralelo
  const vendasPorGrupo = new Map();
  await Promise.allSettled([...grupos.entries()].map(async ([key, grupo]) => {
    try {
      const tables = getTablesForVendor(grupo.vendor);
      if (!tables.length) return;
      const periodos = grupo.items.flatMap((item, i) => [
        { key: `a${i}`, inicio: item.inicio.toISOString().slice(0, 10), fim: item.fim.toISOString().slice(0, 10) },
        { key: `c${i}`, inicio: item.inicioAnterior.toISOString().slice(0, 10), fim: item.fimAnterior.toISOString().slice(0, 10) },
      ]);
      const dados = await queryVendasLote(tables, grupo.identifier, grupo.idField, periodos);
      vendasPorGrupo.set(key, { dados, items: grupo.items });
    } catch (e) {
      console.warn(`⚠️ Erro no grupo ${key}: ${e.message}`);
    }
  }));

  // Montar resultados
  const todos = [];
  vendasPorGrupo.forEach(({ dados: vendasDados, items }) => {
    items.forEach((item, i) => {
      const vendasAcao = vendasDados[`a${i}`] || { qtd: 0, venda: 0, margem: 0, margem_percent: 0 };
      const vendasAnterior = vendasDados[`c${i}`] || { qtd: 0, venda: 0, margem: 0, margem_percent: 0 };
      const variacao = calcularVariacao(vendasAnterior, vendasAcao, item.diasComp, item.duracaoDias);
      todos.push({
        acao: {
          _id: item.acao._id, tipo: item.acao.tipo, produto: item.acao.produto,
          ean: item.acao.ean, cod_interno: item.acao.cod_interno,
          preco_acao: item.acao.preco_acao, preco_normal: item.acao.preco_normal,
          data_inicio: item.acao.data_inicio, data_fim: item.acao.data_fim, vendor: item.acao.vendor,
        },
        periodo_acao: {
          inicio: item.inicio.toISOString().slice(0, 10), fim: item.fim.toISOString().slice(0, 10), dias: item.duracaoDias, ...vendasAcao,
          qtd_dia: item.duracaoDias > 0 ? Number((vendasAcao.qtd / item.duracaoDias).toFixed(2)) : 0,
          venda_dia: item.duracaoDias > 0 ? Number((vendasAcao.venda / item.duracaoDias).toFixed(2)) : 0,
          margem_dia: item.duracaoDias > 0 ? Number((vendasAcao.margem / item.duracaoDias).toFixed(2)) : 0,
        },
        periodo_anterior: {
          inicio: item.inicioAnterior.toISOString().slice(0, 10), fim: item.fimAnterior.toISOString().slice(0, 10), dias: item.diasComp, ...vendasAnterior,
          qtd_dia: item.diasComp > 0 ? Number((vendasAnterior.qtd / item.diasComp).toFixed(2)) : 0,
          venda_dia: item.diasComp > 0 ? Number((vendasAnterior.venda / item.diasComp).toFixed(2)) : 0,
          margem_dia: item.diasComp > 0 ? Number((vendasAnterior.margem / item.diasComp).toFixed(2)) : 0,
        },
        variacao,
        eficaz: variacao.qtd_dia_percent > 0 && variacao.venda_dia_percent > 0,
      });
    });
  });

  const dados = todos.sort((a, b) => (b.variacao.venda_percent || 0) - (a.variacao.venda_percent || 0));
  setCache(cacheKey, dados, 15);
  return dados;
}

// ---- Helpers ----

function getTablesForVendor(vendor) {
  const tables = [];
  if (vendor === 'ambos' || vendor === 'valemilk') tables.push({ t: 'vendas', pct: 0.70 });
  if (vendor === 'ambos' || vendor === 'valefish') tables.push({ t: 'vendas_valefish', pct: 0.75 });
  return tables;
}

async function queryVendasPeriodo(tables, identifier, idField, inicio, fim) {
  const whereClause = idField === 'ean'
    ? `(ean = $1 OR ean = $1 || ',')`
    : `${idField} = $1`;
  const eanNorm = idField === 'ean' ? identifier.replace(/,+$/, '') : identifier;

  const unions = tables.map(({ t, pct }) =>
    `SELECT qtd, venda, venda * ${pct} as margem FROM ${t} WHERE ${whereClause} AND data >= $2 AND data <= $3`
  ).join(' UNION ALL ');

  const sql = `
    SELECT COALESCE(SUM(qtd), 0) as qtd,
           COALESCE(SUM(venda), 0) as venda,
           COALESCE(SUM(margem), 0) as margem
    FROM (${unions}) sub
  `;

  const res = await query(sql, [eanNorm, inicio.toISOString().slice(0, 10), fim.toISOString().slice(0, 10)]);
  const r = res.rows[0];
  const venda = Number(r.venda);
  const margem = Number(r.margem);
  return { qtd: Number(r.qtd), venda, margem, margem_percent: venda > 0 ? (margem / venda * 100) : 0 };
}

/**
 * Busca múltiplos períodos para um produto em UMA única query PostgreSQL via CASE WHEN.
 * periodos = [{ key: 'a0', inicio: 'YYYY-MM-DD', fim: 'YYYY-MM-DD' }, ...]
 * Retorna { a0: { qtd, venda, margem, margem_percent }, c0: {...}, ... }
 */
async function queryVendasLote(tables, identifier, idField, periodos) {
  const eanNorm = idField === 'ean' ? identifier.replace(/,+$/, '') : identifier;
  const whereId = idField === 'ean' ? `(ean = $1 OR ean = $1 || ',')` : `${idField} = $1`;

  const datas = periodos.flatMap(p => [p.inicio, p.fim]).sort();
  const dataMin = datas[0];
  const dataMax = datas[datas.length - 1];

  // Cada tabela retorna UMA linha aggregada com todas as colunas de períodos
  const buildSelect = (t, pct) => {
    const cols = periodos.flatMap(p => [
      `COALESCE(SUM(CASE WHEN data >= '${p.inicio}' AND data <= '${p.fim}' THEN qtd ELSE 0 END), 0) as qtd_${p.key}`,
      `COALESCE(SUM(CASE WHEN data >= '${p.inicio}' AND data <= '${p.fim}' THEN venda ELSE 0 END), 0) as venda_${p.key}`,
      `COALESCE(SUM(CASE WHEN data >= '${p.inicio}' AND data <= '${p.fim}' THEN venda * ${pct} ELSE 0 END), 0) as margem_${p.key}`,
    ]);
    return `SELECT ${cols.join(', ')} FROM ${t} WHERE ${whereId} AND data >= '${dataMin}' AND data <= '${dataMax}'`;
  };

  let sql;
  if (tables.length === 1) {
    sql = buildSelect(tables[0].t, tables[0].pct);
  } else {
    const outerCols = periodos.flatMap(p => [
      `SUM(qtd_${p.key}) as qtd_${p.key}`,
      `SUM(venda_${p.key}) as venda_${p.key}`,
      `SUM(margem_${p.key}) as margem_${p.key}`,
    ]);
    const inner = tables.map(({ t, pct }) => buildSelect(t, pct)).join(' UNION ALL ');
    sql = `SELECT ${outerCols.join(', ')} FROM (${inner}) sub`;
  }

  const res = await query(sql, [eanNorm]);
  const row = res.rows[0];
  const result = {};
  periodos.forEach(p => {
    const venda = Number(row[`venda_${p.key}`] || 0);
    const margem = Number(row[`margem_${p.key}`] || 0);
    result[p.key] = { qtd: Number(row[`qtd_${p.key}`] || 0), venda, margem, margem_percent: venda > 0 ? (margem / venda * 100) : 0 };
  });
  return result;
}

function calcularVariacao(anterior, atual, diasAnterior, diasAtual) {
  const pct = (novo, velho) => {
    if (velho === 0) return novo > 0 ? 100 : 0;
    return ((novo - velho) / velho) * 100;
  };

  const qtdDiaAtual = diasAtual > 0 ? atual.qtd / diasAtual : 0;
  const qtdDiaAnterior = diasAnterior > 0 ? anterior.qtd / diasAnterior : 0;
  const vendaDiaAtual = diasAtual > 0 ? atual.venda / diasAtual : 0;
  const vendaDiaAnterior = diasAnterior > 0 ? anterior.venda / diasAnterior : 0;
  const margemDiaAtual = diasAtual > 0 ? atual.margem / diasAtual : 0;
  const margemDiaAnterior = diasAnterior > 0 ? anterior.margem / diasAnterior : 0;

  return {
    // totais absolutos
    qtd_diff: atual.qtd - anterior.qtd,
    qtd_percent: Number(pct(atual.qtd, anterior.qtd).toFixed(2)),
    venda_diff: Number((atual.venda - anterior.venda).toFixed(2)),
    venda_percent: Number(pct(atual.venda, anterior.venda).toFixed(2)),
    margem_diff: Number((atual.margem - anterior.margem).toFixed(2)),
    margem_percent: Number(pct(atual.margem, anterior.margem).toFixed(2)),
    // normalizados por dia (principal métrica de comparação)
    qtd_dia_percent: Number(pct(qtdDiaAtual, qtdDiaAnterior).toFixed(2)),
    venda_dia_percent: Number(pct(vendaDiaAtual, vendaDiaAnterior).toFixed(2)),
    margem_dia_percent: Number(pct(margemDiaAtual, margemDiaAnterior).toFixed(2)),
  };
}
