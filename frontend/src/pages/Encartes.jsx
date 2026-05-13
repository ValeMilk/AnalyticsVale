import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus, Trash2, Edit2, X, Search, ChevronDown,
  ChevronRight, Newspaper, Calendar, Tag, Check,
} from 'lucide-react';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

const fmt = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '';

// ─── Formulário (criação / edição) ──────────────────────────────────────────
function EncarteForm({ encarte, onClose, onSave }) {
  const isEdit = !!encarte?._id;
  const [form, setForm] = useState({
    titulo: encarte?.titulo || '',
    data_inicio: encarte?.data_inicio?.slice(0, 10) || '',
    data_fim: encarte?.data_fim?.slice(0, 10) || '',
    vendor: encarte?.vendor || 'valemilk',
    observacao: encarte?.observacao || '',
  });
  const [saving, setSaving] = useState(false);

  // Produtos
  const [todosProdutos, setTodosProdutos] = useState([]);
  const [itens, setItens] = useState(
    encarte?.itens?.map(i => ({ ...i, preco_oferta: String(i.preco_oferta) })) || []
  );

  // Busca / filtro de produto
  const [busca, setBusca] = useState('');
  const [subcatAberta, setSubcatAberta] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    api.get('/produtos').then(r => setTodosProdutos(r.data.data || [])).catch(() => {});
  }, []);

  // Fechar busca ao clicar fora
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Subcategorias únicas
  const subcategorias = useMemo(() => {
    const map = {};
    todosProdutos.forEach(p => {
      const sub = p.subcategoria || 'Outros';
      if (!map[sub]) map[sub] = [];
      map[sub].push(p);
    });
    // Ordena
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [todosProdutos]);

  // Filtro de busca dentro de subcategorias
  const subcatsFiltered = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    if (!termo) return subcategorias;
    return subcategorias
      .map(([sub, prods]) => [sub, prods.filter(p =>
        p.produto?.toLowerCase().includes(termo) ||
        p.ean?.includes(busca) ||
        p.cod_interno?.toString().includes(busca)
      )])
      .filter(([, prods]) => prods.length > 0);
  }, [busca, subcategorias]);

  const jaAdicionado = (ean) => itens.some(i => i.ean === ean);

  const addItem = (p) => {
    if (jaAdicionado(p.ean)) return;
    setItens(prev => [...prev, {
      ean: p.ean,
      cod_interno: p.cod_interno || '',
      produto: p.produto,
      preco_oferta: '',
    }]);
    setShowSearch(false);
    setBusca('');
  };

  const removeItem = (ean) => setItens(prev => prev.filter(i => i.ean !== ean));

  const updatePreco = (ean, val) => {
    setItens(prev => prev.map(i => i.ean === ean ? { ...i, preco_oferta: val } : i));
  };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) return alert('Informe o título do encarte');
    if (itens.length === 0) return alert('Adicione ao menos um produto');
    const semPreco = itens.find(i => !i.preco_oferta || isNaN(Number(i.preco_oferta)));
    if (semPreco) return alert(`Informe o preço de oferta para: ${semPreco.produto}`);

    setSaving(true);
    try {
      const payload = {
        ...form,
        itens: itens.map(i => ({ ...i, preco_oferta: Number(i.preco_oferta) })),
      };
      if (isEdit) {
        await api.put(`/encartes/${encarte._id}`, payload);
      } else {
        await api.post('/encartes', payload);
      }
      onSave();
    } catch (err) {
      alert('Erro ao salvar: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Sheet no mobile, modal no desktop */}
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[calc(100dvh-4.5rem)] sm:max-h-[90dvh] flex flex-col shadow-2xl mb-16 sm:mb-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 shrink-0">
          {/* Drag handle mobile */}
          <div className="absolute left-1/2 -translate-x-1/2 top-3 w-10 h-1 bg-slate-200 rounded-full sm:hidden" />
          <h2 className="text-base font-bold text-slate-900">
            {isEdit ? 'Editar Encarte' : 'Novo Encarte Negociado'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body scrollável */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 space-y-4">

            {/* Título */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Título do Encarte *
              </label>
              <input
                type="text"
                value={form.titulo}
                onChange={set('titulo')}
                required
                placeholder="Ex: Encarte Maio Semana 1"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:border-royal focus:ring-2 focus:ring-royal/20 focus:outline-none transition-all"
              />
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Data Início *
                </label>
                <input type="date" value={form.data_inicio} onChange={set('data_inicio')} required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-slate-900 text-sm focus:border-royal focus:ring-2 focus:ring-royal/20 focus:outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Data Fim *
                </label>
                <input type="date" value={form.data_fim} onChange={set('data_fim')} required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-slate-900 text-sm focus:border-royal focus:ring-2 focus:ring-royal/20 focus:outline-none transition-all" />
              </div>
            </div>

            {/* Bandeira */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Bandeira
              </label>
              <div className="flex gap-2">
                {[
                  { v: 'valemilk', l: 'Valemilk' },
                  { v: 'valefish', l: 'Valefish' },
                  { v: 'ambos', l: 'Ambas' },
                ].map(({ v, l }) => (
                  <button key={v} type="button"
                    onClick={() => setForm(f => ({ ...f, vendor: v }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      form.vendor === v
                        ? 'border-royal bg-royal text-white'
                        : 'border-slate-200 text-slate-500 bg-slate-50'
                    }`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Produtos ─────────────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Produtos *
                </label>
                {itens.length > 0 && (
                  <span className="text-xs text-royal font-semibold">{itens.length} produto(s)</span>
                )}
              </div>

              {/* Itens adicionados */}
              {itens.length > 0 && (
                <div className="space-y-2 mb-3">
                  {itens.map(item => (
                    <div key={item.ean} className="flex items-center gap-2 bg-royal/5 border border-royal/20 rounded-xl px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{item.produto}</p>
                        <p className="text-xs text-slate-400">Cód: {item.cod_interno || item.ean}</p>
                      </div>
                      {/* Preço de oferta */}
                      <div className="relative shrink-0 w-24">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.preco_oferta}
                          onChange={e => updatePreco(item.ean, e.target.value)}
                          placeholder="0,00"
                          className="w-full bg-white border border-royal/30 rounded-lg pl-7 pr-2 py-1.5 text-sm text-slate-900 font-semibold focus:border-royal focus:outline-none text-right"
                        />
                      </div>
                      <button type="button" onClick={() => removeItem(item.ean)}
                        className="p-1.5 text-slate-300 hover:text-red-400 transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Busca + seletor de produtos */}
              <div ref={searchRef}>
                <button
                  type="button"
                  onClick={() => setShowSearch(s => !s)}
                  className="w-full flex items-center gap-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl px-4 py-3 text-slate-400 hover:border-royal hover:text-royal transition-all text-sm font-medium"
                >
                  <Plus size={18} />
                  Adicionar produto
                </button>

                {showSearch && (
                  <div className="mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    {/* Input busca */}
                    <div className="p-3 border-b border-slate-100">
                      <div className="relative">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          autoFocus
                          value={busca}
                          onChange={e => setBusca(e.target.value)}
                          placeholder="Buscar produto ou código..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:border-royal focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Lista de subcategorias / produtos */}
                    <div className="max-h-64 overflow-y-auto">
                      {subcatsFiltered.length === 0 && (
                        <p className="text-center text-slate-400 text-sm py-6">Nenhum produto encontrado</p>
                      )}
                      {subcatsFiltered.map(([sub, prods]) => (
                        <div key={sub}>
                          {/* Header subcategoria */}
                          <button
                            type="button"
                            onClick={() => setSubcatAberta(s => s === sub ? null : sub)}
                            className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-100 text-left"
                          >
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{sub}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-400">{prods.length}</span>
                              {subcatAberta === sub
                                ? <ChevronDown size={14} className="text-slate-400" />
                                : <ChevronRight size={14} className="text-slate-400" />
                              }
                            </div>
                          </button>

                          {/* Produtos da subcategoria */}
                          {(subcatAberta === sub || busca.trim()) && prods.map(p => (
                            <button
                              type="button"
                              key={p.ean}
                              onClick={() => addItem(p)}
                              disabled={jaAdicionado(p.ean)}
                              className={`w-full flex items-center justify-between px-4 py-3 border-b border-slate-50 text-left transition-colors ${
                                jaAdicionado(p.ean)
                                  ? 'opacity-40 cursor-default'
                                  : 'hover:bg-royal/5 active:bg-royal/10'
                              }`}
                            >
                              <div className="flex-1 min-w-0 pr-2">
                                <p className="text-sm text-slate-800 truncate">{p.produto}</p>
                                <p className="text-xs text-slate-400">Cód: {p.cod_interno || '—'} · {p.ean}</p>
                              </div>
                              {jaAdicionado(p.ean)
                                ? <Check size={16} className="text-royal shrink-0" />
                                : <Plus size={16} className="text-slate-300 shrink-0" />
                              }
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Observação */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Observação
              </label>
              <textarea value={form.observacao} onChange={set('observacao')} rows={2}
                placeholder="Detalhes adicionais..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:border-royal focus:ring-2 focus:ring-royal/20 focus:outline-none resize-none transition-all" />
            </div>
          </div>

          {/* Footer fixo */}
          <div className="px-5 pb-6 pt-3 border-t border-slate-100 shrink-0 grid grid-cols-2 gap-3">
            <button type="button" onClick={onClose}
              className="py-3.5 rounded-xl border-2 border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="py-3.5 rounded-xl bg-royal hover:bg-royal/90 active:bg-royal/80 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
              {saving ? 'Salvando...' : (isEdit ? 'Salvar' : 'Criar Encarte')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Card de encarte ─────────────────────────────────────────────────────────
function EncarteCard({ enc, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const hoje = new Date();
  const inicio = new Date(enc.data_inicio);
  const fim = new Date(enc.data_fim);
  const ativo = hoje >= inicio && hoje <= fim;
  const futuro = inicio > hoje;

  const vendorColor = {
    valemilk: 'bg-blue-100 text-blue-700',
    valefish: 'bg-cyan-100 text-cyan-700',
    ambos: 'bg-purple-100 text-purple-700',
  }[enc.vendor] || 'bg-slate-100 text-slate-500';

  const vendorLabel = { valemilk: 'Valemilk', valefish: 'Valefish', ambos: 'Ambas' }[enc.vendor];

  return (
    <div className={`bg-white rounded-2xl border ${ativo ? 'border-royal/30' : 'border-slate-200'} overflow-hidden shadow-sm`}>
      {/* Faixa de status */}
      {ativo && <div className="h-1 bg-royal" />}
      {futuro && <div className="h-1 bg-amber-400" />}
      {!ativo && !futuro && <div className="h-1 bg-slate-200" />}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${vendorColor}`}>
                {vendorLabel}
              </span>
              {ativo && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  Ativo
                </span>
              )}
              {futuro && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  Programado
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 truncate">{enc.titulo}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-slate-400 text-xs">
              <Calendar size={12} />
              <span>{fmtDate(enc.data_inicio?.slice(0, 10))} → {fmtDate(enc.data_fim?.slice(0, 10))}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onEdit}
              className="p-2 rounded-xl text-slate-400 hover:text-royal hover:bg-royal/10 transition-colors">
              <Edit2 size={17} />
            </button>
            <button onClick={onDelete}
              className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 size={17} />
            </button>
          </div>
        </div>

        {/* Resumo produtos */}
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-between mt-3 py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Tag size={14} className="text-royal" />
            <span className="text-sm font-medium text-slate-700">{enc.itens?.length || 0} produto(s)</span>
          </div>
          {expanded
            ? <ChevronDown size={15} className="text-slate-400" />
            : <ChevronRight size={15} className="text-slate-400" />
          }
        </button>

        {expanded && enc.itens?.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {enc.itens.map(item => (
              <div key={item.ean} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-sm text-slate-800 truncate">{item.produto}</p>
                  <p className="text-xs text-slate-400">Cód: {item.cod_interno || '—'}</p>
                </div>
                <p className="text-sm font-bold text-royal shrink-0">{fmt(item.preco_oferta)}</p>
              </div>
            ))}
          </div>
        )}

        {enc.observacao && (
          <p className="mt-2 text-xs text-slate-400 italic px-1">{enc.observacao}</p>
        )}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Encartes() {
  const [encartes, setEncartes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editEncarte, setEditEncarte] = useState(null);
  const [filtroVendor, setFiltroVendor] = useState('');

  const fetchEncartes = async () => {
    setLoading(true);
    try {
      const params = filtroVendor ? `?vendor=${filtroVendor}` : '';
      const res = await api.get(`/encartes${params}`);
      setEncartes(res.data.data || []);
    } catch (err) {
      console.error('Erro ao carregar encartes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEncartes(); }, [filtroVendor]);

  const handleDelete = async (id) => {
    if (!confirm('Excluir este encarte?')) return;
    try {
      await api.delete(`/encartes/${id}`);
      fetchEncartes();
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const abrirForm = (enc = null) => {
    setEditEncarte(enc);
    setShowForm(true);
  };

  const fecharForm = () => {
    setShowForm(false);
    setEditEncarte(null);
  };

  const ativos = encartes.filter(e => {
    const hoje = new Date();
    return new Date(e.data_inicio) <= hoje && new Date(e.data_fim) >= hoje;
  });
  const demais = encartes.filter(e => {
    const hoje = new Date();
    return !(new Date(e.data_inicio) <= hoje && new Date(e.data_fim) >= hoje);
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 sm:pb-8">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-royal/10 flex items-center justify-center">
            <Newspaper size={20} className="text-royal" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Encartes</h1>
            <p className="text-xs text-slate-400">Ofertas negociadas</p>
          </div>
        </div>
        <button
          onClick={() => abrirForm()}
          className="flex items-center gap-2 bg-royal hover:bg-royal/90 active:bg-royal/80 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Novo</span>
        </button>
      </div>

      {/* Filtro bandeira */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {[
          { v: '', l: 'Todos' },
          { v: 'valemilk', l: 'Valemilk' },
          { v: 'valefish', l: 'Valefish' },
          { v: 'ambos', l: 'Ambas' },
        ].map(({ v, l }) => (
          <button key={v} onClick={() => setFiltroVendor(v)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              filtroVendor === v
                ? 'bg-royal text-white border-royal'
                : 'bg-white text-slate-500 border-slate-200 hover:border-royal hover:text-royal'
            }`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : encartes.length === 0 ? (
        <div className="text-center py-16">
          <Newspaper size={40} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Nenhum encarte cadastrado ainda</p>
          <button onClick={() => abrirForm()}
            className="mt-4 text-royal text-sm font-semibold hover:underline">
            + Criar primeiro encarte
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {ativos.length > 0 && (
            <>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Ativos agora</p>
              {ativos.map(enc => (
                <EncarteCard key={enc._id} enc={enc}
                  onEdit={() => abrirForm(enc)}
                  onDelete={() => handleDelete(enc._id)} />
              ))}
            </>
          )}
          {demais.length > 0 && (
            <>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 mt-2">
                {ativos.length > 0 ? 'Outros' : 'Todos'}
              </p>
              {demais.map(enc => (
                <EncarteCard key={enc._id} enc={enc}
                  onEdit={() => abrirForm(enc)}
                  onDelete={() => handleDelete(enc._id)} />
              ))}
            </>
          )}
        </div>
      )}

      {/* Botão flutuante mobile — acima da bottom nav */}
      <button
        onClick={() => abrirForm()}
        className="sm:hidden fixed bottom-20 right-5 w-14 h-14 bg-royal hover:bg-royal/90 text-white rounded-full shadow-xl flex items-center justify-center transition-colors z-40"
      >
        <Plus size={24} />
      </button>

      {/* Form modal */}
      {showForm && (
        <EncarteForm
          encarte={editEncarte}
          onClose={fecharForm}
          onSave={() => { fecharForm(); fetchEncartes(); }}
        />
      )}
    </div>
  );
}
