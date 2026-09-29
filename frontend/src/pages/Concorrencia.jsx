import { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, Minus, RefreshCw, Store, Tag, TrendingDown, TrendingUp } from 'lucide-react';
import api from '../api/client';
import { useTituloDaPagina } from '../context/PaginaContext';
import { AppHeader } from '../components/layout/AppHeader';
import { PainelDeFiltros, CampoDeFiltro, filtrosAtivos } from '../components/filtros/PainelDeFiltros';
import { SearchInput } from '../components/filtros/SearchInput';
import { CartaoDeResumo, FaixaDeResumo } from '../components/indicadores/CartaoDeResumo';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Switch } from '../components/ui/Switch';
import { Label } from '../components/ui/Label';
import { Skeleton } from '../components/ui/Skeleton';
import { BadgeDeTipoDeAcao } from '../components/BadgeDeTipoDeAcao';
import { fmtData, fmtMoeda, fmtNumero, hojeLocal } from '../lib/formatar';
import { cn } from '../lib/cn';

const REDE = 'COMETA'; // rede monitorada, fixa

function DiffBadge({ nosso, concorrente }) {
  if (!nosso) return null;
  const diff = nosso - concorrente;
  const pct = Math.abs((diff / nosso) * 100).toFixed(1);
  if (Math.abs(diff) < 0.01)
    return (
      <Badge variant="neutro">
        <Minus aria-hidden /> Mesmo preço
      </Badge>
    );
  if (diff > 0)
    return (
      <Badge variant="perigo">
        <TrendingDown aria-hidden /> Concorrente {pct}% mais barato
      </Badge>
    );
  return (
    <Badge variant="sucesso">
      <TrendingUp aria-hidden /> Concorrente {pct}% mais caro
    </Badge>
  );
}

