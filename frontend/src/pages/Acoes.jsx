import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2, X } from 'lucide-react';
import api from '../api/client';
import { useTituloDaPagina } from '../context/PaginaContext';
import { AppHeader } from '../components/layout/AppHeader';
import { PainelDeFiltros, CampoDeFiltro, filtrosAtivos } from '../components/filtros/PainelDeFiltros';
import { SearchInput } from '../components/filtros/SearchInput';
import { Segmentado, OPCOES_BANDEIRA, ROTULO_BANDEIRA } from '../components/filtros/Segmentado';
import { TabelaDeDados } from '../components/tabela/TabelaDeDados';
import { useTabelaDeDados } from '../components/tabela/useTabelaDeDados';
import { GerenciadorDeColunas } from '../components/tabela/GerenciadorDeColunas';
import { MenuExportar } from '../components/tabela/MenuExportar';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, Textarea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Switch } from '../components/ui/Switch';
import { Label } from '../components/ui/Label';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '../components/ui/Dialog';
import { DropdownMenu, DropdownMenuItem } from '../components/ui/DropdownMenu';
import { useToast } from '../components/ui/Toast';
import { ConfirmarExclusaoDialog } from '../components/dialogos/ConfirmarExclusaoDialog';
import { CampoDeFormulario } from '../components/formulario/CampoDeFormulario';
import { useFormulario } from '../components/formulario/useFormulario';
import { SeletorDeProdutos } from '../components/formulario/SeletorDeProdutos';
import { BadgeDeTipoDeAcao } from '../components/BadgeDeTipoDeAcao';
import { TIPOS_ACAO, ROTULO_TIPO_ACAO, normEan } from '../config/acoes';
import { fmtData, fmtDiaSemana, fmtMoeda, hojeLocal, soData } from '../lib/formatar';

const OPCOES_TIPO = [{ value: '', label: 'Todos' }, ...TIPOS_ACAO.map((t) => ({ value: t.value, label: t.label }))];

function statusDaAcao(a, hoje) {
  const ini = soData(a.data_inicio);
  const fim = soData(a.data_fim);
  if (!ini || !fim) return 'Sem data';
  if (hoje < ini) return 'Programada';
  if (hoje > fim) return 'Encerrada';
  return 'Ativa';
}
const VARIANTE_STATUS = { Ativa: 'sucesso', Programada: 'alerta', Encerrada: 'neutro', 'Sem data': 'neutro' };

