import { createContext, useContext, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useVisao } from '../../context/VisaoContext';

const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Base de todo diálogo: overlay + painel, foco inicial, devolução do foco ao fechar,
 * trava de rolagem do body, Esc. `fecharAoClicarFora` distingue Dialog (sim) de AlertDialog (não).
 * Posição: 'centro' (padrão), 'baixo' (bottom sheet) ou 'esquerda' (painel lateral).
 */
export function ModalBase({ open, onOpenChange, role = 'dialog', fecharAoClicarFora = true, posicao = 'centro', className, children, labelledBy, describedBy }) {
  const painelRef = useRef(null);
  const focoAnterior = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    focoAnterior.current = document.activeElement;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const painel = painelRef.current;
    const alvo = painel?.querySelector('[autofocus]') || painel?.querySelector(FOCAVEIS);
    (alvo || painel)?.focus?.({ preventScroll: true });

    const aoTeclar = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onOpenChange?.(false);
      }
      if (e.key === 'Tab' && painel) {
        const focaveis = [...painel.querySelectorAll(FOCAVEIS)];
        if (!focaveis.length) return;
        const primeiro = focaveis[0];
        const ultimo = focaveis[focaveis.length - 1];
        if (e.shiftKey && document.activeElement === primeiro) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primeiro.focus();
        }
      }
    };
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = overflowAnterior;
      focoAnterior.current?.focus?.({ preventScroll: true });
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const alinhamento = {
    centro: 'items-center justify-center p-4',
    baixo: 'items-end justify-center p-0',
    esquerda: 'items-stretch justify-start p-0',
  }[posicao];

  const formaDoPainel = {
    centro: 'w-full rounded-xl',
    baixo: 'w-full rounded-t-xl',
    esquerda: 'h-full w-[85vw] max-w-xs rounded-none',
  }[posicao];

  return (
    <div
      className={cn('fixed inset-0 z-50 flex bg-black/50', alinhamento)}
      onMouseDown={(e) => {
        if (fecharAoClicarFora && e.target === e.currentTarget) onOpenChange?.(false);
      }}
    >
      <div
        ref={painelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={cn('relative flex max-h-[90dvh] flex-col bg-white shadow-lg outline-none', formaDoPainel, className)}
      >
        {children}
      </div>
    </div>
  );
}

/** Diálogo comum (formulário, conteúdo): fecha ao clicar fora ou Esc. No celular vira bottom sheet. */
export function Dialog({ open, onOpenChange, children, className, tamanho = 'md' }) {
  const visao = useVisao();
  const id = useId();
  const largura = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' }[tamanho];
  return (
    <ModalBase
      open={open}
      onOpenChange={onOpenChange}
      posicao={visao === 'celular' ? 'baixo' : 'centro'}
      labelledBy={`${id}-titulo`}
      describedBy={`${id}-descricao`}
      className={cn(visao === 'celular' ? 'pb-[env(safe-area-inset-bottom)]' : largura, className)}
    >
      <DialogIds.Provider value={id}>{children}</DialogIds.Provider>
    </ModalBase>
  );
}

const DialogIds = createContext('');

export function DialogHeader({ children, onClose, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 border-b border-neutral-100 px-6 py-4', className)}>
      <div className="flex min-w-0 flex-col gap-1">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="-mr-2 -mt-1 rounded-sm p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-secondary/30"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

export function DialogTitle({ children, className }) {
  const id = useContext(DialogIds);
  return (
    <h2 id={`${id}-titulo`} className={cn('text-base font-semibold text-neutral-900', className)}>
      {children}
    </h2>
  );
}

export function DialogDescription({ children, className, srOnly = false }) {
  const id = useContext(DialogIds);
  return (
    <p id={`${id}-descricao`} className={cn(srOnly ? 'sr-only' : 'text-sm text-neutral-500', className)}>
      {children}
    </p>
  );
}

export function DialogBody({ children, className }) {
  return <div className={cn('flex-1 overflow-y-auto px-6 py-5', className)}>{children}</div>;
}

/** Rodapé: Cancelar (outline) à esquerda, ação principal (secondary) à direita */
export function DialogFooter({ children, className }) {
  return (
    <div className={cn('flex flex-col-reverse gap-2 border-t border-neutral-100 px-6 py-4 sm:flex-row sm:justify-end', className)}>
      {children}
    </div>
  );
}

/** Confirmação de decisão: NÃO fecha ao clicar fora, força Cancelar ou Confirmar. */
export function AlertDialog({ open, onOpenChange, children, className }) {
  const id = useId();
  return (
    <ModalBase
      open={open}
      onOpenChange={onOpenChange}
      role="alertdialog"
      fecharAoClicarFora={false}
      labelledBy={`${id}-titulo`}
      describedBy={`${id}-descricao`}
      className={cn('sm:max-w-md', className)}
    >
      <DialogIds.Provider value={id}>{children}</DialogIds.Provider>
    </ModalBase>
  );
}

/** Painel lateral off-canvas (menu mobile, detalhe de registro) */
export function Sheet({ open, onOpenChange, children, className, rotulo = 'Painel' }) {
  const id = useId();
  return (
    <ModalBase
      open={open}
      onOpenChange={onOpenChange}
      posicao="esquerda"
      labelledBy={`${id}-titulo`}
      className={className}
    >
      <span id={`${id}-titulo`} className="sr-only">
        {rotulo}
      </span>
      {children}
    </ModalBase>
  );
}
