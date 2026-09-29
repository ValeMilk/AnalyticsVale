import { cn } from '../../lib/cn';

export function Switch({ checked, onCheckedChange, disabled, className, ...props }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-secondary/30 disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-secondary' : 'bg-neutral-300',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'pointer-events-none block size-5 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0'
        )}
      />
    </button>
  );
}
