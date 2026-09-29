import { Label } from '../ui/Label';
import { cn } from '../../lib/cn';

/** Rótulo sempre visível + campo + mensagem de erro (anunciada ao leitor de tela). */
export function CampoDeFormulario({ rotulo, htmlFor, erro, ajuda, obrigatorio, children, className }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor} className="uppercase tracking-wide">
        {rotulo}
        {obrigatorio && (
          <span className="ml-0.5 text-danger" aria-hidden>
            *
          </span>
        )}
      </Label>
      {children}
      {erro ? (
        <p role="alert" className="text-xs text-danger">
          {erro}
        </p>
      ) : (
        ajuda && <p className="text-xs text-neutral-500">{ajuda}</p>
      )}
    </div>
  );
}

// Classe única de campo dentro de diálogos de formulário
export const CLASSE_CAMPO_DIALOGO = 'bg-neutral-50';