function montarColunas({ hoje, onEditar, onExcluir }) {
  return [
    { id: 'tipo', tipo: 'categoria', rotulo: 'Tipo', fixa: true, larguraClasse: 'w-36', papelNoCartao: 'status', valor: (a) => ROTULO_TIPO_ACAO[a.tipo] ?? a.tipo, renderizar: (a) => <BadgeDeTipoDeAcao tipo={a.tipo} /> },
    {
      id: 'produto',
      tipo: 'texto',
      rotulo: 'Produto',
      fixa: true,
      larguraClasse: 'min-w-56',
      papelNoCartao: 'titulo',
      valor: (a) => a.produto,
      renderizar: (a) => (
        <div className="min-w-0">
          <p className="font-medium text-neutral-900">{a.produto}</p>
          <p className="text-xs text-neutral-400">{a.cod_interno ? `Cód. ${a.cod_interno} · ` : ''}EAN {normEan(a.ean)}</p>
        </div>
      ),
    },
    { id: 'status', tipo: 'categoria', rotulo: 'Status', papelNoCartao: 'etiqueta', valor: (a) => statusDaAcao(a, hoje), renderizar: (a) => <Badge variant={VARIANTE_STATUS[statusDaAcao(a, hoje)]}>{statusDaAcao(a, hoje)}</Badge> },
    { id: 'preco_acao', tipo: 'numero', rotulo: 'Preço da ação', formato: 'moeda', valor: (a) => (a.preco_acao == null ? null : Number(a.preco_acao)) },
    { id: 'preco_normal', tipo: 'numero', rotulo: 'Preço normal', formato: 'moeda', padrao: false, valor: (a) => (a.preco_normal == null ? null : Number(a.preco_normal)) },
    { id: 'data_inicio', tipo: 'data', rotulo: 'Início', valor: (a) => soData(a.data_inicio), renderizar: (a) => <span>{fmtData(a.data_inicio)} <span className="text-neutral-400">({fmtDiaSemana(a.data_inicio)})</span></span> },
    { id: 'data_fim', tipo: 'data', rotulo: 'Fim', valor: (a) => soData(a.data_fim), renderizar: (a) => <span>{fmtData(a.data_fim)} <span className="text-neutral-400">({fmtDiaSemana(a.data_fim)})</span></span> },
    { id: 'vendor', tipo: 'categoria', rotulo: 'Bandeira', valor: (a) => ROTULO_BANDEIRA[a.vendor] ?? a.vendor },
    { id: 'observacao', tipo: 'texto', rotulo: 'Observação', padrao: false, valor: (a) => a.observacao || null },
    {
      id: 'acoes',
      tipo: 'custom',
      rotulo: 'Ações',
      ordenavel: false,
      larguraClasse: 'w-12',
      alinhamento: 'right',
      renderizar: (a) => (
        <DropdownMenu
          trigger={
            <Button variant="ghost" size="icon-sm" aria-label={`Ações de ${a.produto}`}>
              <MoreHorizontal />
            </Button>
          }
        >
          <DropdownMenuItem onSelect={() => onEditar(a)}>
            <Pencil /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => onExcluir(a)}>
            <Trash2 /> Excluir
          </DropdownMenuItem>
        </DropdownMenu>
      ),
    },
  ];
}

const ORDENACAO_PADRAO = { colunaId: 'data_inicio', direcao: 'desc' };

// ─── Formulário (criar / editar) ─────────────────────────────────────────────
function validar(v, { editando, selecionados }) {
  const erros = {};
  if (!v.tipo) erros.tipo = 'Escolha o tipo da ação.';
  if (!editando && selecionados.length === 0) erros.produtos = 'Adicione ao menos um produto.';
  const preco = Number(String(v.preco_acao).replace(',', '.'));
  if (!v.preco_acao || Number.isNaN(preco) || preco <= 0) erros.preco_acao = 'Informe o preço da ação.';
  if (v.preco_normal) {
    const pn = Number(String(v.preco_normal).replace(',', '.'));
    if (Number.isNaN(pn) || pn < 0) erros.preco_normal = 'Preço normal inválido.';
  }
  if (!v.data_inicio) erros.data_inicio = 'Informe a data de início.';
  if (!v.data_fim) erros.data_fim = 'Informe a data de fim.';
  if (v.data_inicio && v.data_fim && v.data_fim < v.data_inicio) erros.data_fim = 'A data de fim deve ser igual ou posterior ao início.';
  return erros;
}

