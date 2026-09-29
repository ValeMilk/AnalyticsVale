import { cn } from '../../lib/cn';

/** Um registro como cartão (visão de celular). Título e etiqueta são texto puro; campos vêm de celula(). */
export function CartaoDeLinha({ titulo, etiqueta, status, campos = [], aoTocar, className }) {
  const clicavel = typeof aoTocar === 'function';
  return (
    <div
      role={clicavel ? 'button' : undefined}
      tabIndex={clicavel ? 0 : undefined}
      onClick={aoTocar}
      onKeyDown={
        clicavel
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                aoTocar();
              }
            }
          : undefined
      }
      className={cn('superficie p-3', clicavel && 'cursor-pointer transition-colors hover:border-secondary/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-secondary/30', className)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {titulo && <p className="truncate text-sm font-semibold text-neutral-900">{titulo}</p>}
          {etiqueta && <p className="truncate text-xs text-neutral-500">{etiqueta}</p>}
        </div>
        {status && <div className="shrink-0">{status}</div>}
      </div>
      {campos.length > 0 && (
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
          {campos.map((c) => (
            <div key={c.rotulo} className={cn('min-w-0', c.largo && 'col-span-2')}>
              <dt className="text-[11px] text-neutral-500">{c.rotulo}</dt>
              <dd className="truncate text-sm text-neutral-800">{c.valor}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
