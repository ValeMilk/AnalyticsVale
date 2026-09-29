import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { NavInferior } from './NavInferior';
import { Sheet } from '../ui/Dialog';
import { usePaginaTitulo } from '../../context/PaginaContext';

// Casca de celular: cabeçalho fino + conteúdo + barra inferior fixa.
// Reaproveita a MESMA sidebar do desktop dentro de um Sheet — nenhuma navegação paralela.
export function CelularShell({ children }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const pagina = usePaginaTitulo();
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-20 flex min-h-12 items-center justify-between gap-2 border-b border-neutral-200 bg-background/95 px-4 py-2 backdrop-blur-sm">
        <h1 className="min-w-0 truncate text-base font-medium text-neutral-900">{pagina?.titulo ?? 'IA Cometa'}</h1>
      </header>

      <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-4">{children}</main>

      <NavInferior onAbrirMenu={() => setMenuAberto(true)} />

      <Sheet open={menuAberto} onOpenChange={setMenuAberto} rotulo="Menu principal" key={pathname}>
        <Sidebar modoSheet aoNavegar={() => setMenuAberto(false)} />
      </Sheet>
    </div>
  );
}
