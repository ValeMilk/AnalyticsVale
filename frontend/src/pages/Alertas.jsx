import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import api from '../api/client';
import { useTituloDaPagina } from '../context/PaginaContext';
import { AppHeader } from '../components/layout/AppHeader';
import { CartaoDeResumo, FaixaDeResumo } from '../components/indicadores/CartaoDeResumo';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import AlertCard from '../components/AlertCard';
import { fmtNumero } from '../lib/formatar';

const VAZIO = { alertas: [], total: 0, criticos: 0, avisos: 0 };

export default function Alertas() {
  useTituloDaPagina('Alertas', 'Monitoramento automático dos últimos 7 dias');
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [filtro, setFiltro] = useState('todos'); // 'todos' | 'criticos' | 'avisos'

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await api.get('/alertas');
      setDados(res.data.data || VAZIO);
    } catch (err) {
      setErro(err.response?.data?.error || err.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const d = dados ?? VAZIO;
  const lista = d.alertas.filter((a) => (filtro === 'todos' ? true : filtro === 'criticos' ? a.tipo === 'critico' : a.tipo === 'aviso'));
  // O cartão é o próprio toggle: clicar de novo no ativo remove o filtro
  const alternar = (chave) => setFiltro((atual) => (atual === chave ? 'todos' : chave));

  return (
    <div className="flex flex-col gap-6">
      <AppHeader
        filters={<p className="text-sm text-neutral-500">Queda de vendas diárias e margem negativa, calculadas sobre as duas bandeiras.</p>}
        actionsSlot={
          <Button variant="outline" onClick={carregar} disabled={carregando} aria-label="Atualizar alertas">
            <RefreshCw className={carregando ? 'animate-spin' : ''} aria-hidden />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        }
      />

      <FaixaDeResumo colunas={3}>
        <CartaoDeResumo rotulo="Total de alertas" valor={carregando ? undefined : fmtNumero(d.total)} apoio="nos últimos 7 dias" onClick={() => setFiltro('todos')} ativo={filtro === 'todos'} />
        <CartaoDeResumo rotulo="Críticos" valor={carregando ? undefined : fmtNumero(d.criticos)} tom={d.criticos > 0 ? 'perigo' : 'neutro'} onClick={() => alternar('criticos')} ativo={filtro === 'criticos'} />
        <CartaoDeResumo rotulo="Avisos" valor={carregando ? undefined : fmtNumero(d.avisos)} tom={d.avisos > 0 ? 'alerta' : 'neutro'} onClick={() => alternar('avisos')} ativo={filtro === 'avisos'} />
      </FaixaDeResumo>

      {carregando ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : erro ? (
        <div className="superficie p-8 text-center">
          <p className="text-sm font-medium text-danger">Não foi possível carregar os alertas</p>
          <p className="mt-1 text-xs text-neutral-500">{erro}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={carregar}>
            Tentar novamente
          </Button>
        </div>
      ) : lista.length === 0 ? (
        <div className="superficie p-12 text-center">
          <p className="text-base font-medium text-neutral-700">{filtro === 'todos' ? 'Nenhum alerta' : 'Nenhum alerta deste tipo'}</p>
          <p className="mt-1 text-sm text-neutral-400">Todos os indicadores estão dentro do esperado.</p>
          {filtro !== 'todos' && (
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => setFiltro('todos')}>
              Ver todos
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {lista.map((alerta, i) => (
            <AlertCard key={`${alerta.titulo}-${alerta.timestamp}-${i}`} alerta={alerta} />
          ))}
        </div>
      )}
    </div>
  );
}
