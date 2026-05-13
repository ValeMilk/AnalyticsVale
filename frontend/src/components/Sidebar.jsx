import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Bell, Tag, BarChart3, ChevronLeft, ChevronRight, Newspaper, Store } from 'lucide-react';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/acoes-analise', label: 'Análise Eficácia', icon: BarChart3 },
  { to: '/vendas', label: 'Vendas', icon: ShoppingCart },
  { to: '/alertas', label: 'Alertas', icon: Bell },
  { to: '/acoes', label: 'Ações Comerciais', icon: Tag },
  { to: '/encartes', label: 'Encartes', icon: Newspaper },
  { to: '/concorrencia', label: 'Concorrência', icon: Store },
];

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className={`fixed left-0 top-0 h-screen ${collapsed ? 'w-16' : 'w-64'} bg-royal border-r border-royal/30 flex flex-col z-50 transition-all duration-300 overflow-hidden`}>
      {/* Header */}
      <div className={`p-4 border-b border-white/20 flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-3`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg text-white shrink-0">
            C
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-white truncate">IA Cometa</h1>
              <p className="text-xs text-white/60">Painel de Gestão</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button onClick={onToggle} className="text-white/50 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition shrink-0" title="Recolher menu">
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <Icon size={20} className="shrink-0" />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/20">
        {collapsed ? (
          <button onClick={onToggle} className="w-full flex justify-center text-white/50 hover:text-white p-2 rounded-lg hover:bg-white/10 transition" title="Expandir menu">
            <ChevronRight size={16} />
          </button>
        ) : (
          <div className="px-4 py-3 rounded-xl bg-white/10 border border-white/20">
            <p className="text-xs text-white/60">Bandeiras</p>
            <p className="text-sm font-medium text-white mt-1">Valemilk + Valefish</p>
          </div>
        )}
      </div>
    </aside>
  );
}
