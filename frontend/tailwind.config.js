import plugin from 'tailwindcss/plugin';
import { cores, raio, sombra, movimento, variaveisCss } from './src/styles/tokens.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Todos os tokens de cor viram utilities: bg-primary, text-secondary, border-neutral-200, ...
      colors: cores,
      borderColor: { DEFAULT: cores.border },
      // Raio: rounded-sm (8px) para inputs/botões, rounded-lg (12px) para cards/tabela, rounded-xl (16px) para diálogos
      borderRadius: {
        xs: raio.xs,
        sm: raio.sm,
        md: raio.md,
        lg: raio.lg,
        xl: raio.xl,
        '2xl': '20px',
        full: raio.full,
      },
      boxShadow: { sm: sombra.sm, md: sombra.md, lg: sombra.lg },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      transitionTimingFunction: { DEFAULT: movimento.ease },
      transitionDuration: { DEFAULT: movimento.normal, fast: movimento.rapido, slow: movimento.lento },
      maxWidth: { conteudo: '1600px' },
    },
  },
  plugins: [
    // Emite as variáveis CSS em :root a partir do mesmo arquivo de tokens
    plugin(({ addBase }) => {
      addBase({ ':root': variaveisCss });
    }),
  ],
};
