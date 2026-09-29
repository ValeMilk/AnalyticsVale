import { COR_TIPO_ACAO, ROTULO_TIPO_ACAO } from '../config/acoes';
import { cn } from '../lib/cn';

// Badge do tipo de ação: mesma cor dos gráficos, vinda dos tokens (nunca hex solto aqui).
export function BadgeDeTipoDeAcao({ tipo, className, tamanho = 'default' }) {
  const cor = COR_TIPO_ACAO[tipo];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border font-medium',
        tamanho === 'sm' ? 'px-1.5 py-0 text-[11px]' : 'px-2 py-0.5 text-xs',
        !cor && 'border-neutral-200 bg-neutral-100 text-neutral-600',
        className
      )}
      style={cor ? { color: cor, backgroundColor: `${cor}14`, borderColor: `${cor}4D` } : undefined}
    >
      <span className="size-1.5 rounded-full" style={cor ? { backgroundColor: cor } : undefined} aria-hidden />
      {ROTULO_TIPO_ACAO[tipo] ?? tipo}
    </span>
  );
}

export function LegendaDeAcoes({ className }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3 text-xs text-neutral-500', className)} aria-label="Legenda de tipos de ação">
      {Object.entries(ROTULO_TIPO_ACAO).map(([tipo, rotulo]) => (
        <span key={tipo} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: COR_TIPO_ACAO[tipo] }} aria-hidden />
          {rotulo}
        </span>
      ))}
    </div>
  );
}
