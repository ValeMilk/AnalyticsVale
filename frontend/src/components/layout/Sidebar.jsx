import { Link, NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut, PanelLeftClose, PanelLeftOpen, Smartphone, Monitor } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { trocarVisao, visaoForcada } from '../../context/VisaoContext';
import { gruposDoMenu, primeiraRota, rotaAtiva, itensVisiveis } from '../../config/menu';
import { usePreferenciaLocal } from '../../lib/usePreferenciaLocal';
import { iniciais } from '../../lib/formatar';
import { cn } from '../../lib/cn';

const CLASSE_BASE = 'text-sidebar-foreground hover:bg-secondary/10 hover:text-primary';
const CLASSE_ATIVA = 'bg-secondary text-white hover:bg-secondary/90 hover:text-white [&>svg]:text-white';

function ItemDeMenu({ item, colapsado, aoNavegar }) {
  return (
    <NavLink
      to={item.href}
      end={item.href === '/'}
      title={colapsado ? item.titulo : undefined}
      onClick={aoNavegar}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-secondary/30',
          colapsado && 'justify-center px-0',
          isActive ? CLASSE_ATIVA : CLASSE_BASE
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon className="size-5 shrink-0" aria-hidden />
          {!colapsado && <span className="truncate">{item.titulo}</span>}
          {isActive && <span className="sr-only">(página atual)</span>}
        </>
      )}
    </NavLink>
  );
}

function GrupoDaSidebar({ grupo, aoNavegar }) {
  const { pathname } = useLocation();
  const contemAtual = grupo.itens.some((i) => rotaAtiva(i.href, pathname));
  // Preferência por grupo: true aberto, false fechado, null = "ainda não opinou" → abre se contém a rota atual
  const [pref, setPref] = usePreferenciaLocal(`sidebar:grupo:${grupo.nome}`, null);
  const aberto = pref ?? contemAtual;

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setPref(!aberto)}
        aria-expanded={aberto}
        className="flex w-full items-center justify-between rounded-xs px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-secondary/30"
      >
        {grupo.nome}
        <ChevronDown className={cn('size-3.5 transition-transform', aberto && 'rotate-180')} aria-hidden />
      </button>
      {aberto && (
        <div className="mt-0.5 flex flex-col gap-0.5">
          {grupo.itens.map((item) => (
            <ItemDeMenu key={item.href} item={item} colapsado={false} aoNavegar={aoNavegar} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * A MESMA sidebar serve ao desktop (fixa, colapsável para ícones) e ao celular (dentro de um Sheet).
 * Em modo ícone, os grupos viram uma lista plana com tooltip — um grupo colapsável sem rótulo
 * seria um gatilho sem serventia.
 */
export function Sidebar({ colapsada = false, onAlternar, modoSheet = false, aoNavegar }) {
  const { user, logout } = useAuth();
  const grupos = gruposDoMenu(user);
  const plano = colapsada && !modoSheet;
  const forcada = visaoForcada();

  return (
    <aside
      aria-label="Menu principal"
      className={cn(
        'flex flex-col bg-sidebar text-sidebar-foreground',
        modoSheet
          ? 'h-full w-full'
          : cn('fixed left-0 top-0 z-30 h-screen border-r border-sidebar-border transition-[width] duration-slow', colapsada ? 'w-16' : 'w-64')
      )}
    >
      {/* Cabeçalho: logo → primeira rota que a pessoa pode abrir */}
      <div className={cn('flex h-16 items-center gap-3 border-b border-sidebar-border px-3', plano && 'justify-center px-0')}>
        <Link
          to={primeiraRota(user)}
          onClick={aoNavegar}
          className="flex min-w-0 items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-secondary/30"
          aria-label="IA Cometa — ir para a página inicial"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-base font-bold text-white">C</span>
          {!plano && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-neutral-900">IA Cometa</span>
              <span className="block truncate text-xs text-neutral-500">Painel de Gestão</span>
            </span>
          )}
        </Link>
        {!modoSheet && !colapsada && (
          <button
            type="button"
            onClick={onAlternar}
            aria-label="Recolher menu"
            title="Recolher menu"
            className="ml-auto rounded-sm p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-secondary/30"
          >
            <PanelLeftClose className="size-4" />
          </button>
        )}
      </div>

      {/* Navegação */}
      <nav className={cn('flex-1 overflow-y-auto py-3', plano ? 'px-2' : 'px-2')}>
        {plano ? (
          <div className="flex flex-col gap-1">
            {itensVisiveis(user).map((item) => (
              <ItemDeMenu key={item.href} item={item} colapsado aoNavegar={aoNavegar} />
            ))}
          </div>
        ) : (
          grupos.map((grupo) => <GrupoDaSidebar key={grupo.nome} grupo={grupo} aoNavegar={aoNavegar} />)
        )}
      </nav>

      {/* Rodapé: pessoa + ações rápidas */}
      <div className={cn('flex flex-col gap-1 border-t border-sidebar-border p-2', plano && 'items-center')}>
        {!plano && user && (
          <div className="mb-1 flex items-center gap-3 rounded-sm px-2 py-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary" aria-hidden>
              {iniciais(user.nome) || 'U'}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-neutral-800">{user.nome}</span>
              <span className="block truncate text-xs text-neutral-500">@{user.username}</span>
            </span>
          </div>
        )}
        {plano && user && (
          <span
            className="mb-1 flex size-9 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary"
            title={`${user.nome} (@${user.username})`}
          >
            {iniciais(user.nome) || 'U'}
          </span>
        )}

        <BotaoDoRodape
          icone={modoSheet ? Monitor : Smartphone}
          rotulo={modoSheet ? 'Ver como computador' : 'Ver como celular'}
          descricao={forcada ? 'Escolha manual ativa' : undefined}
          colapsado={plano}
          onClick={() => trocarVisao(modoSheet ? 'computador' : 'celular')}
        />
        <BotaoDoRodape icone={LogOut} rotulo="Sair" colapsado={plano} onClick={logout} />

        {!modoSheet && colapsada && (
          <button
            type="button"
            onClick={onAlternar}
            aria-label="Expandir menu"
            title="Expandir menu"
            className="mt-1 rounded-sm p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-secondary/30"
          >
            <PanelLeftOpen className="size-4" />
          </button>
        )}
      </div>
    </aside>
  );
}

function BotaoDoRodape({ icone: Icone, rotulo, descricao, colapsado, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={colapsado ? rotulo : descricao}
      aria-label={colapsado ? rotulo : undefined}
      className={cn(
        'flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-secondary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-secondary/30',
        colapsado && 'w-auto justify-center px-2'
      )}
    >
      <Icone className="size-4 shrink-0" aria-hidden />
      {!colapsado && (
        <span className="min-w-0 text-left">
          <span className="block truncate">{rotulo}</span>
          {descricao && <span className="block truncate text-[11px] text-neutral-400">{descricao}</span>}
        </span>
      )}
    </button>
  );
}
