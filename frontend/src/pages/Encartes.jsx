import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, ChevronDown, ChevronRight, Loader2, Newspaper, Pencil, Plus, Tag, Trash2, X } from 'lucide-react';
import api from '../api/client';
import { useTituloDaPagina } from '../context/PaginaContext';
import { useVisao } from '../context/VisaoContext';
import { AppHeader } from '../components/layout/AppHeader';
import { PainelDeFiltros, CampoDeFiltro, filtrosAtivos } from '../components/filtros/PainelDeFiltros';
import { SearchInput } from '../components/filtros/SearchInput';
import { Segmentado, ROTULO_BANDEIRA } from '../components/filtros/Segmentado';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, Textarea } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '../components/ui/Dialog';
import { useToast } from '../components/ui/Toast';
import { ConfirmarExclusaoDialog } from '../components/dialogos/ConfirmarExclusaoDialog';
import { CampoDeFormulario } from '../components/formulario/CampoDeFormulario';
import { useFormulario } from '../components/formulario/useFormulario';
import { SeletorDeProdutos } from '../components/formulario/SeletorDeProdutos';
import { normEan } from '../config/acoes';
import { fmtData, fmtMoeda, hojeLocal, soData } from '../lib/formatar';
import { cn } from '../lib/cn';

const OPCOES_BANDEIRA_FILTRO = [
  { value: '', label: 'Todas' },
  { value: 'valemilk', label: 'Valemilk' },
  { value: 'valefish', label: 'Valefish' },
  { value: 'ambos', label: 'Ambas' },
];
const OPCOES_STATUS = [
  { value: '', label: 'Todos' },
  { value: 'ativo', label: 'Ativos' },
  { value: 'programado', label: 'Programados' },
  { value: 'encerrado', label: 'Encerrados' },
];
const ROTULO_VENDOR_ENCARTE = { ...ROTULO_BANDEIRA, ambos: 'Ambas' };

function statusDoEncarte(enc, hoje) {
  const ini = soData(enc.data_inicio);
  const fim = soData(enc.data_fim);
  if (!ini || !fim) return 'encerrado';
  if (hoje < ini) return 'programado';
  if (hoje > fim) return 'encerrado';
  return 'ativo';
}

// ─── Formulário ──────────────────────────────────────────────────────────────
function validar(v, itens) {
  const erros = {};
  if (!v.titulo.trim()) erros.titulo = 'Informe o título do encarte.';
  if (!v.data_inicio) erros.data_inicio = 'Informe a data de início.';
  if (!v.data_fim) erros.data_fim = 'Informe a data de fim.';
  if (v.data_inicio && v.data_fim && v.data_fim < v.data_inicio) erros.data_fim = 'A data de fim deve ser igual ou posterior ao início.';
  if (itens.length === 0) erros.itens = 'Adicione ao menos um produto.';
  const semPreco = itens.find((i) => {
    const n = Number(String(i.preco_oferta).replace(',', '.'));
    return !i.preco_oferta || Number.isNaN(n) || n <= 0;
  });
  if (semPreco) erros.itens = `Informe o preço de oferta de: ${semPreco.produto}`;
  return erros;
}

