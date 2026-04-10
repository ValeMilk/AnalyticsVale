import { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown, X, Search } from 'lucide-react';

// Componente reutilizável de dropdown multi-select
function MultiSelectDropdown({ label, items, selected, onToggle, onClear, getKey, getLabel, getSubLabel, placeholder }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = items.filter(item => {
    const q = search.toLowerCase();
    return getLabel(item).toLowerCase().includes(q) || (getSubLabel?.(item) || '').toLowerCase().includes(q);
  }).slice(0, 100);

  const hasSelection = selected.length > 0;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSearch(''); }}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-all text-left ${
          hasSelection && selected.length === 1
            ? 'bg-royal/10 text-royal border-royal/20 font-medium min-w-[200px]'
            : hasSelection
            ? 'bg-royal/10 text-royal border-royal/20 font-medium min-w-[200px] max-w-[280px]'
            : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-900 min-w-[200px] max-w-[280px]'
        }`}
      >
        <span className={hasSelection && selected.length === 1 ? 'flex-1' : 'flex-1 truncate'}>
          {hasSelection
            ? selected.length === 1
              ? getLabel(items.find(i => getKey(i) === selected[0]) || {})
              : `${selected.length} ${label.toLowerCase()} selecionadas`
            : `Todas as ${label.toLowerCase()}`}
        </span>
        {hasSelection
          ? <X size={14} className="shrink-0" onClick={(e) => { e.stopPropagation(); onClear(); }} />
          : <ChevronDown size={14} className="shrink-0" />
        }
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder={placeholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-royal"
              />
            </div>
          </div>
          {hasSelection && (
            <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs text-royal font-medium">{selected.length} selecionada{selected.length > 1 ? 's' : ''}</span>
              <button onClick={onClear} className="text-xs text-slate-400 hover:text-slate-700 underline">Limpar</button>
            </div>
          )}
          <ul className="max-h-60 overflow-y-auto">
            {filtered.map((item) => {
              const key = getKey(item);
              const isSelected = selected.includes(key);
              return (
                <li key={key}>
                  <button
                    className={`w-full text-left px-4 py-2.5 hover:bg-royal/5 transition-colors flex items-start gap-3 ${isSelected ? 'bg-royal/8' : ''}`}
                    onClick={() => onToggle(key)}
                  >
                    <span className={`mt-0.5 w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-royal border-royal' : 'border-slate-300'
                    }`}>
                      {isSelected && <svg width="8" height="8" viewBox="0 0 8 8"><polyline points="1,4 3,6 7,2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                    </span>
                    <span>
                      <div className="text-sm text-slate-800 truncate">{getLabel(item)}</div>
                      {getSubLabel && <div className="text-xs text-slate-400 mt-0.5">{getSubLabel(item)}</div>}
                    </span>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-4 py-4 text-sm text-slate-400 text-center">Nenhum resultado</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function Filters({ filters, onChange, produtos = [], lojas = [] }) {
  const hoje = new Date().toISOString().slice(0, 10);

  const update = (key, value) => onChange({ ...filters, [key]: value });

  const toggleEan = (ean) => {
    const atual = filters.eans || [];
    const novo = atual.includes(ean) ? atual.filter(e => e !== ean) : [...atual, ean];
    update('eans', novo);
  };

  const toggleLoja = (lojaId) => {
    const atual = filters.loja_ids || [];
    const novo = atual.includes(lojaId) ? atual.filter(l => l !== lojaId) : [...atual, lojaId];
    update('loja_ids', novo);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Filter size={16} className="text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-600">Filtros</h3>
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        {/* Período */}
        <div className="flex gap-2 items-center">
          <label className="text-xs text-slate-500">De:</label>
          <input
            type="date"
            value={filters.data_inicio || ''}
            max={hoje}
            onChange={(e) => update('data_inicio', e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-royal"
          />
          <label className="text-xs text-slate-500">Até:</label>
          <input
            type="date"
            value={filters.data_fim || ''}
            max={hoje}
            onChange={(e) => update('data_fim', e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-royal"
          />
        </div>

        {/* Vendor */}
        <div className="flex gap-2">
          {['ambos', 'valemilk', 'valefish'].map((v) => (
            <button
              key={v}
              onClick={() => update('vendor', v)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filters.vendor === v
                  ? 'bg-royal/10 text-royal border border-royal/20'
                  : 'bg-slate-50 text-slate-500 border border-slate-200 hover:text-slate-900'
              }`}
            >
              {v === 'ambos' ? 'Todas' : v === 'valemilk' ? 'Valemilk' : 'Valefish'}
            </button>
          ))}
        </div>

        {/* Produtos multi-select */}
        <MultiSelectDropdown
          label="Produtos"
          items={produtos}
          selected={filters.eans || []}
          onToggle={toggleEan}
          onClear={() => update('eans', [])}
          getKey={(p) => p.ean}
          getLabel={(p) => p.produto || ''}
          getSubLabel={(p) => [p.cod_interno && `Cód. ${p.cod_interno}`, p.ean && `EAN ${p.ean}`].filter(Boolean).join(' · ')}
          placeholder="Buscar por nome ou código..."
        />

        {/* Lojas multi-select */}
        <MultiSelectDropdown
          label="Lojas"
          items={lojas}
          selected={filters.loja_ids || []}
          onToggle={toggleLoja}
          onClear={() => update('loja_ids', [])}
          getKey={(l) => l.loja_id}
          getLabel={(l) => l.nome_loja || l.loja_id}
          getSubLabel={(l) => `ID ${l.loja_id}`}
          placeholder="Buscar por nome da loja..."
        />
      </div>

      {/* Tags dos produtos selecionados */}
      {(filters.eans?.length > 0 || filters.loja_ids?.length > 0) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
          {(filters.eans || []).map(ean => {
            const p = produtos.find(x => x.ean === ean);
            if (!p) return null;
            return (
              <span key={ean} className="inline-flex items-center gap-1.5 bg-royal/10 text-royal text-xs font-medium px-3 py-1.5 rounded-full border border-royal/20">
                <span>{p.produto}</span>
                {p.cod_interno && <span className="text-royal/60">· {p.cod_interno}</span>}
                <button onClick={() => toggleEan(ean)} className="ml-0.5 hover:text-royal/60 transition-colors">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                    <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </span>
            );
          })}
          {(filters.loja_ids || []).map(lojaId => {
            const l = lojas.find(x => x.loja_id === lojaId);
            const nome = l?.nome_loja || lojaId;
            return (
              <span key={lojaId} className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200">
                <span>{nome}</span>
                <button onClick={() => toggleLoja(lojaId)} className="ml-0.5 hover:text-slate-400 transition-colors">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                    <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
