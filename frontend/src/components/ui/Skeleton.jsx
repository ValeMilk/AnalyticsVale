import { cn } from '../../lib/cn';

// Sempre do tamanho aproximado do conteúdo final, para o layout não "pular" quando o dado chega.
export function Skeleton({ className, ...props }) {
  return <div className={cn('animate-pulse rounded-md bg-neutral-100', className)} aria-hidden {...props} />;
}
