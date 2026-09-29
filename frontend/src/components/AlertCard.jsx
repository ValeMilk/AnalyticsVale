import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Badge } from './ui/Badge';
import { cn } from '../lib/cn';

const CONFIG = {
  critico: { icone: AlertCircle, cor: 'text-danger', borda: 'border-l-danger', badge: 'perigo', rotulo: 'Crítico' },
  aviso: { icone: AlertTriangle, cor: 'text-warning', borda: 'border-l-warning', badge: 'alerta', rotulo: 'Aviso' },
  info: { icone: Info, cor: 'text-info', borda: 'border-l-info', badge: 'info', rotulo: 'Info' },
};

export default function AlertCard({ alerta }) {
  const c = CONFIG[alerta.tipo] ?? CONFIG.info;
  const Icone = c.icone;
  return (
    <div className={cn('superficie flex items-start gap-3 border-l-4 p-4', c.borda)}>
      <Icone className={cn('mt-0.5 size-5 shrink-0', c.cor)} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-semibold text-neutral-900">{alerta.titulo}</h4>
          <Badge variant={c.badge}>{c.rotulo}</Badge>
        </div>
        <p className="mt-1 text-sm text-neutral-600">{alerta.descricao}</p>
        {alerta.bandeira && (
          <Badge variant="neutro" className="mt-2">
            {alerta.bandeira}
          </Badge>
        )}
      </div>
    </div>
  );
}