function ItemCard({ item, hoje }) {
  const ativo = item.validity_start_date <= hoje && item.validity_finish_date >= hoje;
  return (
    <article className={cn('superficie p-4', item.nossa_acao && 'border-secondary/30')}>
      <div className="flex items-start gap-3">
        <Badge variant="neutro" className="shrink-0 font-bold">
          {item.network_name || '—'}
        </Badge>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-sm font-semibold leading-tight text-neutral-800">{item.description}</p>
            <p className="shrink-0 text-base font-bold tabular-nums text-neutral-900">{fmtMoeda(item.value)}</p>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <Calendar className="size-3" aria-hidden />
              {fmtData(item.validity_start_date)} → {fmtData(item.validity_finish_date)}
            </span>
            {item.leaflet_name && (
              <span className="flex items-center gap-1">
                <Tag className="size-3" aria-hidden />
                {item.leaflet_name}
              </span>
            )}
            {ativo && <Badge variant="sucesso">Ativo</Badge>}
          </div>
          {item.nossa_acao && (
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded-sm border border-secondary/20 bg-secondary/5 px-3 py-2">
              <span className="text-xs text-neutral-500">Nossa ação:</span>
              <BadgeDeTipoDeAcao tipo={item.nossa_acao.tipo} tamanho="sm" />
              <span className="text-xs font-bold tabular-nums text-secondary">{fmtMoeda(item.nossa_acao.preco_acao)}</span>
              <span className="text-xs text-neutral-400">
                {fmtData(item.nossa_acao.data_inicio)} → {fmtData(item.nossa_acao.data_fim)}
              </span>
              <DiffBadge nosso={item.nossa_acao.preco_acao} concorrente={item.value} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Concorrencia() {
  useTituloDaPagina('Concorrência', `Ações promocionais na rede ${REDE}`);
  const hoje = hojeLocal();

  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  const [somenteConflito, setSomenteConflito] = useState(false);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const debounceRef = useRef(null);

  // A busca dispara a request só 600ms após parar de digitar (cada request vai à API externa)
  const aoBuscar = (valor) => {
    setBusca(valor);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setBuscaDebounced(valor), 600);
  };

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const p = new URLSearchParams();
      if (buscaDebounced) p.set('search', buscaDebounced);
      p.set('network', REDE);
      if (dataInicio) p.set('data_inicio', dataInicio);
      if (dataFim) p.set('data_fim', dataFim);
      const res = await api.get(`/concorrencia?${p}`);
      setDados(res.data.data || []);
    } catch (err) {
      setErro(err.response?.data?.error || err.message);
    } finally {
      setCarregando(false);
    }
  }, [buscaDebounced, dataInicio, dataFim]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const conflitos = dados.filter((d) => d.nossa_acao);
  const visiveis = somenteConflito ? conflitos : dados;

  const ativos = filtrosAtivos([
    (dataInicio || dataFim) && {
      id: 'periodo',
      rotulo: `Vigência: ${fmtData(dataInicio) || '…'} → ${fmtData(dataFim) || '…'}`,
      onRemover: () => {
        setDataInicio('');
        setDataFim('');
      },
    },
    somenteConflito && { id: 'conflito', rotulo: 'Somente conflitos com nossas ações', onRemover: () => setSomenteConflito(false) },
  ]);
  const limparTudo = () => {
    setDataInicio('');
    setDataFim('');
    setSomenteConflito(false);
    setBusca('');
    setBuscaDebounced('');
  };
  const temFiltro = ativos.length > 0 || Boolean(buscaDebounced);

  return (
    <div className="flex flex-col gap-6">
      <AppHeader
        filters={
          <p className="flex items-center gap-2 text-sm text-neutral-500">
            <Store className="size-4 text-neutral-400" aria-hidden />
            Rede monitorada: <Badge variant="secondary">{REDE}</Badge>
          </p>
        }
        actionsSlot={
          <Button variant="outline" onClick={carregar} disabled={carregando} aria-label="Atualizar dados do mercado">
            <RefreshCw className={carregando ? 'animate-spin' : ''} aria-hidden />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        }
      />

      <FaixaDeResumo colunas={3}>
        <CartaoDeResumo rotulo="Ações da concorrência" valor={carregando ? undefined : fmtNumero(dados.length)} apoio="no recorte atual" onClick={() => setSomenteConflito(false)} ativo={!somenteConflito} />
        <CartaoDeResumo rotulo="Ativas hoje" valor={carregando ? undefined : fmtNumero(dados.filter((d) => d.validity_start_date <= hoje && d.validity_finish_date >= hoje).length)} />
        <CartaoDeResumo
          rotulo="Conflitos com nossas ações"
          valor={carregando ? undefined : fmtNumero(conflitos.length)}
          tom={conflitos.length > 0 ? 'perigo' : 'neutro'}
          apoio="mesmo EAN e período sobreposto"
          onClick={() => setSomenteConflito((v) => !v)}
          ativo={somenteConflito}
          className="col-span-2 sm:col-span-1"
        />
      </FaixaDeResumo>

      <PainelDeFiltros telaId="concorrencia" ativos={ativos} onLimparTudo={limparTudo} slotFixo={<SearchInput value={busca} onChange={(e) => aoBuscar(e.target.value)} placeholder="Buscar produto ou EAN..." />}>
        <CampoDeFiltro rotulo="Vigente a partir de" htmlFor="conc-de">
          <Input id="conc-de" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        </CampoDeFiltro>
        <CampoDeFiltro rotulo="Vigente até" htmlFor="conc-ate">
          <Input id="conc-ate" type="date" value={dataFim} min={dataInicio || undefined} onChange={(e) => setDataFim(e.target.value)} />
        </CampoDeFiltro>
        <CampoDeFiltro rotulo="Cruzamento">
          <div className="flex h-10 items-center gap-2">
            <Switch id="conc-conflito" checked={somenteConflito} onCheckedChange={setSomenteConflito} />
            <Label htmlFor="conc-conflito" className="text-sm text-neutral-700">
              Somente conflitos com nossas ações
            </Label>
          </div>
        </CampoDeFiltro>
      </PainelDeFiltros>

      {carregando ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : erro ? (
        <div className="superficie p-8 text-center">
          <p className="text-sm font-medium text-danger">Não foi possível carregar os dados do mercado</p>
          <p className="mt-1 text-xs text-neutral-500">{erro}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={carregar}>
            Tentar novamente
          </Button>
        </div>
      ) : visiveis.length === 0 ? (
        <div className="superficie flex flex-col items-center gap-3 p-12 text-center">
          <Store className="size-10 text-neutral-300" aria-hidden />
          <p className="text-base font-medium text-neutral-700">{temFiltro ? 'Nenhuma ação corresponde aos filtros' : 'Nenhuma ação encontrada'}</p>
          {temFiltro && (
            <Button variant="secondary" size="sm" onClick={limparTudo}>
              Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-neutral-500">{fmtNumero(visiveis.length)} ação(ões)</p>
          {visiveis.map((item, i) => (
            <ItemCard key={`${item.item_id}_${item.leaflet_id}_${i}`} item={item} hoje={hoje} />
          ))}
        </div>
      )}
    </div>
  );
}
