import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';
import { cn } from '../../lib/cn';

const CLASSES_POR_TOM = {
  neutro: 'text-neutral-800',
  alerta: 'text-warning',
  perigo: 'text-danger',
  sucesso: 'text-success',
};

/**
 * Cartão de indicador. Três formas, decididas pelas props: leitura pura (div), link (href)
 * ou filtro clicável (onClick + aria-pressed; clicar no cartão ativo REMOVE o filtro).
 * `valor === undefined` mostra skeleton — o cartão nasce já no tamanho final.
 */
export function CartaoDeResumo({ rotulo, valor, tom = 'neutro', apoio, onClick, href, ativo, destaque, className }) {
  const conteudo = (
    <>
      <span className="flex items-start justify-between gap-2 text-xs font-medium text-neutral-600">
        {rotulo}
        {href && <ArrowUpRight className="size-4 text-neutral-400" aria-hidden />}
      </span>
      {valor === undefined ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <span className={cn('truncate text-2xl font-semibold tabular-nums', CLASSES_POR_TOM[tom] ?? CLASSES_POR_TOM.neutro)}>{valor}</span>
      )}
      {apoio && <span className="truncate text-xs text-neutral-500">{apoio}</span>}
    </>
  );

  const base = 'flex min-h-[76px] flex-col justify-between gap-1 rounded-lg border bg-white p-3 text-left';
  const borda = destaque ? 'border-warning/60 bg-warning/5' : 'border-neutral-200';

  if (href) {
    return (
      <Link to={href} className={cn(base, borda, 'transition-colors hover:border-secondary hover:bg-secondary/5 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-secondary/30', className)}>
        {conteudo}
      </Link>
    );
  }
  if (!onClick) return <div className={cn(base, borda, className)}>{conteudo}</div>;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={Boolean(ativo)}
      className={cn(base, ativo ? 'border-secondary ring-1 ring-secondary/30' : borda, 'transition-colors hover:border-secondary/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-secondary/30', className)}
    >
      {conteudo}
    </button>
  );
}

/** Grade responsiva de cartões: NUNCA rolagem horizontal. `colunas` = 3 ou 4 (no desktop). */
export function FaixaDeResumo({ children, colunas = 4, className }) {
  const grade = colunas === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4';
  return <div className={cn('grid gap-3', grade, className)}>{children}</div>;
}
