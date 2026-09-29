import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/cn';

// Toast centralizado, como um mini-diálogo, com título colorido por tipo.
// Substitui todo `alert()` do app.

const Contexto = createContext(null);

const TIPOS = {
  sucesso: { icone: CheckCircle2, cor: 'text-success', borda: 'border-success/30' },
  erro: { icone: XCircle, cor: 'text-danger', borda: 'border-danger/30' },
  aviso: { icone: AlertTriangle, cor: 'text-warning', borda: 'border-warning/30' },
  info: { icone: Info, cor: 'text-info', borda: 'border-info/30' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const contador = useRef(0);

  const remover = useCallback((id) => setToasts((lista) => lista.filter((t) => t.id !== id)), []);

  const notificar = useCallback(
    ({ tipo = 'info', titulo, descricao, duracao = 3500 }) => {
      const id = ++contador.current;
      setToasts((lista) => [...lista, { id, tipo, titulo, descricao, duracao }]);
      return id;
    },
    []
  );

  return (
    <Contexto.Provider value={{ notificar, remover }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-20 z-[70] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onFechar={() => remover(t.id)} />
        ))}
      </div>
    </Contexto.Provider>
  );
}

function Toast({ toast, onFechar }) {
  const { icone: Icone, cor, borda } = TIPOS[toast.tipo] ?? TIPOS.info;
  useEffect(() => {
    if (!toast.duracao) return undefined;
    const timer = setTimeout(onFechar, toast.duracao);
    return () => clearTimeout(timer);
  }, [toast.duracao, onFechar]);

  return (
    <div
      role={toast.tipo === 'erro' ? 'alert' : 'status'}
      aria-live={toast.tipo === 'erro' ? 'assertive' : 'polite'}
      className={cn('pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border bg-white p-4 shadow-lg', borda)}
    >
      <Icone className={cn('mt-0.5 size-5 shrink-0', cor)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-semibold', cor)}>{toast.titulo}</p>
        {toast.descricao && <p className="mt-0.5 text-sm text-neutral-600">{toast.descricao}</p>}
      </div>
      <button
        type="button"
        onClick={onFechar}
        aria-label="Fechar aviso"
        className="-mr-1 -mt-1 rounded-sm p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-secondary/30"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(Contexto);
  if (!ctx) return { notificar: () => {}, remover: () => {} };
  return ctx;
}
