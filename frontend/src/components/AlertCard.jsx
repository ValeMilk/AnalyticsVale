import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

const iconMap = {
  critico: AlertCircle,
  aviso: AlertTriangle,
  info: Info,
};

const colorMap = {
  critico: 'border-red-500/30 bg-red-50',
  aviso: 'border-amber-500/30 bg-amber-50',
  info: 'border-royal/30 bg-royal/5',
};

const badgeMap = {
  critico: 'bg-red-500/10 text-red-600',
  aviso: 'bg-amber-500/10 text-amber-600',
  info: 'bg-royal/10 text-royal',
};

export default function AlertCard({ alerta }) {
  const Icon = iconMap[alerta.tipo] || Info;

  return (
    <div className={`rounded-xl border ${colorMap[alerta.tipo]} p-4 transition-all hover:scale-[1.01]`}>
      <div className="flex items-start gap-3">
        <Icon size={18} className={alerta.tipo === 'critico' ? 'text-red-500 mt-0.5' : alerta.tipo === 'aviso' ? 'text-amber-500 mt-0.5' : 'text-royal mt-0.5'} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-slate-900 truncate">{alerta.titulo}</h4>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${badgeMap[alerta.tipo]}`}>
              {alerta.tipo}
            </span>
          </div>
          <p className="text-xs text-slate-500">{alerta.descricao}</p>
          {alerta.bandeira && (
            <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-600">
              {alerta.bandeira}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
