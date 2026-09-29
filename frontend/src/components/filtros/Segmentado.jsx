import { cn } from '../../lib/cn';

/** Grupo de opções mutuamente exclusivas (bandeira, tipo). Semântica de radiogroup. */
export function Segmentado({ opcoes, valor, onChange, rotulo, className, tamanho = 'default' }) {
  return (
    <div role="radiogroup" aria-label={rotulo} className={cn('flex flex-wrap gap-1 rounded-sm bg-neutral-100 p-1', className)}>
      {opcoes.map((op) => {
        const ativo = op.value === valor;
        return (
          <button
            key={op.value}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => onChange(op.value)}
            className={cn(
              'flex-1 whitespace-nowrap rounded-xs px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-secondary/30',
              tamanho === 'sm' ? 'h-7' : 'h-8',
              ativo ? 'bg-white text-secondary shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            )}
          >
            {op.label}
          </button>
        );
      })}
    </div>
  );
}

export const OPCOES_BANDEIRA = [
  { value: 'ambos', label: 'Todas' },
  { value: 'valemilk', label: 'Valemilk' },
  { value: 'valefish', label: 'Valefish' },
];

export const ROTULO_BANDEIRA = { ambos: 'Todas', valemilk: 'Valemilk', valefish: 'Valefish' };
