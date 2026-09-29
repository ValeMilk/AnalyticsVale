import { Button } from '../ui/Button';
import { cn } from '../../lib/cn';

/**
 * Barra da tela, logo abaixo da TopBar: abas/filtros à esquerda, ações primárias à direita.
 * Empilha em coluna no mobile, vira linha a partir de lg.
 */
export function AppHeader({ filters, actions, actionsSlot, className }) {
  return (
    <div className={cn('flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between', className)}>
      {filters && (
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">{filters}</div>
      )}
      {(actions?.length || actionsSlot) && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:ml-auto lg:justify-end">
          {actions?.map(({ label, icon: Icon, ...resto }) => (
            <Button key={label} variant={resto.variant ?? 'default'} {...resto}>
              {Icon && <Icon className="size-4" aria-hidden />}
              {label}
            </Button>
          ))}
          {actionsSlot}
        </div>
      )}
    </div>
  );
}
