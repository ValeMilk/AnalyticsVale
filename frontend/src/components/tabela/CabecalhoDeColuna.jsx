import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Filter, HelpCircle, Search } from 'lucide-react';
import { Popover, RodapeDePopover, usePopover } from '../ui/Popover';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { MarcaDeCheck } from '../ui/Checkbox';
import { alinhamentoDaColuna, colunaFiltravel, colunaOrdenavel, filtroVazio } from './colunas';
import { cn } from '../../lib/cn';

function textoDaDirecao(coluna, direcao) {
  if (!direcao) return null;
  if (coluna.tipo === 'numero') return direcao === 'desc' ? 'do maior para o menor' : 'do menor para o maior';
  if (coluna.tipo === 'data') return direcao === 'desc' ? 'da mais recente para a mais antiga' : 'da mais antiga para a mais recente';
  return direcao === 'asc' ? 'de A a Z' : 'de Z a A';
}

// aria-label descreve o estado ATUAL e a AÇÃO do clique por extenso
function rotuloDeOrdenacao(coluna, direcao) {
  const atual = textoDaDirecao(coluna, direcao);
  const proxima = textoDaDirecao(coluna, direcao === null ? (coluna.tipo === 'numero' || coluna.tipo === 'data' ? 'desc' : 'asc') : direcao === 'asc' ? 'desc' : 'asc');
  return atual ? `${coluna.rotulo}, ordenado ${atual}, clique para ordenar ${proxima}` : `${coluna.rotulo}, clique para ordenar ${proxima}`;
}

/** Dispatcher: escolhe cabeçalho + filtro pelo `tipo` da coluna */
export function CabecalhoDeColuna({ coluna, tabela, tom = 'escuro', fixarNaRolagem = false }) {
  const ordenavel = colunaOrdenavel(coluna);
  const direcao = tabela.ordenacaoEfetiva?.colunaId === coluna.id ? tabela.ordenacaoEfetiva.direcao : null;
  const alinhamento = alinhamentoDaColuna(coluna);
  const filtravel = colunaFiltravel(coluna);
  const filtroAtivo = !filtroVazio(tabela.filtros[coluna.id]);
  const escuro = tom === 'escuro';

  return (
    <th
      scope="col"
      aria-sort={direcao ? (direcao === 'asc' ? 'ascending' : 'descending') : undefined}
      className={cn(
        'whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold',
        escuro ? 'bg-secondary text-white' : 'bg-neutral-50 text-neutral-600',
        coluna.larguraClasse,
        alinhamento === 'right' && 'text-right',
        fixarNaRolagem && 'sticky left-0 z-10'
      )}
    >
      <div className={cn('flex items-center gap-1', alinhamento === 'right' && 'justify-end')}>
        {ordenavel ? (
          <button
            type="button"
            onClick={() => tabela.alternarOrdenacao(coluna.id)}
            aria-label={rotuloDeOrdenacao(coluna, direcao)}
            className={cn(
              '-mx-1 flex items-center gap-1 rounded-xs px-1 py-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2',
              escuro ? 'hover:bg-white/15 focus-visible:ring-white/60' : 'hover:bg-neutral-200/60 focus-visible:ring-secondary/40'
            )}
          >
            {coluna.rotulo}
            {direcao === 'desc' ? (
              <ArrowDown className="size-3.5" aria-hidden />
            ) : direcao === 'asc' ? (
              <ArrowUp className="size-3.5" aria-hidden />
            ) : (
              <ArrowUpDown className="size-3.5 opacity-50" aria-hidden />
            )}
          </button>
        ) : (
          <span>{coluna.rotulo}</span>
        )}
        {coluna.ajuda && (
          <span title={coluna.ajuda} className="inline-flex opacity-70">
            <HelpCircle className="size-3.5" aria-hidden />
            <span className="sr-only">{coluna.ajuda}</span>
          </span>
        )}
        {filtravel && <FiltroDeColuna coluna={coluna} tabela={tabela} ativo={filtroAtivo} escuro={escuro} alinhamento={alinhamento} />}
      </div>
    </th>
  );
}

