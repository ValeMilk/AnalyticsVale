import { LayoutDashboard, BarChart3, ShoppingCart, Bell, Tag, Newspaper, Store, ShieldCheck } from 'lucide-react';

// Lista ÚNICA de itens de navegação. Sidebar (desktop), sidebar em Sheet (mobile) e barra
// inferior leem daqui — nunca três listas paralelas.
export const ITENS_MENU = [
  { href: '/', titulo: 'Dashboard', icon: LayoutDashboard, grupo: 'Visão geral', navInferior: true },
  { href: '/acoes-analise', titulo: 'Análise de eficácia', tituloCurto: 'Análise', icon: BarChart3, grupo: 'Visão geral', navInferior: true },
  { href: '/vendas', titulo: 'Vendas', icon: ShoppingCart, grupo: 'Visão geral' },
  { href: '/alertas', titulo: 'Alertas', icon: Bell, grupo: 'Visão geral' },
  { href: '/acoes', titulo: 'Ações comerciais', tituloCurto: 'Ações', icon: Tag, grupo: 'Comercial', navInferior: true },
  { href: '/encartes', titulo: 'Encartes', icon: Newspaper, grupo: 'Comercial', navInferior: true },
  { href: '/concorrencia', titulo: 'Concorrência', icon: Store, grupo: 'Comercial' },
  { href: '/admin', titulo: 'Administração', icon: ShieldCheck, grupo: 'Sistema', somenteAdmin: true },
];

export function itensVisiveis(user) {
  return ITENS_MENU.filter((item) => !item.somenteAdmin || user?.role === 'admin');
}

/** Primeira rota que esta pessoa pode abrir — usada no logo e após o login */
export function primeiraRota(user) {
  return itensVisiveis(user)[0]?.href ?? '/';
}

export function gruposDoMenu(user) {
  const grupos = [];
  for (const item of itensVisiveis(user)) {
    let grupo = grupos.find((g) => g.nome === item.grupo);
    if (!grupo) {
      grupo = { nome: item.grupo, itens: [] };
      grupos.push(grupo);
    }
    grupo.itens.push(item);
  }
  return grupos;
}

export function itensDaNavInferior(user) {
  return itensVisiveis(user).filter((item) => item.navInferior).slice(0, 4);
}

export function rotaAtiva(href, pathname) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}
