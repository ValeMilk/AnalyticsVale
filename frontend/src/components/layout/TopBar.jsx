import { Link } from 'react-router-dom';
import { Bell, PanelLeft } from 'lucide-react';
import { usePaginaTitulo } from '../../context/PaginaContext';
import { useAuth } from '../../context/AuthContext';
import { iniciais } from '../../lib/formatar';

// Barra fixa no topo: gatilho da sidebar + título da tela atual (registrado pela própria página).
export function TopBar({ onAlternarSidebar }) {
  const pagina = usePaginaTitulo();
  const { user } = useAuth();

  return (
    <nav
      aria-label="Barra superior"
      className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-neutral-400/30 bg-accent/80 px-4 backdrop-blur-sm md:px-6 lg:px-8"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          onClick={onAlternarSidebar}
          aria-label="Abrir ou recolher menu"
          className="-ml-1 shrink-0 rounded-sm p-2 text-neutral-500 hover:bg-white/60 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-secondary/30"
        >
          <PanelLeft className="size-5" />
        </button>
        {pagina && (
          <div className="flex min-w-0 items-baseline gap-2">
            <h1 className="min-w-0 truncate text-base font-medium text-neutral-900">{pagina.titulo}</h1>
            {pagina.subtitulo && <span className="hidden truncate text-sm text-neutral-500 md:inline">{pagina.subtitulo}</span>}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Link
          to="/alertas"
          aria-label="Ver alertas"
          title="Alertas"
          className="rounded-sm p-2 text-neutral-500 hover:bg-white/60 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-secondary/30"
        >
          <Bell className="size-5" />
        </Link>
        {user && (
          <span
            className="ml-1 flex size-9 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary"
            title={`${user.nome} (@${user.username})`}
            aria-label={`Sessão de ${user.nome}`}
          >
            {iniciais(user.nome) || 'U'}
          </span>
        )}
      </div>
    </nav>
  );
}
