import { ArrowDown, ArrowUp, Columns3 } from 'lucide-react';
import { Popover } from '../ui/Popover';
import { Button } from '../ui/Button';
import { MarcaDeCheck } from '../ui/Checkbox';

/**
 * Mostrar / ocultar / reordenar colunas. É um popover (não um menu: menu fecharia a cada clique).
 * Reordenação por botões ↑↓ acessíveis por teclado — sem dependência de drag and drop.
 */
export function GerenciadorDeColunas({ colunas, ocultas, alternar, reordenar, restaurar, size = 'default' }) {
  const mover = (indice, delta) => {
    const ids = colunas.map((c) => c.id);
    const alvo = indice + delta;
    if (alvo < 0 || alvo >= ids.length) return;
    [ids[indice], ids[alvo]] = [ids[alvo], ids[indice]];
    reordenar(ids);
  };

  return (
    <Popover
      align="end"
      larguraClasse="w-72"
      className="p-0"
      trigger={
        <Button variant="outline" size={size} aria-label="Gerenciar colunas">
          <Columns3 aria-hidden />
          <span className="hidden sm:inline">Colunas</span>
        </Button>
      }
    >
      <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2">
        <span className="text-xs font-semibold text-neutral-700">Colunas</span>
        <button type="button" onClick={restaurar} className="text-xs font-medium text-secondary hover:underline">
          Restaurar padrão
        </button>
      </div>
      <ul className="max-h-72 overflow-y-auto p-1">
        {colunas.map((c, i) => {
          const visivel = !ocultas.has(c.id);
          return (
            <li key={c.id} className="flex items-center gap-1 rounded-xs px-1 py-0.5 hover:bg-neutral-50">
              <button
                type="button"
                role="checkbox"
                aria-checked={visivel}
                onClick={() => alternar(c.id)}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-xs px-1 py-1.5 text-left text-sm text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
              >
                <MarcaDeCheck checked={visivel} />
                <span className="truncate">{c.rotulo}</span>
              </button>
              <button
                type="button"
                onClick={() => mover(i, -1)}
                disabled={i === 0}
                aria-label={`Mover ${c.rotulo} para cima`}
                className="rounded-xs p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
              >
                <ArrowUp className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => mover(i, 1)}
                disabled={i === colunas.length - 1}
                aria-label={`Mover ${c.rotulo} para baixo`}
                className="rounded-xs p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
              >
                <ArrowDown className="size-3.5" />
              </button>
            </li>
          );
        })}
      </ul>
      <p className="border-t border-neutral-100 px-3 py-2 text-[11px] text-neutral-400">As preferências de coluna não são guardadas entre visitas.</p>
    </Popover>
  );
}