function FormularioDeEncarte({ open, onOpenChange, encarte, produtos, onSalvo }) {
  const editando = Boolean(encarte?._id);
  const [itens, setItens] = useState([]);
  const valoresIniciais = useMemo(
    () => ({
      titulo: encarte?.titulo || '',
      data_inicio: soData(encarte?.data_inicio) || '',
      data_fim: soData(encarte?.data_fim) || '',
      vendor: encarte?.vendor || 'valemilk',
      observacao: encarte?.observacao || '',
    }),
    [encarte]
  );
  const form = useFormulario({ valoresIniciais, validar: (v) => validar(v, itens) });
  const { resetar } = form;

  useEffect(() => {
    if (!open) return;
    resetar(valoresIniciais);
    setItens(encarte?.itens?.map((i) => ({ ...i, preco_oferta: String(i.preco_oferta).replace('.', ',') })) || []);
  }, [open, valoresIniciais, encarte, resetar]);

  const adicionar = (p) => setItens((l) => (l.some((i) => i.ean === p.ean) ? l : [...l, { ean: p.ean, cod_interno: p.cod_interno || '', produto: p.produto, preco_oferta: '' }]));
  const adicionarVarios = (lista) => setItens((l) => [...l, ...lista.filter((p) => !l.some((i) => i.ean === p.ean)).map((p) => ({ ean: p.ean, cod_interno: p.cod_interno || '', produto: p.produto, preco_oferta: '' }))]);
  const remover = (ean) => setItens((l) => l.filter((i) => i.ean !== ean));
  const atualizarPreco = (ean, valor) => setItens((l) => l.map((i) => (i.ean === ean ? { ...i, preco_oferta: valor } : i)));

  const salvar = async (v) => {
    const payload = { ...v, itens: itens.map((i) => ({ ean: i.ean, cod_interno: i.cod_interno, produto: i.produto, preco_oferta: Number(String(i.preco_oferta).replace(',', '.')) })) };
    try {
      if (editando) await api.put(`/encartes/${encarte._id}`, payload);
      else await api.post('/encartes', payload);
      onSalvo(editando);
    } catch (err) {
      form.setErros({ _geral: err.response?.data?.error || err.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader onClose={() => onOpenChange(false)}>
        <DialogTitle>{editando ? 'Editar encarte' : 'Novo encarte negociado'}</DialogTitle>
        <DialogDescription>Cada item do encarte vira uma ação comercial do tipo encarte no período informado.</DialogDescription>
      </DialogHeader>
      <form onSubmit={form.submeter(salvar)} noValidate className="flex min-h-0 flex-1 flex-col">
        <DialogBody className="flex flex-col gap-4">
          <CampoDeFormulario rotulo="Título do encarte" htmlFor="enc-titulo" obrigatorio erro={form.erros.titulo}>
            <Input id="enc-titulo" placeholder="Ex.: Encarte Maio Semana 1" className="bg-neutral-50" {...form.propsDoCampo('titulo')} />
          </CampoDeFormulario>

          <div className="grid grid-cols-2 gap-3">
            <CampoDeFormulario rotulo="Início" htmlFor="enc-inicio" obrigatorio erro={form.erros.data_inicio}>
              <Input id="enc-inicio" type="date" className="bg-neutral-50" {...form.propsDoCampo('data_inicio')} />
            </CampoDeFormulario>
            <CampoDeFormulario rotulo="Fim" htmlFor="enc-fim" obrigatorio erro={form.erros.data_fim}>
              <Input id="enc-fim" type="date" min={form.valores.data_inicio || undefined} className="bg-neutral-50" {...form.propsDoCampo('data_fim')} />
            </CampoDeFormulario>
          </div>

          <CampoDeFormulario rotulo="Bandeira">
            <Segmentado rotulo="Bandeira" opcoes={OPCOES_BANDEIRA_FILTRO.slice(1)} valor={form.valores.vendor} onChange={(v) => form.definir('vendor', v)} />
          </CampoDeFormulario>

          <CampoDeFormulario rotulo="Produtos" obrigatorio erro={form.erros.itens} ajuda={itens.length ? `${itens.length} produto(s) no encarte` : undefined}>
            <div aria-invalid={form.erros.itens ? true : undefined} className="flex flex-col gap-2">
              {itens.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {itens.map((item) => (
                    <li key={item.ean} className="flex items-center gap-2 rounded-sm border border-secondary/20 bg-secondary/5 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-800">{item.produto}</p>
                        <p className="text-xs text-neutral-400">Cód. {item.cod_interno || normEan(item.ean)}</p>
                      </div>
                      <div className="relative w-28 shrink-0">
                        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400">R$</span>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={item.preco_oferta}
                          onChange={(e) => atualizarPreco(item.ean, e.target.value)}
                          placeholder="0,00"
                          aria-label={`Preço de oferta de ${item.produto}`}
                          className="h-9 pl-8 pr-2 text-right font-semibold"
                        />
                      </div>
                      <button type="button" onClick={() => remover(item.ean)} aria-label={`Remover ${item.produto}`} className="rounded-sm p-1.5 text-neutral-400 hover:text-danger focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-secondary/30">
                        <X className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <SeletorDeProdutos produtos={produtos} selecionados={itens.map((i) => i.ean)} onAdicionar={adicionar} onAdicionarVarios={adicionarVarios} />
            </div>
          </CampoDeFormulario>

          <CampoDeFormulario rotulo="Observação" htmlFor="enc-obs">
            <Textarea id="enc-obs" rows={2} placeholder="Detalhes adicionais..." className="bg-neutral-50" {...form.propsDoCampo('observacao')} />
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
            {editando ? 'Salvar' : 'Criar encarte'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

// ─── Cartão ──────────────────────────────────────────────────────────────────
function EncarteCard({ enc, status, onEditar, onExcluir }) {
  const [expandido, setExpandido] = useState(false);
  const faixa = { ativo: 'bg-secondary', programado: 'bg-warning', encerrado: 'bg-neutral-200' }[status];
  const vendorVariant = { valemilk: 'info', valefish: 'neutro', ambos: 'secondary' }[enc.vendor] ?? 'neutro';

  return (
    <article className={cn('superficie overflow-hidden', status === 'ativo' && 'border-secondary/30')}>
      <div className={cn('h-1', faixa)} aria-hidden />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge variant={vendorVariant}>{ROTULO_VENDOR_ENCARTE[enc.vendor] ?? enc.vendor}</Badge>
              {status === 'ativo' && <Badge variant="sucesso">Ativo</Badge>}
              {status === 'programado' && <Badge variant="alerta">Programado</Badge>}
              {status === 'encerrado' && <Badge variant="neutro">Encerrado</Badge>}
            </div>
            <h3 className="truncate text-base font-semibold text-neutral-900">{enc.titulo}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
              <Calendar className="size-3" aria-hidden />
              {fmtData(enc.data_inicio)} → {fmtData(enc.data_fim)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={onEditar} aria-label={`Editar ${enc.titulo}`}>
              <Pencil />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onExcluir} aria-label={`Excluir ${enc.titulo}`} className="hover:text-danger">
              <Trash2 />
            </Button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpandido((e) => !e)}
          aria-expanded={expandido}
          className="mt-3 flex w-full items-center justify-between rounded-sm bg-neutral-50 px-3 py-2 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-secondary/30"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-neutral-700">
            <Tag className="size-3.5 text-secondary" aria-hidden />
            {enc.itens?.length || 0} produto(s)
          </span>
          {expandido ? <ChevronDown className="size-4 text-neutral-400" aria-hidden /> : <ChevronRight className="size-4 text-neutral-400" aria-hidden />}
        </button>

        {expandido && enc.itens?.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1.5">
            {enc.itens.map((item) => (
              <li key={item.ean} className="flex items-center justify-between rounded-sm bg-neutral-50 px-3 py-2">
                <div className="min-w-0 flex-1 pr-3">
                  <p className="truncate text-sm text-neutral-800">{item.produto}</p>
                  <p className="text-xs text-neutral-400">Cód. {item.cod_interno || normEan(item.ean)}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-secondary">{fmtMoeda(item.preco_oferta)}</p>
              </li>
            ))}
          </ul>
        )}

        {enc.observacao && <p className="mt-2 px-1 text-xs italic text-neutral-500">{enc.observacao}</p>}
      </div>
    </article>
  );
}

// ─── Página ──────────────────────────────────────────────────────────────────
export default function Encartes() {
  useTituloDaPagina('Encartes', 'Ofertas negociadas com a rede');
  const { notificar } = useToast();
  const visao = useVisao();
  const hoje = hojeLocal();

  const [encartes, setEncartes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [produtos, setProdutos] = useState([]);

  const [busca, setBusca] = useState('');
  const [vendor, setVendor] = useState('');
  const [status, setStatus] = useState('');

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
      const res = await api.get(`/encartes${vendor ? `?vendor=${vendor}` : ''}`);
      setEncartes(res.data.data || []);
    } catch (err) {
      setErro(err.response?.data?.error || err.message);
    } finally {
      setCarregando(false);
    }
  }, [vendor]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return encartes.filter((e) => {
      if (status && statusDoEncarte(e, hoje) !== status) return false;
      if (q && !(e.titulo?.toLowerCase().includes(q) || e.itens?.some((i) => i.produto?.toLowerCase().includes(q) || normEan(i.ean).includes(q)))) return false;
      return true;
    });
  }, [encartes, busca, status, hoje]);

  const ativosAgora = filtrados.filter((e) => statusDoEncarte(e, hoje) === 'ativo');
  const demais = filtrados.filter((e) => statusDoEncarte(e, hoje) !== 'ativo');

  const ativos = filtrosAtivos([
    vendor && { id: 'vendor', rotulo: `Bandeira: ${ROTULO_VENDOR_ENCARTE[vendor]}`, onRemover: () => setVendor('') },
    status && { id: 'status', rotulo: `Status: ${OPCOES_STATUS.find((o) => o.value === status)?.label}`, onRemover: () => setStatus('') },
  ]);
  const limparTudo = () => {
    setVendor('');
    setStatus('');
    setBusca('');
  };
  const temFiltro = ativos.length > 0 || Boolean(busca);

  const abrirNovo = () => {
    setEmEdicao(null);
    setFormAberto(true);
  };

  const excluir = async () => {
    if (!aExcluir) return;
    setExcluindo(true);
    try {
      await api.delete(`/encartes/${aExcluir._id}`);
      notificar({ tipo: 'sucesso', titulo: 'Encarte excluído' });
      setAExcluir(null);
      carregar();
    } catch (err) {
      notificar({ tipo: 'erro', titulo: 'Não foi possível excluir', descricao: err.response?.data?.error || err.message });
    } finally {
      setExcluindo(false);
    }
  };

  const lista = (itens) => itens.map((enc) => <EncarteCard key={enc._id} enc={enc} status={statusDoEncarte(enc, hoje)} onEditar={() => { setEmEdicao(enc); setFormAberto(true); }} onExcluir={() => setAExcluir(enc)} />);

  return (
    <div className="flex flex-col gap-6">
      <AppHeader
        actionsSlot={
          <Button variant="secondary" onClick={abrirNovo}>
            <Plus aria-hidden /> Novo encarte
          </Button>
        }
      />

      <PainelDeFiltros telaId="encartes" ativos={ativos} onLimparTudo={limparTudo} slotFixo={<SearchInput value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por título ou produto..." />}>
        <CampoDeFiltro rotulo="Bandeira">
          <Segmentado rotulo="Bandeira" opcoes={OPCOES_BANDEIRA_FILTRO} valor={vendor} onChange={setVendor} className="h-10 items-center" />
        </CampoDeFiltro>
        <CampoDeFiltro rotulo="Status">
          <Segmentado rotulo="Status" opcoes={OPCOES_STATUS} valor={status} onChange={setStatus} className="h-10 items-center" />
        </CampoDeFiltro>
      </PainelDeFiltros>

      {carregando ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : erro ? (
        <div className="superficie p-8 text-center">
          <p className="text-sm font-medium text-danger">Não foi possível carregar os encartes</p>
          <p className="mt-1 text-xs text-neutral-500">{erro}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={carregar}>
            Tentar novamente
          </Button>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="superficie flex flex-col items-center gap-3 p-12 text-center">
          <Newspaper className="size-10 text-neutral-300" aria-hidden />
          <p className="text-base font-medium text-neutral-700">{temFiltro ? 'Nenhum encarte corresponde aos filtros' : 'Nenhum encarte cadastrado ainda'}</p>
          {temFiltro ? (
            <Button variant="secondary" size="sm" onClick={limparTudo}>
              Limpar filtros
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={abrirNovo}>
              <Plus aria-hidden /> Criar o primeiro encarte
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {ativosAgora.length > 0 && (
            <>
              <p className="col-span-full px-1 text-[11px] font-bold uppercase tracking-widest text-neutral-400">Ativos agora</p>
              {lista(ativosAgora)}
            </>
          )}
          {demais.length > 0 && (
            <>
              <p className="col-span-full mt-2 px-1 text-[11px] font-bold uppercase tracking-widest text-neutral-400">{ativosAgora.length > 0 ? 'Outros' : 'Todos'}</p>
              {lista(demais)}
            </>
          )}
        </div>
      )}

      {visao === 'celular' && (
        <button
          type="button"
          onClick={abrirNovo}
          aria-label="Novo encarte"
          className="fixed bottom-20 right-5 z-20 flex size-14 items-center justify-center rounded-full bg-secondary text-white shadow-lg hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-secondary/40"
        >
          <Plus className="size-6" />
        </button>
      )}

      <FormularioDeEncarte
        open={formAberto}
        onOpenChange={setFormAberto}
        encarte={emEdicao}
        produtos={produtos}
        onSalvo={(editou) => {
          setFormAberto(false);
          setEmEdicao(null);
          notificar({ tipo: 'sucesso', titulo: editou ? 'Encarte atualizado' : 'Encarte criado', descricao: 'As ações comerciais dos itens foram sincronizadas.' });
          carregar();
        }}
      />

      <ConfirmarExclusaoDialog
        open={Boolean(aExcluir)}
        onOpenChange={(v) => !v && setAExcluir(null)}
        alvo={aExcluir ? `o encarte "${aExcluir.titulo}"` : ''}
        consequencia={aExcluir ? `As ${aExcluir.itens?.length || 0} ação(ões) comercial(is) geradas por este encarte também são removidas das análises e dos gráficos.` : ''}
        onConfirmar={excluir}
        confirmando={excluindo}
      />
    </div>
  );
}
