import { useState } from 'react';
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTituloDaPagina } from '../context/PaginaContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CampoDeFormulario } from '../components/formulario/CampoDeFormulario';

export default function Login() {
  useTituloDaPagina('Entrar');
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await login(form.username.trim(), form.password);
    } catch (err) {
      setErro(err.response?.data?.error || 'Não foi possível conectar. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="app-bg flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-xl bg-primary text-3xl font-bold text-white shadow-md">C</div>
          <h1 className="text-2xl font-semibold text-neutral-900">IA Cometa</h1>
          <p className="mt-1 text-sm text-neutral-500">Painel de Gestão</p>
        </div>

        <div className="superficie p-8 shadow-sm">
          <h2 className="mb-6 text-base font-semibold text-neutral-800">Entrar</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <CampoDeFormulario rotulo="Usuário" htmlFor="login-usuario">
              <Input
                id="login-usuario"
                type="text"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                autoComplete="username"
                required
                autoFocus
                placeholder="seu.usuario"
                className="bg-neutral-50"
              />
            </CampoDeFormulario>

            <CampoDeFormulario rotulo="Senha" htmlFor="login-senha">
              <div className="relative">
                <Input
                  id="login-senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="bg-neutral-50 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={mostrarSenha}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1.5 text-neutral-400 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-secondary/30"
                >
                  {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </CampoDeFormulario>

            {erro && (
              <div role="alert" className="rounded-sm border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
                {erro}
              </div>
            )}

            <Button type="submit" variant="secondary" size="lg" disabled={enviando} className="mt-2 w-full">
              {enviando ? <Loader2 className="animate-spin" aria-hidden /> : <LogIn aria-hidden />}
              {enviando ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
