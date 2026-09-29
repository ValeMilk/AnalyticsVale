import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, MoreHorizontal, Pencil, Plus, ShieldCheck, Trash2, User, UserCheck, UserX } from 'lucide-react';
import api from '../api/client';
import { useAuth, useResourceGuard } from '../context/AuthContext';
import { useTituloDaPagina } from '../context/PaginaContext';
import { RestrictedAccess } from '../components/RestrictedAccess';
import { AppHeader } from '../components/layout/AppHeader';
import { PainelDeFiltros, CampoDeFiltro, filtrosAtivos } from '../components/filtros/PainelDeFiltros';
import { SearchInput } from '../components/filtros/SearchInput';
import { TabelaDeDados } from '../components/tabela/TabelaDeDados';
import { useTabelaDeDados } from '../components/tabela/useTabelaDeDados';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Switch } from '../components/ui/Switch';
import { Label } from '../components/ui/Label';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '../components/ui/Dialog';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '../components/ui/DropdownMenu';
import { useToast } from '../components/ui/Toast';
import { ConfirmarExclusaoDialog } from '../components/dialogos/ConfirmarExclusaoDialog';
import { CampoDeFormulario } from '../components/formulario/CampoDeFormulario';
import { useFormulario } from '../components/formulario/useFormulario';
import { fmtData, iniciais, soData } from '../lib/formatar';
import { cn } from '../lib/cn';

function montarColunas({ meuId, onEditar, onAlternarAtivo, onRemover }) {
  return [
    {
      id: 'nome',
      tipo: 'texto',
      rotulo: 'Usuário',
      fixa: true,
      larguraClasse: 'min-w-56',
      valor: (u) => u.nome,
      renderizar: (u) => (
        <div className="flex items-center gap-3">
          <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-md text-xs font-bold', u.role === 'admin' ? 'bg-secondary/10 text-secondary' : 'bg-neutral-100 text-neutral-500')} aria-hidden>
            {u.role === 'admin' ? <ShieldCheck className="size-4" /> : iniciais(u.nome) || <User className="size-4" />}
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
              <span className="truncate">{u.nome}</span>
              {u._id === meuId && <Badge variant="info">você</Badge>}
            </p>
            <p className="text-xs text-neutral-400">@{u.username}</p>
          </div>
        </div>
      ),
    },
    { id: 'username', tipo: 'texto', rotulo: 'Login', padrao: false, escondeNoCelular: true, valor: (u) => u.username },
    {
      id: 'role',
      tipo: 'categoria',
      rotulo: 'Perfil',
      valor: (u) => (u.role === 'admin' ? 'Admin' : 'Usuário'),
      renderizar: (u) => <Badge variant={u.role === 'admin' ? 'secondary' : 'neutro'}>{u.role === 'admin' ? 'Admin' : 'Usuário'}</Badge>,
    },
    {
      id: 'ativo',
      tipo: 'categoria',
      rotulo: 'Status',
      papelNoCartao: 'status',
      valor: (u) => (u.ativo ? 'Ativo' : 'Inativo'),
      renderizar: (u) => <Badge variant={u.ativo ? 'sucesso' : 'neutro'}>{u.ativo ? 'Ativo' : 'Inativo'}</Badge>,
    },
    { id: 'createdAt', tipo: 'data', rotulo: 'Criado em', valor: (u) => soData(u.createdAt), renderizar: (u) => fmtData(u.createdAt) },
    {
      id: 'acoes',
      tipo: 'custom',
      rotulo: 'Ações',
      ordenavel: false,
      larguraClasse: 'w-12',
      alinhamento: 'right',
      renderizar: (u) => {
        const souEu = u._id === meuId;
        return (
          <DropdownMenu
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label={`Ações de ${u.nome}`}>
                <MoreHorizontal />
              </Button>
            }
          >
            <DropdownMenuItem onSelect={() => onEditar(u)}>
              <Pencil /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAlternarAtivo(u)} disabled={souEu}>
              {u.ativo ? <UserX /> : <UserCheck />} {u.ativo ? 'Inativar' : 'Reativar'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onRemover(u)} disabled={souEu}>
              <Trash2 /> Remover
            </DropdownMenuItem>
          </DropdownMenu>
        );
      },
    },
  ];
}

// ─── Formulário ──────────────────────────────────────────────────────────────
function validar(v, editando) {
  const erros = {};
  if (!v.nome.trim() || v.nome.trim().length < 2) erros.nome = 'Informe o nome completo.';
  if (!v.username.trim()) erros.username = 'Informe o nome de usuário.';
  else if (!/^[a-z0-9._-]+$/i.test(v.username.trim())) erros.username = 'Use apenas letras, números, ponto, hífen ou sublinhado.';
  if (!editando && !v.password) erros.password = 'Informe uma senha.';
  if (v.password && v.password.length < 6) erros.password = 'A senha deve ter no mínimo 6 caracteres.';
  return erros;
}

