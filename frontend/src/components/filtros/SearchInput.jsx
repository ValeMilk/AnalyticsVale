import { forwardRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../ui/Input';
import { cn } from '../../lib/cn';

// Busca de listagem: lupa fixa à esquerda; aria-label cai para o placeholder quando não há label visível.
export const SearchInput = forwardRef(function SearchInput({ className, placeholder = 'Buscar...', ...props }, ref) {
  return (
    <div className={cn('relative w-full sm:w-64', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" aria-hidden />
      <Input ref={ref} type="search" placeholder={placeholder} aria-label={props['aria-label'] ?? placeholder} className="pl-9" {...props} />
    </div>
  );
});
