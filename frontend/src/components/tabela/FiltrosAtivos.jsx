import { X } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

/** Chips dos filtros de coluna e da ordenação diferente da padrão */
export function FiltrosAtivos({ chips = [], onLimparTudo }) {
  if (!chips.length) return null;
  return (
    <div role="group" aria-label="Filtros ativos" className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <Badge key={chip.id} variant="outline" className="gap-1 bg-white pr-1 font-normal">
          <span className="text-neutral-500">{chip.rotulo}: </span>
          <span className="font-medium text-neutral-800">{chip.descricao}</span>
          <button
            type="button"
            onClick={chip.remover}
            aria-label={`Remover filtro ${chip.rotulo}`}
            className="rounded-xs p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      {chips.length > 1 && (
        <Button variant="ghost" size="sm" onClick={onLimparTudo}>
          Limpar tudo
        </Button>
      )}
    </div>
  );
}
