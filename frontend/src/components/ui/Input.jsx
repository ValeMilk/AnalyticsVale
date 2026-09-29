import { forwardRef } from 'react';
import { cn } from '../../lib/cn';

// Campo de 40px (h-10), mesma altura de Button/Select — uma régua só na linha de filtros.
export const CLASSE_CAMPO =
  'h-10 w-full rounded-sm border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors hover:bg-neutral-50 focus-visible:border-secondary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-secondary/20 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/20';

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(CLASSE_CAMPO, className)} {...props} />;
});

export const Textarea = forwardRef(function Textarea({ className, rows = 3, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(CLASSE_CAMPO, 'h-auto resize-none py-2', className)}
      {...props}
    />
  );
});
