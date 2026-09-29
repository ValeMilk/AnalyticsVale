// Formatação central de número e data.
// Regra: data SEMPRE a partir da string crua (aaaa-mm-dd), nunca de um `new Date()` recalculado,
// para não recuar um dia por causa do fuso do navegador.

export const fmtMoeda = (v) =>
  Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const fmtNumero = (v, casas = 0) =>
  Number(v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

export const fmtPct = (v, casas = 1) => `${Number(v ?? 0).toFixed(casas)}%`;

export const fmtPctComSinal = (v, casas = 1) => `${v > 0 ? '+' : ''}${Number(v ?? 0).toFixed(casas)}%`;

/** Formato numérico das colunas de tabela: 'moeda' | 'quantidade' | 'inteiro' | 'percentual' */
export function formatarNumero(valor, formato) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return '';
  switch (formato) {
    case 'moeda':
      return fmtMoeda(valor);
    case 'inteiro':
      return fmtNumero(valor, 0);
    case 'percentual':
      return fmtPct(valor);
    case 'quantidade':
    default:
      return Number(valor).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  }
}

/** Reduz qualquer valor de data (string ISO, Date) à string crua aaaa-mm-dd */
export function soData(v) {
  if (!v) return null;
  if (typeof v === 'string') return v.slice(0, 10);
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  return null;
}

export function fmtData(v) {
  const d = soData(v);
  if (!d || d.length < 10) return '';
  const [a, m, dia] = d.split('-');
  return `${dia}/${m}/${a}`;
}

export function fmtDataCurta(v) {
  const d = soData(v);
  if (!d || d.length < 10) return '';
  const [, m, dia] = d.split('-');
  return `${dia}/${m}`;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function fmtDiaSemana(v) {
  const d = soData(v);
  if (!d) return '';
  const [a, m, dia] = d.split('-').map(Number);
  return DIAS_SEMANA[new Date(Date.UTC(a, m - 1, dia)).getUTCDay()];
}

const MESES_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/** '2026-03' → 'Mar/26' */
export function fmtMesAno(mesStr) {
  if (!mesStr) return '';
  const [ano, m] = mesStr.split('-');
  return `${MESES_PT[Number(m) - 1] ?? m}/${ano.slice(2)}`;
}

/** Data de hoje no fuso local, como aaaa-mm-dd (evita o "amanhã" do toISOString após 21h no Brasil) */
export function hojeLocal() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/** Soma dias a uma data aaaa-mm-dd, devolvendo aaaa-mm-dd */
export function somarDias(dataStr, dias) {
  const [a, m, d] = dataStr.split('-').map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d + dias));
  return dt.toISOString().slice(0, 10);
}

/** Primeiro dia do mês (deslocado em `mesesAtras` meses) como aaaa-mm-dd */
export function primeiroDiaDoMes(mesesAtras = 0) {
  const hoje = hojeLocal();
  const [a, m] = hoje.split('-').map(Number);
  const dt = new Date(Date.UTC(a, m - 1 - mesesAtras, 1));
  return dt.toISOString().slice(0, 10);
}

export const iniciais = (nome = '') =>
  nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
