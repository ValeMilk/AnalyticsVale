import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronRight, Plus, Search } from 'lucide-react';
import { Input } from '../ui/Input';
import { normEan } from '../../config/acoes';
import { cn } from '../../lib/cn';

/**
 * Seletor de produtos para formulários: busca + lista agrupada por subcategoria, com "+ todos"
 * por grupo. Renderiza inline (não em popover) para funcionar dentro do corpo rolável de um diálogo.
 * `selecionados` é uma lista de EANs; o pai decide como exibir os itens escolhidos.
 */
export function SeletorDeProdutos({ produtos = [], selecionados = [], onAdicionar, onAdicionarVarios, rotuloBotao = 'Adicionar produto', unico = false }) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [grupoAberto, setGrupoAberto] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (!aberto) return undefined;
    const aoClicar = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAberto(false);
    };
    document.addEventListener('mousedown', aoClicar);
    return () => document.removeEventListener('mousedown', aoClicar);
  }, [aberto]);

  const grupos = useMemo(() => {
    const mapa = {};
    for (const p of produtos) (mapa[p.subcategoria || 'Outros'] ||= []).push(p);
    return Object.entries(mapa).sort(([a], [b]) => a.localeCompare(b, 'pt-BR'));
  }, [produtos]);

  const gruposFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return grupos;
    return grupos
      .map(([sub, lista]) => [sub, lista.filter((p) => p.produto?.toLowerCase().includes(termo) || normEan(p.ean).includes(termo) || String(p.cod_interno ?? '').includes(termo))])
      .filter(([, lista]) => lista.length > 0);
  }, [grupos, busca]);

  const jaSelecionado = (ean) => selecionados.includes(ean);

  const escolher = (p) => {
    if (jaSelecionado(p.ean)) return;
    onAdicionar(p);
    setBusca('');
    if (unico) setAberto(false);
  };

  return (
    <div ref={ref} className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        className={cn(
          'flex h-11 w-full items-center gap-3 rounded-sm border-2 border-dashed px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-secondary/30',
          aberto ? 'border-secondary text-secondary' : 'border-neutral-200 bg-neutral-50 text-neutral-500 hover:border-secondary hover:text-secondary'
        )}
      >
        <Plus className="size-4" aria-hidden />
        {rotuloBotao}
      </button>

      {aberto && (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-md">
          <div className="border-b border-neutral-100 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" aria-hidden />
              <Input autoFocus value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, código ou EAN..." aria-label="Buscar produto" className="pl-9" />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {gruposFiltrados.length === 0 && <p className="py-6 text-center text-sm text-neutral-400">Nenhum produto encontrado</p>}
            {gruposFiltrados.map(([sub, lista]) => {
              const expandido = grupoAberto === sub || Boolean(busca.trim());
              const faltam = lista.filter((p) => !jaSelecionado(p.ean));
              return (
                <div key={sub}>
                  <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setGrupoAberto((g) => (g === sub ? null : sub))}
                      aria-expanded={expandido}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left text-[11px] font-bold uppercase tracking-wide text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 rounded-xs"
                    >
                      {expandido ? <ChevronDown className="size-3.5 text-neutral-400" aria-hidden /> : <ChevronRight className="size-3.5 text-neutral-400" aria-hidden />}
                      <span className="truncate">{sub}</span>
                      <span className="text-neutral-400">{lista.length}</span>
                    </button>
                    {!unico && onAdicionarVarios && faltam.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onAdicionarVarios(faltam)}
                        className="rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-semibold text-secondary hover:bg-secondary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                      >
                        + todos
                      </button>
                    )}
                  </div>
                  {expandido &&
                    lista.map((p) => {
                      const marcado = jaSelecionado(p.ean);
                      return (
                        <button
                          key={p.ean}
                          type="button"
                          onClick={() => escolher(p)}
                          disabled={marcado}
                          className={cn(
                            'flex w-full items-center justify-between gap-2 border-b border-neutral-50 px-4 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:bg-secondary/5',
                            marcado ? 'cursor-default opacity-40' : 'hover:bg-secondary/5'
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm text-neutral-800">{p.produto}</span>
                            <span className="block text-xs text-neutral-400">Cód. {p.cod_interno || '—'} · EAN {normEan(p.ean)}</span>
                          </span>
                          {marcado ? <Check className="size-4 shrink-0 text-secondary" aria-hidden /> : <Plus className="size-4 shrink-0 text-neutral-300" aria-hidden />}
                        </button>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