function FiltroDeColuna({ coluna, tabela, ativo, escuro, alinhamento }) {
  return (
    <Popover
      align={alinhamento === 'right' ? 'end' : 'start'}
      larguraClasse="w-64"
      trigger={
        <button
          type="button"
          aria-label={`Filtrar ${coluna.rotulo}${ativo ? ' (filtro ativo)' : ''}`}
          className={cn(
            'rounded-xs p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2',
            escuro ? 'hover:bg-white/15 focus-visible:ring-white/60' : 'hover:bg-neutral-200/60 focus-visible:ring-secondary/40',
            ativo ? 'opacity-100' : 'opacity-50 hover:opacity-100'
          )}
        >
          <Filter className={cn('size-3.5', ativo && 'fill-current')} aria-hidden />
        </button>
      }
    >
      <div className="text-neutral-800">
        {coluna.tipo === 'categoria' ? (
          <FiltroDeCategoria coluna={coluna} tabela={tabela} />
        ) : (
          <FiltroDeFaixa coluna={coluna} tabela={tabela} />
        )}
      </div>
    </Popover>
  );
}

/** Faixa De/Até para número ou data. Só aplica ao confirmar. */
function FiltroDeFaixa({ coluna, tabela }) {
  const { fechar } = usePopover();
  const atual = tabela.filtros[coluna.id] || {};
  const [de, setDe] = useState(atual.de ?? '');
  const [ate, setAte] = useState(atual.ate ?? '');
  const tipoInput = coluna.tipo === 'data' ? 'date' : 'number';

  const aplicar = () => {
    const norm = (v) => (v === '' || v == null ? null : coluna.tipo === 'numero' ? Number(v) : v);
    tabela.definirFiltro(coluna.id, { de: norm(de), ate: norm(ate) });
    fechar();
  };

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-neutral-700">Filtrar {coluna.rotulo}</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${coluna.id}-de`}>De</Label>
          <Input id={`${coluna.id}-de`} type={tipoInput} value={de} onChange={(e) => setDe(e.target.value)} className="h-9" step={tipoInput === 'number' ? 'any' : undefined} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${coluna.id}-ate`}>Até</Label>
          <Input id={`${coluna.id}-ate`} type={tipoInput} value={ate} onChange={(e) => setAte(e.target.value)} className="h-9" step={tipoInput === 'number' ? 'any' : undefined} />
        </div>
      </div>
      <RodapeDePopover
        onLimparClick={() => {
          setDe('');
          setAte('');
          tabela.definirFiltro(coluna.id, null);
          fechar();
        }}
        onAplicarClick={aplicar}
      />
    </div>
  );
}

/** Lista de valores (checkbox); com busca quando há muitas opções. */
function FiltroDeCategoria({ coluna, tabela }) {
  const { fechar } = usePopover();
  const opcoes = tabela.opcoesDeCategoria[coluna.id] || [];
  const comBusca = coluna.comBusca ?? opcoes.length > 10;
  const [busca, setBusca] = useState('');
  const [selecionados, setSelecionados] = useState(() => tabela.filtros[coluna.id]?.valores ?? []);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return q ? opcoes.filter((o) => o.toLowerCase().includes(q)) : opcoes;
  }, [opcoes, busca]);

  const alternar = (v) => setSelecionados((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-neutral-700">Filtrar {coluna.rotulo}</p>
      {comBusca && (
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" aria-hidden />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar valor..." aria-label={`Buscar em ${coluna.rotulo}`} className="h-9 pl-8" autoFocus />
        </div>
      )}
      <ul className="max-h-56 overflow-y-auto" role="group" aria-label={`Valores de ${coluna.rotulo}`}>
        {filtradas.map((op) => {
          const marcado = selecionados.includes(op);
          return (
            <li key={op}>
              <button
                type="button"
                role="checkbox"
                aria-checked={marcado}
                onClick={() => alternar(op)}
                className="flex w-full items-center gap-2 rounded-xs px-1.5 py-1.5 text-left text-sm hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
              >
                <MarcaDeCheck checked={marcado} />
                <span className="truncate">{op}</span>
              </button>
            </li>
          );
        })}
        {filtradas.length === 0 && <li className="px-2 py-4 text-center text-xs text-neutral-400">Nenhum valor</li>}
      </ul>
      <RodapeDePopover
        onLimparClick={() => {
          setSelecionados([]);
          tabela.definirFiltro(coluna.id, null);
          fechar();
        }}
        onAplicarClick={() => {
          tabela.definirFiltro(coluna.id, { valores: selecionados });
          fechar();
        }}
      />
    </div>
  );
}
