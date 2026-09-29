import { graficos } from '../styles/tokens';

// Tipos de ação comercial: rótulo e cor (a mesma dos gráficos) em um lugar só.
export const TIPOS_ACAO = [
  { value: 'encarte', label: 'Encarte', cor: graficos.acoes.encarte },
  { value: 'oferta_interna', label: 'Oferta interna', cor: graficos.acoes.oferta_interna },
  { value: 'rebaixa', label: 'Rebaixa', cor: graficos.acoes.rebaixa },
];

export const ROTULO_TIPO_ACAO = Object.fromEntries(TIPOS_ACAO.map((t) => [t.value, t.label]));
export const COR_TIPO_ACAO = Object.fromEntries(TIPOS_ACAO.map((t) => [t.value, t.cor]));

// Prioridade quando mais de uma ação vale no mesmo dia (encarte > oferta interna > rebaixa)
export const PRIORIDADE_TIPO_ACAO = TIPOS_ACAO.map((t) => t.value);

export const normEan = (e) => String(e ?? '').replace(/,+$/, '').trim();
