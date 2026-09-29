import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { usePreferenciaLocal } from '../../lib/usePreferenciaLocal';
import { cn } from '../../lib/cn';

// Casca de escritório: sidebar fixa + barra superior + conteúdo (largura máxima) + rodapé.
// Só monta o esqueleto visual; quem decide quem pode entrar é quem chama a casca.
export function EscritorioShell({ children }) {
  const [colapsada, setColapsada] = usePreferenciaLocal('sidebar:colapsada', false);
  const alternar = () => setColapsada((c) => !c);

  return (
    <div className="flex min-h-screen">
      <Sidebar colapsada={colapsada} onAlternar={alternar} />
      <div
        className={cn(
          'app-bg flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-slow',
          colapsada ? 'ml-16' : 'ml-64'
        )}
      >
        <TopBar onAlternarSidebar={alternar} />
        <main className="min-w-0 flex-1 px-4 py-6 pb-16 md:px-6 lg:px-8">
          <div className="mx-auto max-w-conteudo">{children}</div>
        </main>
        <footer className="border-t border-white/30 px-4 py-6 text-center text-xs text-neutral-600 md:px-6 lg:px-8">
          IA Cometa · Vale Milk © {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
