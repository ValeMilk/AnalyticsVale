import { NavLink } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { itensDaNavInferior } from '../../config/menu';
import { cn } from '../../lib/cn';

// Barra inferior fixa (celular): no máximo 4 destinos + "Menu", que abre a MESMA sidebar como Sheet.
export function NavInferior({ onAbrirMenu }) {
  const { user } = useAuth();
  const itens = itensDaNavInferior(user);

  return (
    <nav
      aria-label="Navegação principal"
      className="sticky bottom-0 z-30 flex border-t border-neutral-200 bg-background pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_8px_rgba(16,24,40,.06)]"
    >
      {itens.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          end={item.href === '/'}
          className="relative flex min-h-14 flex-1 flex-col items-center justify-center px-1 focus-visible:outline-none"
        >
          {({ isActive }) => (
            <span
              className={cn(
                'flex flex-col items-center gap-1 rounded-2xl px-2 py-1 text-[11px] font-medium',
                isActive ? 'bg-secondary/10 text-secondary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="size-6" aria-hidden />
              {item.tituloCurto ?? item.titulo}
            </span>
          )}
        </NavLink>
      ))}
      <button
        type="button"
        onClick={onAbrirMenu}
        className="flex min-h-14 flex-1 flex-col items-center justify-center px-1 focus-visible:outline-none"
        aria-label="Abrir menu completo"
      >
        <span className="flex flex-col items-center gap-1 rounded-2xl px-2 py-1 text-[11px] font-medium text-muted-foreground">
          <Menu className="size-6" aria-hidden />
          Menu
        </span>
      </button>
    </nav>
  );
}
