import { Check } from 'lucide-react';
import { cn } from '../../lib/cn';

/** Só a marca visual, para usar DENTRO de um botão/opção que já é interativo (evita botão aninhado). */
export function MarcaDeCheck({ checked, className }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded-xs border transition-colors',
        checked ? 'border-secondary bg-secondary text-white' : 'border-neutral-300 bg-white',
        className
      )}
    >
      {checked && <Check className="size-3" strokeWidth={3} />}
    </span>
  );
}

export function Checkbox({ checked, onCheckedChange, disabled, className, ...props }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded-xs border transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-secondary/30 disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'border-secondary bg-secondary text-white' : 'border-neutral-300 bg-white',
        className
      )}
      {...props}
    >
      {checked && <Check className="size-3" strokeWidth={3} aria-hidden />}
    </button>
  );
}
