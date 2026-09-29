import { forwardRef } from 'react';
import { cn } from '../../lib/cn';

const BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

// `secondary` é A COR DE AÇÃO da tela (grava, exporta, avança). `default` é o tom institucional.
export const VARIANTES_BOTAO = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  destructive: 'bg-destructive text-white hover:bg-destructive/90',
  outline: 'border border-neutral-200 bg-white text-neutral-700 hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
  ghost: 'text-neutral-600 hover:bg-accent hover:text-accent-foreground',
  link: 'text-secondary underline-offset-4 hover:underline',
};

// Altura única de controle: default 40px, sm 32px, lg 44px
export const TAMANHOS_BOTAO = {
  default: 'h-10 px-4 py-2',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-11 px-6',
  icon: 'size-10',
  'icon-sm': 'size-8',
  'icon-lg': 'size-11',
};

export function buttonVariants({ variant = 'default', size = 'default', className } = {}) {
  return cn(BASE, VARIANTES_BOTAO[variant] ?? VARIANTES_BOTAO.default, TAMANHOS_BOTAO[size] ?? TAMANHOS_BOTAO.default, className);
}

export const Button = forwardRef(function Button(
  { variant = 'default', size = 'default', className, type = 'button', ...props },
  ref
) {
  return <button ref={ref} type={type} className={buttonVariants({ variant, size, className })} {...props} />;
});
