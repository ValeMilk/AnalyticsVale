import { ChevronDown, Filter as Funnel, FilterX as FunnelX, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Label } from '../ui/Label';
import { usePreferenciaLocal } from '../../lib/usePreferenciaLocal';
import { cn } from '../../lib/cn';

/**
 * Painel de filtros colapsável, ciente de quais filtros estão ativos.
 * 1. A busca NUNCA entra no painel colapsável — fica sempre visível em `slotFixo`.
 * 2. Fechado, cada filtro ativo vira um chip removível.
 * 3. Nasce aberto quando `abrirQuando` é verdadeiro (ex.: recorte que chegou pela URL).
 */
export function PainelDeFiltros({ telaId, ativos = [], onLimparTudo, children, slotFixo, abrirQuando, maxChips = 6, className }) {
  const [preferencia, setPreferencia] = usePreferenciaLocal(`filtros-abertos:${telaId}`, null);
  const aberto = preferencia ?? abrirQuando ?? false;
  const visiveis = ativos.slice(0, maxChips);
  const ocultos = ativos.length - visiveis.length;

  return (
    <div className={cn('superficie', className)}>
      <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPreferencia(!aberto)}
            aria-expanded={aberto}
            aria-controls={`${telaId}-filtros`}
            className="gap-2 text-sm font-medium text-neutral-700"
          >
            <Funnel className="size-4 text-secondary" aria-hidden />
            Filtros
            {ativos.length > 0 && <Badge variant="outline">{ativos.length}</Badge>}
            <ChevronDown className={cn('size-4 transition-transform', aberto && 'rotate-180')} aria-hidden />
          </Button>

          {!aberto &&
            visiveis.map((filtro) => (
              <Badge key={filtro.id} variant="outline" className="gap-1 py-1 pl-2 pr-1 font-normal">
                <span className="truncate">{filtro.rotulo}</span>
                {filtro.onRemover && (
                  <button
                    type="button"
                    onClick={filtro.onRemover}
                    aria-label={`Remover filtro ${filtro.rotulo}`}
                    className="rounded-xs p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-secondary/30"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </Badge>
            ))}
          {!aberto && ocultos > 0 && <span className="text-xs text-neutral-400">+{ocultos}</span>}
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          {slotFixo}
          <Button variant="outline" onClick={onLimparTudo} disabled={ativos.length === 0} className="sm:h-8 sm:px-3 sm:text-xs">
            <FunnelX className="size-4" aria-hidden />
            Limpar
          </Button>
        </div>
      </div>

      {aberto && (
        <div id={`${telaId}-filtros`} className="grid grid-cols-1 gap-3 border-t border-neutral-200 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {children}
        </div>
      )}
    </div>
  );
}

/** Campo do painel: rótulo SEMPRE visível (placeholder some ao escolher um valor). */
export function CampoDeFiltro({ rotulo, ajuda, children, className, htmlFor }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor}>{rotulo}</Label>
      {children}
      {ajuda && <p className="text-xs text-neutral-500">{ajuda}</p>}
    </div>
  );
}

/** Descarta entradas falsas: `filtrosAtivos([busca && {...}, vendor !== 'ambos' && {...}])` */
export function filtrosAtivos(lista) {
  return lista.filter(Boolean);
}