function FormularioDeUsuario({ open, onOpenChange, usuario, onSalvo }) {
  const editando = Boolean(usuario?._id);
  const valoresIniciais = useMemo(
    () => ({ nome: usuario?.nome || '', username: usuario?.username || '', password: '', role: usuario?.role || 'user', ativo: usuario?.ativo ?? true }),
    [usuario]
  );
  const form = useFormulario({ valoresIniciais, validar: (v) => validar(v, editando) });
  const { resetar } = form;

  useEffect(() => {
    if (open) resetar(valoresIniciais);
  }, [open, valoresIniciais, resetar]);

  const salvar = async (v) => {
    const payload = { ...v, nome: v.nome.trim(), username: v.username.trim() };
    if (!payload.password) delete payload.password; // não altera a senha se o campo ficou vazio
    try {
      if (editando) await api.put(`/users/${usuario._id}`, payload);
      else await api.post('/users', payload);
      onSalvo(editando);
    } catch (err) {
      form.setErros({ _geral: err.response?.data?.error || err.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} tamanho="sm">
      <DialogHeader onClose={() => onOpenChange(false)}>
        <DialogTitle>{editando ? 'Editar usuário' : 'Novo usuário'}</DialogTitle>
        <DialogDescription>Acesso ao painel. Administradores também gerenciam usuários.</DialogDescription>
      </DialogHeader>
      <form onSubmit={form.submeter(salvar)} noValidate className="flex min-h-0 flex-1 flex-col">
        <DialogBody className="flex flex-col gap-4">
          <CampoDeFormulario rotulo="Nome completo" htmlFor="usr-nome" obrigatorio erro={form.erros.nome}>
            <Input id="usr-nome" autoComplete="off" className="bg-neutral-50" {...form.propsDoCampo('nome')} />
          </CampoDeFormulario>
          <CampoDeFormulario rotulo="Nome de usuário" htmlFor="usr-username" obrigatorio erro={form.erros.username}>
            <Input id="usr-username" autoComplete="off" className="bg-neutral-50" {...form.propsDoCampo('username')} />
          </CampoDeFormulario>
          <CampoDeFormulario rotulo="Senha" htmlFor="usr-senha" obrigatorio={!editando} erro={form.erros.password} ajuda={editando ? 'Deixe em branco para não alterar.' : undefined}>
            <Input id="usr-senha" type="password" autoComplete="new-password" placeholder={editando ? '••••••••' : 'Nova senha'} className="bg-neutral-50" {...form.propsDoCampo('password')} />
          </CampoDeFormulario>
          <div className="grid grid-cols-2 gap-3">
            <CampoDeFormulario rotulo="Perfil" htmlFor="usr-role">
              <Select id="usr-role" className="bg-neutral-50" {...form.propsDoCampo('role')}>
                <option value="user">Usuário</option>
                <option value="admin">Admin</option>
              </Select>
            </CampoDeFormulario>
            <CampoDeFormulario rotulo="Status">
              <div className="flex h-10 items-center gap-2">
                <Switch id="usr-ativo" checked={form.valores.ativo} onCheckedChange={(v) => form.definir('ativo', v)} />
                <Label htmlFor="usr-ativo" className="text-sm text-neutral-700">
                  {form.valores.ativo ? 'Ativo' : 'Inativo'}
                </Label>
              </div>
            </CampoDeFormulario>
          </div>
          {form.erros._geral && (
            <p role="alert" className="rounded-sm border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
              {form.erros._geral}
            </p>
          )}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={form.enviando}>
            Cancelar
          </Button>
          <Button type="submit" variant="secondary" disabled={form.enviando}>
            {form.enviando && <Loader2 className="animate-spin" aria-hidden />}
            {editando ? 'Salvar' : 'Cadastrar'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

// ─── Página ──────────────────────────────────────────────────────────────────
export default function Admin() {
  useTituloDaPagina('Administração', 'Usuários com acesso ao painel');
  const guard = useResourceGuard('usuarios');
  const { user: eu } = useAuth();
  const { notificar } = useToast();

  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState('');
  const [mostrarInativos, setMostrarInativos] = useState(true);

  const [formAberto, setFormAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState(null);
  const [aRemover, setARemover] = useState(null);
  const [aAlternar, setAAlternar] = useState(null);
  const [processando, setProcessando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const r = await api.get('/users');
      setUsuarios(r.data.data || []);
    } catch (err) {
      setErro(err.response?.data?.error || err.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (guard.canView) carregar();
  }, [guard.canView, carregar]);

  const linhas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return usuarios.filter((u) => {
      if (!mostrarInativos && !u.ativo) return false;
      if (q && !(u.nome?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [usuarios, busca, mostrarInativos]);

  const colunas = useMemo(
    () =>
      montarColunas({
        meuId: eu?._id,
        onEditar: (u) => {
          setEmEdicao(u);
          setFormAberto(true);
        },
        onAlternarAtivo: setAAlternar,
        onRemover: setARemover,
      }),
    [eu?._id]
  );
  const tabela = useTabelaDeDados({ linhas, colunas, ordenacaoPadrao: { colunaId: 'createdAt', direcao: 'desc' }, baseDasOpcoes: usuarios, passo: null });

  if (guard.isDenied) return <RestrictedAccess title="Administração" area="a administração de usuários" />;

  const ativos = filtrosAtivos([!mostrarInativos && { id: 'inativos', rotulo: 'Ocultando inativos', onRemover: () => setMostrarInativos(true) }]);
  const limparTudo = () => {
    setMostrarInativos(true);
    setBusca('');
  };

  const alternarAtivo = async () => {
    if (!aAlternar) return;
    setProcessando(true);
    try {
      await api.put(`/users/${aAlternar._id}`, { ativo: !aAlternar.ativo });
      notificar({ tipo: 'sucesso', titulo: aAlternar.ativo ? 'Usuário inativado' : 'Usuário reativado' });
      setAAlternar(null);
      carregar();
    } catch (err) {
      notificar({ tipo: 'erro', titulo: 'Não foi possível alterar', descricao: err.response?.data?.error || err.message });
    } finally {
      setProcessando(false);
    }
  };

  const remover = async () => {
    if (!aRemover) return;
    setProcessando(true);
    try {
      await api.delete(`/users/${aRemover._id}`);
      notificar({ tipo: 'sucesso', titulo: 'Usuário removido' });
      setARemover(null);
      carregar();
    } catch (err) {
      notificar({ tipo: 'erro', titulo: 'Não foi possível remover', descricao: err.response?.data?.error || err.message });
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <AppHeader
        actionsSlot={
          guard.canCreate && (
            <Button
              variant="secondary"
              onClick={() => {
                setEmEdicao(null);
                setFormAberto(true);
              }}
            >
              <Plus aria-hidden /> Novo usuário
            </Button>
          )
        }
      />

      <PainelDeFiltros telaId="admin-usuarios" ativos={ativos} onLimparTudo={limparTudo} slotFixo={<SearchInput value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou usuário..." />}>
        <CampoDeFiltro rotulo="Status">
          <div className="flex h-10 items-center gap-2">
            <Switch id="adm-inativos" checked={mostrarInativos} onCheckedChange={setMostrarInativos} />
            <Label htmlFor="adm-inativos" className="text-sm text-neutral-700">
              Mostrar inativos
            </Label>
          </div>
        </CampoDeFiltro>
      </PainelDeFiltros>

      <TabelaDeDados
        tabela={tabela}
        chaveDaLinha={(u) => u._id}
        classeDaLinha={(u) => (u.ativo ? undefined : 'opacity-60')}
        carregando={carregando || guard.isLoading}
        erro={erro}
        aoTentarNovamente={carregar}
        temFiltroDeTela={ativos.length > 0 || Boolean(busca)}
        onLimparFiltrosDeTela={limparTudo}
        vazio={{ mensagemVazio: 'Nenhum usuário cadastrado', mensagemFiltrada: 'Nenhum usuário corresponde aos filtros' }}
      />

      <FormularioDeUsuario
        open={formAberto}
        onOpenChange={setFormAberto}
        usuario={emEdicao}
        onSalvo={(editou) => {
          setFormAberto(false);
          setEmEdicao(null);
          notificar({ tipo: 'sucesso', titulo: editou ? 'Usuário atualizado' : 'Usuário cadastrado' });
          carregar();
        }}
      />

      <ConfirmarExclusaoDialog
        open={Boolean(aAlternar)}
        onOpenChange={(v) => !v && setAAlternar(null)}
        titulo={aAlternar ? `${aAlternar.ativo ? 'Inativar' : 'Reativar'} ${aAlternar.nome}?` : ''}
        consequencia={aAlternar ? (aAlternar.ativo ? `${aAlternar.nome} não consegue mais entrar no painel a partir de agora.` : `${aAlternar.nome} volta a conseguir entrar no painel.`) : ''}
        reversivel
        textoReversivel="Nada é apagado: o cadastro continua na lista e pode ser alterado de novo pelo menu de ações."
        textoConfirmar={aAlternar?.ativo ? 'Inativar' : 'Reativar'}
        textoConfirmando={aAlternar?.ativo ? 'Inativando…' : 'Reativando…'}
        onConfirmar={alternarAtivo}
        confirmando={processando}
      />

      <ConfirmarExclusaoDialog
        open={Boolean(aRemover)}
        onOpenChange={(v) => !v && setARemover(null)}
        alvo={aRemover ? `o usuário ${aRemover.nome}` : ''}
        consequencia={aRemover ? `${aRemover.nome} perde o acesso imediatamente e o cadastro some da lista. Se a pessoa pode voltar, prefira "Inativar".` : ''}
        textoConfirmar="Remover"
        textoConfirmando="Removendo…"
        onConfirmar={remover}
        confirmando={processando}
      />
    </div>
  );
}
