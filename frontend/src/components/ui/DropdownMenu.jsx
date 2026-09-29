import { Popover, usePopover } from './Popover';
import { cn } from '../../lib/cn';

/** Menu de ações (linha de tabela, cabeçalho). Cada item fecha o menu ao ser acionado. */
export function DropdownMenu({ trigger, children, align = 'end', className }) {
  return (
    <Popover trigger={trigger} align={align} larguraClasse="min-w-[10rem] w-auto" className={cn('p-1', className)}>
      <div role="menu" className="flex flex-col">
        {children}
      </div>
    </Popover>
  );
}

export function DropdownMenuItem({ onSelect, variant = 'default', disabled, className, children, ...props }) {
  const { fechar } = usePopover();
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={(e) => {
        onSelect?.(e);
        fechar();
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-accent focus-visible:bg-accent disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4",
        variant === 'destructive' ? 'text-danger hover:bg-danger/10 [&_svg]:text-danger' : 'text-neutral-700',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator() {
  return <div role="separator" className="my-1 h-px bg-neutral-100" />;
}

export function DropdownMenuLabel({ children }) {
  return <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{children}</div>;
}
