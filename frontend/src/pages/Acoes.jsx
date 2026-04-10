import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, Tag, X, Search, ChevronDown } from 'lucide-react';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

const TIPOS = [
  { value: 'encarte', label: 'Encarte', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  { value: 'oferta_interna', label: 'Oferta Interna', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  { value: 'rebaixa', label: 'Rebaixa', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
];

const tipoInfo = (tipo) => TIPOS.find(t => t.value === tipo) || TIPOS[0];
const fmt = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function FormModal({ acao, onClose, onSave }) {
  const isEdit = !!acao?._id;
  const [form, setForm] = useState({
    tipo: acao?.tipo || 'encarte',
    preco_normal: acao?.preco_normal || '',
    preco_acao: acao?.preco_acao || '',
    data_inicio: acao?.data_inicio?.slice(0, 10) || '',
    data_fim: acao?.data_fim?.slice(0, 10) || '',
    vendor: acao?.vendor || 'ambos',
    observacao: acao?.observacao || '',
  });
  const [saving, setSaving] = useState(false);
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  // Multi-select: lista de produtos selecionados
  const [selecionados, setSelecionados] = useState(
    isEdit ? [{ ean: acao.ean, produto: acao.produto, cod_interno: acao.cod_interno || '' }] : []
  );
  const dropdownRef = useRef(null);

  useEffect(() => {
    api.get('/produtos').then(res => setProdutos(res.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProdutos = produtos.filter(p => {
    // Não mostrar já selecionados
    if (selecionados.some(s => s.ean === p.ean)) return false;
    const termo = busca.toLowerCase();
    return p.produto?.toLowerCase().includes(termo) ||
      p.ean?.includes(busca) ||
      p.cod_interno?.toString().includes(busca);
  }).slice(0, 50);

  const addProduto = (p) => {
    setSelecionados([...selecionados, { ean: p.ean, produto: p.produto, cod_interno: p.cod_interno || '' }]);
    setBusca('');
    setShowDropdown(false);
  };

  const removeProduto = (ean) => {
    setSelecionados(selecionados.filter(s => s.ean !== ean));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selecionados.length === 0) {
      alert('Selecione ao menos um produto');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        preco_normal: form.preco_normal ? Number(form.preco_normal) : null,
        preco_acao: Number(form.preco_acao),
        produtos: selecionados,
      };
      if (isEdit) {
        // Edição: atualiza só o registro individual
        await api.put(`/acoes/${acao._id}`, {
          ...form,
          ean: selecionados[0].ean,
          produto: selecionados[0].produto,
          cod_interno: selecionados[0].cod_interno,
          preco_normal: payload.preco_normal,
          preco_acao: payload.preco_acao,
        });
      } else {
        await api.post('/acoes', payload);
      }
      onSave();
    } catch (err) {
      console.error('Erro ao salvar ação:', err);
      alert('Erro ao salvar: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">{acao?._id ? 'Editar' : 'Nova'} Ação Comercial</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Tipo</label>
            <div className="flex gap-2">
              {TIPOS.map(t => (
                <button type="button" key={t.value} onClick={() => setForm({ ...form, tipo: t.value })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${form.tipo === t.value ? t.color : 'border-slate-300 text-slate-500 hover:text-slate-900'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative col-span-1" ref={dropdownRef}>
              <label className="block text-sm text-slate-500 mb-1">{isEdit ? 'Produto *' : 'Produtos *'}</label>
              {/* Produtos selecionados */}
              {selecionados.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selecionados.map(s => (
                    <span key={s.ean} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-royal/10 text-royal text-xs border border-royal/20">
                      <span className="max-w-[140px] truncate">{s.produto}</span>
                      <span className="text-royal/70">#{s.cod_interno || s.ean}</span>
                      {!(isEdit) && <button type="button" onClick={() => removeProduto(s.ean)} className="ml-0.5 hover:text-red-400"><X size={12} /></button>}
                    </span>
                  ))}
                </div>
              )}
              {/* Input de busca (sempre visível em criação, oculto em edição) */}
              {!isEdit && (
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input value={busca} onChange={(e) => { setBusca(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Buscar por nome ou código..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-8 py-2 text-slate-900 text-sm focus:border-royal focus:outline-none" />
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              )}
              {showDropdown && filteredProdutos.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {filteredProdutos.map(p => (
                    <button type="button" key={p.ean} onClick={() => addProduto(p)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-royal/10 transition-colors border-b border-slate-100 last:border-0">
                      <span className="text-slate-900">{p.produto}</span>
                      <span className="text-slate-400 ml-2 text-xs">Cód: {p.cod_interno || '—'}</span>
                    </button>
                  ))}
                </div>
              )}
              {selecionados.length > 0 && !isEdit && (
                <p className="text-xs text-royal mt-1">{selecionados.length} produto(s) selecionado(s)</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Bandeira</label>
              <select value={form.vendor} onChange={set('vendor')}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-royal focus:outline-none">
                <option value="ambos">Todas</option>
                <option value="valemilk">Valemilk</option>
                <option value="valefish">Valefish</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-500 mb-1">Preço Normal</label>
              <input type="number" step="0.01" value={form.preco_normal} onChange={set('preco_normal')} placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-royal focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Preço da Ação *</label>
              <input type="number" step="0.01" value={form.preco_acao} onChange={set('preco_acao')} required placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-royal focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-500 mb-1">Data Início *</label>
              <input type="date" value={form.data_inicio} onChange={set('data_inicio')} required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-royal focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Data Fim *</label>
              <input type="date" value={form.data_fim} onChange={set('data_fim')} required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-royal focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-500 mb-1">Observação</label>
            <textarea value={form.observacao} onChange={set('observacao')} rows={2} placeholder="Detalhes adicionais..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-royal focus:outline-none resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-500 hover:text-slate-900 text-sm font-medium">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-lg bg-royal hover:bg-royal/90 text-white text-sm font-medium disabled:opacity-50">
              {saving ? 'Salvando...' : (acao?._id ? 'Atualizar' : 'Criar Ação')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Acoes() {
  const [acoes, setAcoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAcao, setEditAcao] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('');

  const fetchAcoes = async () => {
    setLoading(true);
    try {
      const params = filtroTipo ? `?tipo=${filtroTipo}` : '';
      const res = await api.get(`/acoes${params}`);
      setAcoes(res.data.data);
    } catch (err) {
      console.error('Erro ao carregar ações:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAcoes(); }, [filtroTipo]);

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta ação?')) return;
    try {
      await api.delete(`/acoes/${id}`);
      fetchAcoes();
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  const openEdit = (acao) => { setEditAcao(acao); setShowModal(true); };
  const openNew = () => { setEditAcao(null); setShowModal(true); };
  const onSave = () => { setShowModal(false); setEditAcao(null); fetchAcoes(); };

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ações Comerciais</h1>
          <p className="text-slate-500 mt-1">Cadastre encartes, ofertas internas e rebaixas</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-royal hover:bg-royal/90 text-white rounded-xl text-sm font-medium transition-colors">
          <Plus size={18} /> Nova Ação
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setFiltroTipo('')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!filtroTipo ? 'bg-royal/10 text-royal border border-royal/20' : 'text-slate-500 hover:text-slate-900 border border-slate-200'}`}>
          Todos
        </button>
        {TIPOS.map(t => (
          <button key={t.value} onClick={() => setFiltroTipo(t.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${filtroTipo === t.value ? t.color : 'border-slate-200 text-slate-500 hover:text-slate-900'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="space-y-3">
          {acoes.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
              <Tag size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-400 text-lg">Nenhuma ação cadastrada</p>
              <p className="text-slate-300 text-sm mt-1">Clique em "Nova Ação" para começar</p>
            </div>
          ) : acoes.map(acao => {
            const info = tipoInfo(acao.tipo);
            const ativa = acao.data_inicio?.slice(0, 10) <= hoje && acao.data_fim?.slice(0, 10) >= hoje;
            return (
              <div key={acao._id} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
                <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${info.color}`}>
                  {info.label}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-medium truncate">{acao.produto}</span>
                    {ativa && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-600 border border-green-500/20">ATIVA</span>}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                    <span>Cód: {acao.cod_interno || acao.ean}</span>
                    <span>Preço: {fmt(acao.preco_acao)}</span>
                    <span>{acao.data_inicio?.slice(0, 10)} → {acao.data_fim?.slice(0, 10)}</span>
                    <span className="capitalize">{acao.vendor}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(acao)} className="p-2 rounded-lg text-slate-400 hover:text-royal hover:bg-royal/10 transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(acao._id)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-500/10 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && <FormModal acao={editAcao} onClose={() => { setShowModal(false); setEditAcao(null); }} onSave={onSave} />}
    </div>
  );
}
