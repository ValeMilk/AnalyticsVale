import { Loader2 } from 'lucide-react';
import { AlertDialog, DialogTitle, DialogDescription } from '../ui/Dialog';
import { Button } from '../ui/Button';

/**
 * Confirmação de ação destrutiva, genérica. O texto diz duas coisas: o que PARA de acontecer
 * (a parte que dói) e se há caminho de volta (a parte que tranquiliza, quando `reversivel`).
 * Nunca window.confirm().
 */
export function ConfirmarExclusaoDialog({
  open,
  onOpenChange,
  titulo,
  alvo,
  consequencia,
  reversivel = false,
  textoReversivel = 'Nada é apagado: o registro continua no histórico e pode ser reativado depois.',
  textoConfirmar = 'Excluir',
  textoConfirmando = 'Excluindo…',
  onConfirmar,
  confirmando = false,
}) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !confirmando && onOpenChange(v)}>
      <div className="flex flex-col gap-1 px-6 pt-6">
        <DialogTitle>{titulo ?? `${textoConfirmar} ${alvo ?? 'este registro'}?`}</DialogTitle>
        <DialogDescription className="space-y-2">
          {consequencia && <span className="block">{consequencia}</span>}
          <span className="block">{reversivel ? textoReversivel : 'Esta ação não pode ser desfeita.'}</span>
        </DialogDescription>
      </div>
      <div className="flex flex-col-reverse gap-2 px-6 py-5 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={confirmando}>
          Cancelar
        </Button>
        <Button variant="destructive" onClick={onConfirmar} disabled={confirmando} autoFocus>
          {confirmando && <Loader2 className="animate-spin" aria-hidden />}
          {confirmando ? textoConfirmando : textoConfirmar}
        </Button>
      </div>
    </AlertDialog>
  );
}
