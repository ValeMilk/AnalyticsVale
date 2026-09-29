import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  }, []);

  // Valida token salvo ao iniciar
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    api
      .get('/auth/me')
      .then((r) => setUser(r.data.user))
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [logout]);

  const login = async (username, password) => {
    const r = await api.post('/auth/login', { username, password });
    const { token, user: u } = r.data;
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(u);
    return u;
  };

  const value = useMemo(() => ({ user, login, logout, loading }), [user, logout, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

// Permissões: hoje só existe o papel admin/user, mas a tela pergunta "posso?" por chave,
// para que o dia em que houver permissão granular nada mude nas páginas.
const PERMISSOES_POR_RECURSO = {
  usuarios: { view: 'admin', create: 'admin', update: 'admin', delete: 'admin', export: 'admin' },
};

export function usePermissoes() {
  const { user, loading } = useAuth();
  const can = useCallback(
    (chave) => {
      if (!user) return false;
      if (chave === 'admin') return user.role === 'admin';
      return true;
    },
    [user]
  );
  return { can, isLoading: loading };
}

/**
 * Guarda de recurso: `isDenied` só é verdadeiro depois que as permissões carregaram —
 * gatear em `!canView` puro faria a tela piscar "acesso restrito" durante o carregamento.
 */
export function useResourceGuard(recurso) {
  const { can, isLoading } = usePermissoes();
  return useMemo(() => {
    const regras = PERMISSOES_POR_RECURSO[recurso] ?? {};
    const checar = (acao) => (regras[acao] ? can(regras[acao]) : true);
    const canView = checar('view');
    return {
      canView,
      canCreate: checar('create'),
      canUpdate: checar('update'),
      canDelete: checar('delete'),
      canExport: checar('export'),
      isLoading,
      isDenied: !isLoading && !canView,
    };
  }, [can, isLoading, recurso]);
}
