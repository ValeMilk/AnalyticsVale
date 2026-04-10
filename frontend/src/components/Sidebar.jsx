import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Bell, Tag, BarChart3 } from 'lucide-react';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/acoes-analise', label: 'Análise Eficácia', icon: BarChart3 },
  { to: '/vendas', label: 'Vendas', icon: ShoppingCart },
  { to: '/alertas', label: 'Alertas', icon: Bell },
  { to: '/acoes', label: 'Ações Comerciais', icon: Tag },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-royal border-r border-royal flex flex-col z-50">
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg text-white">
            C
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">IA Cometa</h1>
            <p className="text-xs text-white/60">Painel de Gestão</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/20">
        <div className="px-4 py-3 rounded-xl bg-white/10 border border-white/20">
          <p className="text-xs text-white/60">Bandeiras</p>
          <p className="text-sm font-medium text-white mt-1">Valemilk + Valefish</p>
        </div>
      </div>
    </aside>
  );
}