function FormularioDeAcao({ open, onOpenChange, acao, produtos, onSalvo }) {
  const editando = Boolean(acao?._id);
  const { notificar } = useToast();
  const [selecionados, setSelecionados] = useState([]);
  const valoresIniciais = useMemo(
    () => ({
      tipo: acao?.tipo || 'encarte',
      preco_normal: acao?.preco_normal ?? '',
      preco_acao: acao?.preco_acao ?? '',
      data_inicio: soData(acao?.data_inicio) || '',
      data_fim: soData(acao?.data_fim) || '',
      vendor: acao?.vendor || 'ambos',
      observacao: acao?.observacao || '',
    }),
    [acao]
  );
  const form = useFormulario({ valoresIniciais, validar: (v) => validar(v, { editando, selecionados }) });
  const { resetar } = form;

  useEffect(() => {
    if (!open) return;
    resetar(valoresIniciais);
    setSelecionados(editando ? [{ ean: acao.ean, produto: acao.produto, cod_interno: acao.cod_interno || '' }] : []);
  }, [open, valoresIniciais, editando, acao, resetar]);

  const salvar = async (v) => {
    const num = (x) => (x === '' || x == null ? null : Number(String(x).replace(',', '.')));
    try {
      if (editando) {
        await api.put(`/acoes/${acao._id}`, {
          ...v,
          preco_normal: num(v.preco_normal),
          preco_acao: num(v.preco_acao),
          ean: selecionados[0].ean,
          produto: selecionados[0].produto,
          cod_interno: selecionados[0].cod_interno,
        });
        notificar({ tipo: 'sucesso', titulo: 'Ação atualizada' });
      } else {
        const r = await api.post('/acoes', { ...v, preco_normal: num(v.preco_normal), preco_acao: num(v.preco_acao), produtos: selecionados });
        notificar({ tipo: 'sucesso', titulo: 'Ação criada', descricao: `${r.data.metadata?.total ?? selecionados.length} produto(s) cadastrado(s).` });
      }
      onSalvo();
    } catch (err) {
      form.setErros({ _geral: err.response?.data?.error || err.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader onClose={() => onOpenChange(false)}>
        <DialogTitle>{editando ? 'Editar ação comercial' : 'Nova ação comercial'}</DialogTitle>
        <DialogDescription>Encarte, oferta interna ou rebaixa de preço, com período de vigência.</DialogDescription>
      </DialogHeader>
      <form onSubmit={form.submeter(salvar)} noValidate className="flex min-h-0 flex-1 flex-col">
        <DialogBody className="flex flex-col gap-4">
          <CampoDeFormulario rotulo="Tipo" obrigatorio erro={form.erros.tipo}>
            <Segmentado rotulo="Tipo" opcoes={TIPOS_ACAO.map((t) => ({ value: t.value, label: t.label }))} valor={form.valores.tipo} onChange={(v) => form.definir('tipo', v)} />
          </CampoDeFormulario>

          <CampoDeFormulario rotulo={editando ? 'Produto' : 'Produtos'} obrigatorio erro={form.erros.produtos}>
            <div aria-invalid={form.erros.produtos ? true : undefined} className="flex flex-col gap-2">
              {selecionados.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selecionados.map((s) => (
                    <span key={s.ean} className="inline-flex items-center gap-1 rounded-md border border-secondary/20 bg-secondary/5 px-2 py-1 text-xs text-secondary">
                      <span className="max-w-[180px] truncate">{s.produto}</span>
                      <span className="text-secondary/60">#{s.cod_interno || normEan(s.ean)}</span>
                      {!editando && (
                        <button type="button" onClick={() => setSelecionados((l) => l.filter((x) => x.ean !== s.ean))} aria-label={`Remover ${s.produto}`} className="rounded-xs hover:text-danger">
                          <X className="size-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
              {!editando && (
                <SeletorDeProdutos
                  produtos={produtos}
                  selecionados={selecionados.map((s) => s.ean)}
                  onAdicionar={(p) => setSelecionados((l) => [...l, { ean: p.ean, produto: p.produto, cod_interno: p.cod_interno || '' }])}
                  onAdicionarVarios={(lista) => setSelecionados((l) => [...l, ...lista.map((p) => ({ ean: p.ean, produto: p.produto, cod_interno: p.cod_interno || '' }))])}
                />
              )}
            </div>
          </CampoDeFormulario>

          <div className="grid grid-cols-2 gap-3">
            <CampoDeFormulario rotulo="Preço normal" htmlFor="acao-preco-normal" erro={form.erros.preco_normal}>
              <Input id="acao-preco-normal" type="number" step="0.01" min="0" inputMode="decimal" placeholder="0,00" className="bg-neutral-50" {...form.propsDoCampo('preco_normal')} />
            </CampoDeFormulario>
            <CampoDeFormulario rotulo="Preço da ação" htmlFor="acao-preco" obrigatorio erro={form.erros.preco_acao}>
              <Input id="acao-preco" type="number" step="0.01" min="0" inputMode="decimal" placeholder="0,00" className="bg-neutral-50" {...form.propsDoCampo('preco_acao')} />
            </CampoDeFormulario>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CampoDeFormulario rotulo="Início" htmlFor="acao-inicio" obrigatorio erro={form.erros.data_inicio}>
              <Input id="acao-inicio" type="date" className="bg-neutral-50" {...form.propsDoCampo('data_inicio')} />
            </CampoDeFormulario>
            <CampoDeFormulario rotulo="Fim" htmlFor="acao-fim" obrigatorio erro={form.erros.data_fim}>
              <Input id="acao-fim" type="date" min={form.valores.data_inicio || undefined} className="bg-neutral-50" {...form.propsDoCampo('data_fim')} />
            </CampoDeFormulario>
          </div>

          <CampoDeFormulario rotulo="Bandeira" htmlFor="acao-vendor">
            <Select id="acao-vendor" className="bg-neutral-50" {...form.propsDoCampo('vendor')}>
              {OPCOES_BANDEIRA.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </CampoDeFormulario>

          <CampoDeFormulario rotulo="Observação" htmlFor="acao-obs">
            <Textarea id="acao-obs" rows={2} placeholder="Detalhes adicionais..." className="bg-neutral-50" {...form.propsDoCampo('observacao')} />
          </CampoDeFormulario>

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
            {editando ? 'Salvar' : 'Criar ação'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

// ─── Página ──────────────────────────────────────────────────────────────────
export default function Acoes() {
  useTituloDaPagina('Ações comerciais', 'Encartes, ofertas internas e rebaixas');
  const { notificar } = useToast();
  const hoje = hojeLocal();

  const [acoes, setAcoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [produtos, setProdutos] = useState([]);

  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState('');
  const [vendor, setVendor] = useState('ambos');
  const [somenteAtivas, setSomenteAtivas] = useState(false);

  const [formAberto, setFormAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState(null);
  const [aExcluir, setAExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    api.get('/produtos').then((r) => setProdutos(r.data.data || [])).catch(() => {});
  }, []);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await api.get(`/acoes${tipo ? `?tipo=${tipo}` : ''}`);
      setAcoes(res.data.data || []);
    } catch (err) {
      setErro(err.response?.data?.error || err.message);
    } finally {
      setCarregando(false);
    }
  }, [tipo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const linhas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return acoes.filter((a) => {
      if (vendor !== 'ambos' && a.vendor !== vendor) return false;
      if (somenteAtivas && statusDaAcao(a, hoje) !== 'Ativa') return false;
      if (q && !(a.produto?.toLowerCase().includes(q) || normEan(a.ean).includes(q) || String(a.cod_interno ?? '').includes(q) || a.observacao?.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [acoes, busca, vendor, somenteAtivas, hoje]);

  const colunas = useMemo(
    () =>
      montarColunas({
        hoje,
        onEditar: (a) => {
          setEmEdicao(a);
          setFormAberto(true);
        },
        onExcluir: setAExcluir,
      }),
    [hoje]
  );
  const tabela = useTabelaDeDados({ linhas, colunas, ordenacaoPadrao: ORDENACAO_PADRAO, baseDasOpcoes: acoes, passo: 50 });

  const ativos = filtrosAtivos([
    tipo && { id: 'tipo', rotulo: `Tipo: ${ROTULO_TIPO_ACAO[tipo]}`, onRemover: () => setTipo('') },
    vendor !== 'ambos' && { id: 'vendor', rotulo: `Bandeira: ${ROTULO_BANDEIRA[vendor]}`, onRemover: () => setVendor('ambos') },
    somenteAtivas && { id: 'ativas', rotulo: 'Somente ativas hoje', onRemover: () => setSomenteAtivas(false) },
  ]);
  const limparFiltrosDeTela = () => {
    setTipo('');
    setVendor('ambos');
    setSomenteAtivas(false);
    setBusca('');
  };

  const excluir = async () => {
    if (!aExcluir) return;
    setExcluindo(true);
    try {
      await api.delete(`/acoes/${aExcluir._id}`);
      notificar({ tipo: 'sucesso', titulo: 'Ação excluída' });
      setAExcluir(null);
      carregar();
    } catch (err) {
      notificar({ tipo: 'erro', titulo: 'Não foi possível excluir', descricao: err.response?.data?.error || err.message });
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <AppHeader
        actionsSlot={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setEmEdicao(null);
                setFormAberto(true);
              }}
            >
              <Plus aria-hidden /> Nova ação
            </Button>
            <MenuExportar titulo="Ações comerciais" filtros={ativos.map((a) => ({ rotulo: 'Filtro', valor: a.rotulo }))} tabela={tabela} linhasCompletas={acoes} desabilitado={carregando || !acoes.length} />
            <GerenciadorDeColunas {...tabela.propsDoGerenciador} />
          </>
        }
      />

      <PainelDeFiltros telaId="acoes" ativos={ativos} onLimparTudo={limparFiltrosDeTela} slotFixo={<SearchInput value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto, EAN ou código..." />}>
        <CampoDeFiltro rotulo="Tipo de ação">
          <Segmentado rotulo="Tipo de ação" opcoes={OPCOES_TIPO} valor={tipo} onChange={setTipo} className="h-10 items-center" />
        </CampoDeFiltro>
        <CampoDeFiltro rotulo="Bandeira">
          <Segmentado rotulo="Bandeira" opcoes={OPCOES_BANDEIRA} valor={vendor} onChange={setVendor} className="h-10 items-center" />
        </CampoDeFiltro>
        <CampoDeFiltro rotulo="Vigência">
          <div className="flex h-10 items-center gap-2">
            <Switch id="acoes-ativas" checked={somenteAtivas} onCheckedChange={setSomenteAtivas} />
            <Label htmlFor="acoes-ativas" className="text-sm text-neutral-700">
              Somente ativas hoje
            </Label>
          </div>
        </CampoDeFiltro>
      </PainelDeFiltros>

      <TabelaDeDados
        tabela={tabela}
        chaveDaLinha={(a) => a._id}
        carregando={carregando}
        erro={erro}
        aoTentarNovamente={carregar}
        temFiltroDeTela={ativos.length > 0 || Boolean(busca)}
        onLimparFiltrosDeTela={limparFiltrosDeTela}
        vazio={{
          mensagemVazio: 'Nenhuma ação cadastrada ainda',
          mensagemFiltrada: 'Nenhuma ação corresponde aos filtros',
          acao: (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setEmEdicao(null);
                setFormAberto(true);
              }}
            >
              <Plus aria-hidden /> Criar a primeira ação
            </Button>
          ),
        }}
      />

      <FormularioDeAcao
        open={formAberto}
        onOpenChange={setFormAberto}
        acao={emEdicao}
        produtos={produtos}
        onSalvo={() => {
          setFormAberto(false);
          setEmEdicao(null);
          carregar();
        }}
      />

      <ConfirmarExclusaoDialog
        open={Boolean(aExcluir)}
        onOpenChange={(v) => !v && setAExcluir(null)}
        alvo={aExcluir ? `a ação "${aExcluir.produto}"` : ''}
        consequencia={aExcluir ? `A ação de ${ROTULO_TIPO_ACAO[aExcluir.tipo] ?? aExcluir.tipo} a ${fmtMoeda(aExcluir.preco_acao)} (${fmtData(aExcluir.data_inicio)} → ${fmtData(aExcluir.data_fim)}) some das análises de eficácia e dos gráficos.` : ''}
        onConfirmar={excluir}
        confirmando={excluindo}
      />
    </div>
  );
}
