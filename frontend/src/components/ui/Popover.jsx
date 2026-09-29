import { cloneElement, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/cn';

const Contexto = createContext({ fechar: () => {} });
export const usePopover = () => useContext(Contexto);

/**
 * Popover genérico: o `trigger` recebe onClick/aria-expanded; o conteúdo abre abaixo, alinhado
 * à esquerda ou à direita. Fecha com Esc ou clique fora. Controlado (open/onOpenChange) ou não.
 * Não carrega visual de "campo de formulário": só os comboboxes de fato o fazem.
 */
export function Popover({ trigger, children, align = 'start', open, onOpenChange, className, larguraClasse = 'w-72' }) {
  const [interno, setInterno] = useState(false);
  const controlado = open !== undefined;
  const aberto = controlado ? open : interno;
  const ref = useRef(null);

  const definir = useCallback(
    (valor) => {
      if (!controlado) setInterno(valor);
      onOpenChange?.(valor);
    },
    [controlado, onOpenChange]
  );
  const fechar = useCallback(() => definir(false), [definir]);

  useEffect(() => {
    if (!aberto) return undefined;
    const aoClicar = (e) => {
      if (ref.current && !ref.current.contains(e.target)) fechar();
    };
    const aoTeclar = (e) => {
      if (e.key === 'Escape') fechar();
    };
    document.addEventListener('mousedown', aoClicar);
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('mousedown', aoClicar);
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [aberto, fechar]);

  return (
    <Contexto.Provider value={{ fechar }}>
      <div ref={ref} className="relative inline-block max-w-full">
        {cloneElement(trigger, {
          onClick: (e) => {
            trigger.props.onClick?.(e);
            definir(!aberto);
          },
          'aria-expanded': aberto,
          'aria-haspopup': 'dialog',
        })}
        {aberto && (
          <div
            role="dialog"
            className={cn(
              'absolute z-40 mt-1 max-w-[calc(100vw-2rem)] rounded-lg border border-neutral-200 bg-white p-3 shadow-lg',
              align === 'end' ? 'right-0' : 'left-0',
              larguraClasse,
              className
            )}
          >
            {children}
          </div>
        )}
      </div>
    </Contexto.Provider>
  );
}

/** Rodapé padrão de filtro em popover: Limpar (texto) + Aplicar (preenchido) */
export function RodapeDePopover({ onLimparClick, onAplicarClick, aplicarDesabilitado = false }) {
  return (
    <div className="mt-3 flex items-center justify-between gap-2 border-t border-neutral-100 pt-3">
      <button
        type="button"
        onClick={onLimparClick}
        className="text-xs font-medium text-secondary hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-secondary/30 rounded-xs"
      >
        Limpar
      </button>
      <button
        type="button"
        onClick={onAplicarClick}
        disabled={aplicarDesabilitado}
        className="h-8 rounded-sm bg-secondary px-3 text-xs font-medium text-white hover:bg-secondary/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-secondary/30"
      >
        Aplicar
      </button>
    </div>
  );
}
