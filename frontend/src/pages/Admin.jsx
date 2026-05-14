import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, ShieldCheck, User, Check } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

function UserModal({ user, onClose, onSave }) {
  const isEdit = !!user?._id;
  const [form, setForm] = useState({
    nome: user?.nome || '',
    username: user?.username || '',
    password: '',
    role: user?.role || 'user',
    ativo: user?.ativo ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password; // não altera senha se campo vazio na edição
      if (isEdit) {
        await api.put(`/users/${user._id}`, payload);
      } else {
        if (!payload.password) { setErro('Informe uma senha'); setSaving(false); return; }
        await api.post('/users', payload);
      }
      onSave();
    } catch (err) {
      setErro(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">{isEdit ? 'Editar Usuário' : 'Novo Usuário'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Nome completo *</label>
            <input type="text" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-royal focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Username *</label>
            <input type="text" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-royal focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Senha {isEdit && <span className="text-slate-400 normal-case font-normal">(deixe em branco para não alterar)</span>}
            </label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder={isEdit ? '••••••••' : 'Nova senha'}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-royal focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Perfil</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-royal focus:outline-none">
                <option value="user">Usuário</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Status</label>
              <select value={form.ativo ? 'ativo' : 'inativo'} onChange={e => setForm(f => ({ ...f, ativo: e.target.value === 'ativo' }))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-royal focus:outline-none">
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>

          {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{erro}</p>}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="py-3 rounded-xl border-2 border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="py-3 rounded-xl bg-royal text-white text-sm font-semibold disabled:opacity-50 hover:bg-royal/90 transition-colors">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Admin() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | user object
  const [confirmDel, setConfirmDel] = useState(null);

  const carregar = async () => {
    setLoading(true);
    try {
      const r = await api.get('/users');
      setUsers(r.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const deletar = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      setConfirmDel(null);
      carregar();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Administração</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Gerenciamento de usuários</p>
        </div>
        <button
          onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-royal text-white rounded-xl text-sm font-semibold hover:bg-royal/90 transition-colors shadow-sm"
        >
          <Plus size={16} />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Usuário</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Perfil</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${u.role === 'admin' ? 'bg-royal/10 text-royal' : 'bg-slate-100 text-slate-500'}`}>
                        {u.role === 'admin' ? <ShieldCheck size={18} /> : <User size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{u.nome}</p>
                        <p className="text-xs text-slate-400">@{u.username}</p>
                      </div>
                      {u._id === me?._id && (
                        <span className="text-xs bg-royal/10 text-royal font-semibold px-2 py-0.5 rounded-full">você</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.role === 'admin' ? 'bg-royal/10 text-royal' : 'bg-slate-100 text-slate-600'}`}>
                      {u.role === 'admin' ? 'Admin' : 'Usuário'}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.ativo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setModal(u)}
                        className="p-2 rounded-lg text-slate-400 hover:text-royal hover:bg-royal/10 transition-colors">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => setConfirmDel(u)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal criar/editar */}
      {modal && (
        <UserModal
          user={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); carregar(); }}
        />
      )}

      {/* Confirm delete */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <Trash2 size={32} className="text-red-400 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 mb-1">Remover usuário?</h3>
            <p className="text-sm text-slate-500 mb-5">Esta ação não pode ser desfeita. <strong>{confirmDel.nome}</strong> perderá o acesso.</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setConfirmDel(null)}
                className="py-2.5 rounded-xl border-2 border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button onClick={() => deletar(confirmDel._id)}
                className="py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
