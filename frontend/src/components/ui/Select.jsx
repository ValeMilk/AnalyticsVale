import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';
import { CLASSE_CAMPO } from './Input';

// Select nativo estilizado — para listas curtas e estáticas. Lista longa usa MultiSelect/combobox.
export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(CLASSE_CAMPO, 'appearance-none pr-9', className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" aria-hidden />
    </div>
  );
});
