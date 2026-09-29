// Tokens de design — única fonte de verdade de cor, raio, sombra e movimento.
//
// tailwind.config.js lê este arquivo para gerar as utilities (bg-primary, text-neutral-500, ...)
// e para emitir as mesmas variáveis em :root (--primary, --neutral-500, --r-lg, ...).
// Componentes que precisam de cor em JS (gráficos) importam daqui.
// Regra: nunca um hex solto fora deste arquivo.

export const cores = {
  // Marca 1 — institucional/âncora (logo, títulos fortes, foco)
  primary: {
    DEFAULT: '#003D7A',
    foreground: '#FFFFFF',
    50: '#EAF1FA', 100: '#D0DFF2', 200: '#A3C0E5', 300: '#6F9BD3', 400: '#3F76BE',
    500: '#1A579E', 600: '#003D7A', 700: '#003263', 800: '#00264C', 900: '#001A34', 950: '#001022',
  },
  // Marca 2 — COR DE AÇÃO da interface: botão que grava, item ativo de menu, foco de campo.
  // É o azul histórico do IA Cometa (#0056A6). Decisão explícita: toda ação primária usa `secondary`.
  secondary: {
    DEFAULT: '#0056A6',
    foreground: '#FFFFFF',
    50: '#EEF5FC', 100: '#D9E8F8', 200: '#B3D1F1', 300: '#80B3E7', 400: '#4D94DC',
    500: '#1F74C7', 600: '#0056A6', 700: '#004585', 800: '#003463', 900: '#002342', 950: '#00162B',
  },
  // Marca 3 — superfícies e destaques suaves
  accent: { DEFAULT: '#F3F7FC', foreground: '#003D7A' },
  // Marca 4 — gráficos e destaques terciários
  tertiary: { DEFAULT: '#4A82C9', foreground: '#FFFFFF' },

  // Neutros — escala única para todo texto/borda secundária
  neutral: {
    50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1', 400: '#94A3B8',
    500: '#64748B', 600: '#475569', 700: '#334155', 800: '#1E293B', 900: '#0F172A', 950: '#020617',
  },

  // Feedback semântico — nunca reaproveitado como cor de marca
  success: { DEFAULT: '#15803D', foreground: '#FFFFFF' },
  warning: { DEFAULT: '#B45309', foreground: '#FFFFFF' },
  danger: { DEFAULT: '#B91C1C', foreground: '#FFFFFF' },
  info: { DEFAULT: '#0369A1', foreground: '#FFFFFF' },
  destructive: { DEFAULT: '#B91C1C', foreground: '#FFFFFF' },

  // Superfícies
  background: '#FFFFFF',
  foreground: '#0F172A',
  card: '#FFFFFF',
  muted: { DEFAULT: '#F1F5F9', foreground: '#64748B' },
  border: '#E2E8F0',
  input: '#FFFFFF',
  ring: '#3F76BE',
  focus: '#003D7A',

  // Sidebar — tokens próprios
  sidebar: {
    DEFAULT: '#FFFFFF',
    foreground: '#334155',
    primary: '#0056A6',
    accent: '#0056A6',
    border: '#E2E8F0',
  },
};

// Fundo em degradê da casca (tons claros da marca)
export const gradiente = { from: '#F5F9FD', via: '#E6F0FA', to: '#CFE0F2' };

export const raio = { xs: '2px', sm: '8px', md: '10px', lg: '12px', xl: '16px', full: '999px' };

export const sombra = {
  sm: '0 1px 2px -1px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.1)',
  md: '0 2px 4px -2px rgba(16,24,40,.08), 0 4px 6px -1px rgba(16,24,40,.12)',
  lg: '0 8px 16px -4px rgba(16,24,40,.18), 0 4px 6px -2px rgba(16,24,40,.12)',
};

export const movimento = {
  ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
  rapido: '120ms',
  normal: '180ms',
  lento: '350ms',
};

// Paleta de gráficos e cores de domínio (tipo de ação comercial).
// São cores de série, não cores de marca — vivem aqui para não virar hex solto nos componentes.
export const graficos = {
  padrao: cores.secondary.DEFAULT,
  grade: cores.neutral[200],
  eixo: cores.neutral[500],
  series: [
    cores.secondary.DEFAULT, '#7C3AED', '#DB2777', '#0891B2', '#059669', '#D97706',
    '#DC2626', '#9333EA', '#0284C7', '#16A34A', '#CA8A04', '#E11D48',
  ],
  acoes: {
    encarte: '#CA8A04',
    oferta_interna: '#059669',
    rebaixa: '#EA580C',
  },
};

function achatar(obj, prefixo = '') {
  const saida = {};
  for (const [chave, valor] of Object.entries(obj)) {
    const nome = chave === 'DEFAULT' ? prefixo : prefixo ? `${prefixo}-${chave}` : chave;
    if (valor && typeof valor === 'object') Object.assign(saida, achatar(valor, nome));
    else saida[`--${nome}`] = String(valor);
  }
  return saida;
}

// Variáveis CSS emitidas em :root pelo plugin do Tailwind (ver tailwind.config.js)
export const variaveisCss = {
  ...achatar(cores),
  '--acao-encarte': graficos.acoes.encarte,
  '--acao-oferta-interna': graficos.acoes.oferta_interna,
  '--acao-rebaixa': graficos.acoes.rebaixa,
  '--layout-grad-from': gradiente.from,
  '--layout-grad-via': gradiente.via,
  '--layout-grad-to': gradiente.to,
  '--radius': raio.sm,
  '--r-xs': raio.xs,
  '--r-sm': raio.sm,
  '--r-md': raio.md,
  '--r-lg': raio.lg,
  '--r-xl': raio.xl,
  '--r-full': raio.full,
  '--shadow-sm': sombra.sm,
  '--shadow-md': sombra.md,
  '--shadow-lg': sombra.lg,
  '--ease': movimento.ease,
  '--t-fast': `${movimento.rapido} ${movimento.ease}`,
  '--t': `${movimento.normal} ${movimento.ease}`,
  '--t-slow': `${movimento.lento} ${movimento.ease}`,
};
