import { useMemo, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { Popover } from '../ui/Popover';
import { MarcaDeCheck } from '../ui/Checkbox';
import { cn } from '../../lib/cn';

/**
 * Seleção múltipla com busca. O trigger resume como "N selecionados"; suporta
 * "selecionar tudo o que está filtrado". Mesma altura (40px) dos outros campos.
 */
export function MultiSelect({ id, label, items, selected = [], onChange, getKey, getLabel, getSubLabel, placeholder = 'Buscar...', vazio = 'Nenhum resultado', maxItens = 200 }) {
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState(false);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const base = q
      ? items.filter((item) => getLabel(item).toLowerCase().includes(q) || (getSubLabel?.(item) || '').toLowerCase().includes(q))
      : items;
    return base.slice(0, maxItens);
  }, [items, busca, getLabel, getSubLabel, maxItens]);

  const temSelecao = selected.length > 0;
  const rotuloTrigger = temSelecao
    ? selected.length === 1
      ? getLabel(items.find((i) => getKey(i) === selected[0]) || {}) || `1 ${label.toLowerCase()}`
      : `${selected.length} ${label.toLowerCase()} selecionados`
    : `Todos`;

  const alternar = (chave) => onChange(selected.includes(chave) ? selected.filter((k) => k !== chave) : [...selected, chave]);
  const todosFiltradosSelecionados = filtrados.length > 0 && filtrados.every((i) => selected.includes(getKey(i)));
  const alternarFiltrados = () => {
    const chaves = filtrados.map(getKey);
    onChange(todosFiltradosSelecionados ? selected.filter((k) => !chaves.includes(k)) : [...new Set([...selected, ...chaves])]);
  };

  return (
    <Popover
      open={aberto}
      onOpenChange={(v) => {
        setAberto(v);
        if (!v) setBusca('');
      }}
      larguraClasse="w-full sm:w-80"
      className="p-0"
      trigger={
        <button
          id={id}
          type="button"
          className={cn(
            'flex h-10 w-full items-center gap-2 rounded-sm border px-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-secondary/20',
            temSelecao ? 'border-secondary/40 bg-secondary/5 font-medium text-secondary' : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
          )}
        >
          <span className="min-w-0 flex-1 truncate">{rotuloTrigger}</span>
          {temSelecao ? (
            <span
              role="button"
              tabIndex={0}
              aria-label={`Limpar ${label.toLowerCase()}`}
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange([]);
                }
              }}
              className="rounded-xs p-0.5 hover:bg-secondary/10"
            >
              <X className="size-3.5" />
            </span>
          ) : (
            <ChevronDown className="size-4 shrink-0 text-neutral-400" aria-hidden />
          )}
        </button>
      }
    >
      <div className="border-b border-neutral-100 p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" aria-hidden />
          <input
            autoFocus
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-9 w-full rounded-sm border border-neutral-200 bg-white pl-8 pr-3 text-sm focus-visible:border-secondary focus-visible:outline-none"
          />
        </div>
      </div>
      <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-1.5 text-xs">
        <span className="text-neutral-500">
          {selected.length} selecionado{selected.length !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-3">
          {filtrados.length > 0 && (
            <button type="button" onClick={alternarFiltrados} className="font-medium text-secondary hover:underline">
              {todosFiltradosSelecionados ? 'Desmarcar filtrados' : busca ? 'Marcar filtrados' : 'Marcar todos'}
            </button>
          )}
          {temSelecao && (
            <button type="button" onClick={() => onChange([])} className="text-neutral-500 hover:underline">
              Limpar
            </button>
          )}
        </div>
      </div>
      <ul className="max-h-64 overflow-y-auto py-1" role="listbox" aria-multiselectable="true" aria-label={label}>
        {filtrados.map((item) => {
          const chave = getKey(item);
          const marcado = selected.includes(chave);
          return (
            <li key={chave} role="option" aria-selected={marcado}>
              <button
                type="button"
                onClick={() => alternar(chave)}
                className={cn('flex w-full items-start gap-3 px-3 py-2 text-left transition-colors hover:bg-secondary/5', marcado && 'bg-secondary/5')}
              >
                <MarcaDeCheck checked={marcado} className="mt-0.5" />
                <span className="min-w-0">
                  <span className="block truncate text-sm text-neutral-800">{getLabel(item)}</span>
                  {getSubLabel && <span className="block truncate text-xs text-neutral-400">{getSubLabel(item)}</span>}
                </span>
              </button>
            </li>
          );
        })}
        {filtrados.length === 0 && <li className="px-4 py-6 text-center text-sm text-neutral-400">{vazio}</li>}
      </ul>
    </Popover>
  );
}
