import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { buttonVariants } from './ui/Button';

// Mantém a moldura normal da página (mesma superfície, mesmo título na TopBar) —
// nunca uma página em branco ou um redirecionamento silencioso.
export function RestrictedAccess({ title, area = 'esta área' }) {
  return (
    <div className="superficie mx-auto flex max-w-lg flex-col items-center gap-4 p-8 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-warning/10 text-warning">
        <Lock className="size-6" aria-hidden />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-neutral-900">Acesso restrito{title ? ` · ${title}` : ''}</h2>
        <p className="text-sm text-neutral-500">
          Você não tem permissão para acessar {area}. Se precisar deste acesso, fale com um administrador.
        </p>
      </div>
      <Link to="/" className={buttonVariants({ variant: 'outline' })}>
        Voltar ao início
      </Link>
    </div>
  );
}
