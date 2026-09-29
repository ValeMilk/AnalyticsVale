import { cn } from '../../lib/cn';

const VARIANTES = {
  default: 'border-transparent bg-primary text-primary-foreground',
  secondary: 'border-transparent bg-secondary text-secondary-foreground',
  destructive: 'border-transparent bg-destructive text-white',
  outline: 'border-neutral-200 bg-white text-neutral-700',
  // Status semânticos (mesma forma, cor de feedback)
  sucesso: 'border-success/30 bg-success/10 text-success',
  alerta: 'border-warning/30 bg-warning/10 text-warning',
  perigo: 'border-danger/30 bg-danger/10 text-danger',
  info: 'border-info/30 bg-info/10 text-info',
  neutro: 'border-transparent bg-neutral-100 text-neutral-600',
};

export function Badge({ variant = 'default', className, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium [&>svg]:size-3',
        VARIANTES[variant] ?? VARIANTES.default,
        className
      )}
      {...props}
    />
  );
}
