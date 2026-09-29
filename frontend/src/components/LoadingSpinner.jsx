export default function LoadingSpinner({ mensagem }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16" role="status" aria-live="polite">
      <div className="size-10 animate-spin rounded-full border-4 border-secondary/20 border-t-secondary" />
      <span className={mensagem ? 'text-sm text-neutral-500' : 'sr-only'}>{mensagem ?? 'Carregando'}</span>
    </div>
  );
}
