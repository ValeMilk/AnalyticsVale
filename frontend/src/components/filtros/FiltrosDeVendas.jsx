import { useId, useMemo } from 'react';
import { PainelDeFiltros, CampoDeFiltro, filtrosAtivos } from './PainelDeFiltros';
import { Input } from '../ui/Input';
import { Segmentado, OPCOES_BANDEIRA, ROTULO_BANDEIRA } from './Segmentado';
import { MultiSelect } from './MultiSelect';
import { fmtData, hojeLocal } from '../../lib/formatar';

const normEan = (e) => String(e ?? '').replace(/,+$/, '').trim();

/**
 * Composição de domínio: período, bandeira, subcategoria, produtos e lojas dentro do PainelDeFiltros.
 * `padrao` é o estado "limpo" da tela (período inicial etc.). `slotFixo` recebe a busca, sempre visível.
 */
export function FiltrosDeVendas({ telaId, filtros, onChange, padrao, produtos = [], lojas = [], slotFixo, mostrarLojas = true, mostrarPeriodo = true }) {
  const id = useId();
  const hoje = hojeLocal();
  const atualizar = (chave, valor) => onChange({ ...filtros, [chave]: valor });

  const subcategorias = useMemo(() => [...new Set(produtos.map((p) => p.subcategoria).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [produtos]);
  const eansPorSubcategoria = useMemo(() => {
    const mapa = {};
    for (const p of produtos) {
      if (!p.subcategoria) continue;
      (mapa[p.subcategoria] ||= []).push(p.ean);
    }
    return mapa;
  }, [produtos]);

  const eans = filtros.eans || [];
  const lojaIds = filtros.loja_ids || [];

  const subcategoriasSelecionadas = subcategorias.filter((sub) => {
    const lista = eansPorSubcategoria[sub] || [];
    return lista.length > 0 && lista.every((e) => eans.includes(e));
  });

  const alternarSubcategorias = (novas) => {
    // Diferença entre o conjunto atual e o novo decide o que entra/sai
    let resultado = [...eans];
    for (const sub of subcategorias) {
      const lista = eansPorSubcategoria[sub] || [];
      const estava = subcategoriasSelecionadas.includes(sub);
      const fica = novas.includes(sub);
      if (fica && !estava) resultado = [...new Set([...resultado, ...lista])];
      if (!fica && estava) resultado = resultado.filter((e) => !lista.includes(e));
    }
    atualizar('eans', resultado);
  };

  const periodoPadrao = padrao?.data_inicio === filtros.data_inicio && padrao?.data_fim === filtros.data_fim;

  const ativos = filtrosAtivos([
    mostrarPeriodo &&
      (filtros.data_inicio || filtros.data_fim) &&
      !periodoPadrao && {
        id: 'periodo',
        rotulo: `Período: ${fmtData(filtros.data_inicio) || 'início'} → ${fmtData(filtros.data_fim) || 'hoje'}`,
        onRemover: padrao ? () => onChange({ ...filtros, data_inicio: padrao.data_inicio, data_fim: padrao.data_fim }) : undefined,
      },
    filtros.vendor &&
      filtros.vendor !== 'ambos' && {
        id: 'bandeira',
        rotulo: `Bandeira: ${ROTULO_BANDEIRA[filtros.vendor] ?? filtros.vendor}`,
        onRemover: () => atualizar('vendor', 'ambos'),
      },
    ...subcategoriasSelecionadas.map((sub) => ({
      id: `sub-${sub}`,
      rotulo: `Subcategoria: ${sub}`,
      onRemover: () => alternarSubcategorias(subcategoriasSelecionadas.filter((s) => s !== sub)),
    })),
    (() => {
      const cobertos = new Set(subcategoriasSelecionadas.flatMap((s) => eansPorSubcategoria[s] || []));
      const avulsos = eans.filter((e) => !cobertos.has(e));
      if (!avulsos.length) return null;
      const nome = avulsos.length === 1 ? produtos.find((p) => p.ean === avulsos[0])?.produto : null;
      return {
        id: 'produtos',
        rotulo: nome ? `Produto: ${nome}` : `Produtos: ${avulsos.length} selecionados`,
        onRemover: () => atualizar('eans', eans.filter((e) => !avulsos.includes(e))),
      };
    })(),
    mostrarLojas &&
      lojaIds.length > 0 && {
        id: 'lojas',
        rotulo: lojaIds.length === 1 ? `Loja: ${lojas.find((l) => l.loja_id === lojaIds[0])?.nome_loja ?? lojaIds[0]}` : `Lojas: ${lojaIds.length} selecionadas`,
        onRemover: () => atualizar('loja_ids', []),
      },
  ]);

  const limparTudo = () =>
    onChange({
      ...filtros,
      data_inicio: padrao?.data_inicio ?? filtros.data_inicio,
      data_fim: padrao?.data_fim ?? filtros.data_fim,
      vendor: 'ambos',
      eans: [],
      loja_ids: [],
    });

  return (
    <PainelDeFiltros telaId={telaId} ativos={ativos} onLimparTudo={limparTudo} slotFixo={slotFixo}>
      {mostrarPeriodo && (
        <>
          <CampoDeFiltro rotulo="De" htmlFor={`${id}-de`}>
            <Input id={`${id}-de`} type="date" value={filtros.data_inicio || ''} max={filtros.data_fim || hoje} onChange={(e) => atualizar('data_inicio', e.target.value)} />
          </CampoDeFiltro>
          <CampoDeFiltro rotulo="Até" htmlFor={`${id}-ate`}>
            <Input id={`${id}-ate`} type="date" value={filtros.data_fim || ''} min={filtros.data_inicio || undefined} max={hoje} onChange={(e) => atualizar('data_fim', e.target.value)} />
          </CampoDeFiltro>
        </>
      )}
      <CampoDeFiltro rotulo="Bandeira">
        <Segmentado rotulo="Bandeira" opcoes={OPCOES_BANDEIRA} valor={filtros.vendor || 'ambos'} onChange={(v) => atualizar('vendor', v)} className="h-10 items-center" />
      </CampoDeFiltro>
      <CampoDeFiltro rotulo="Subcategorias" htmlFor={`${id}-sub`}>
        <MultiSelect
          id={`${id}-sub`}
          label="Subcategorias"
          items={subcategorias.map((s) => ({ id: s, nome: s, total: (eansPorSubcategoria[s] || []).length }))}
          selected={subcategoriasSelecionadas}
          onChange={alternarSubcategorias}
          getKey={(s) => s.id}
          getLabel={(s) => s.nome}
          getSubLabel={(s) => `${s.total} produto${s.total !== 1 ? 's' : ''}`}
          placeholder="Buscar subcategoria..."
        />
      </CampoDeFiltro>
      <CampoDeFiltro rotulo="Produtos" htmlFor={`${id}-prod`}>
        <MultiSelect
          id={`${id}-prod`}
          label="Produtos"
          items={produtos}
          selected={eans}
          onChange={(v) => atualizar('eans', v)}
          getKey={(p) => p.ean}
          getLabel={(p) => p.produto || ''}
          getSubLabel={(p) => [p.cod_interno && `Cód. ${p.cod_interno}`, p.ean && `EAN ${normEan(p.ean)}`].filter(Boolean).join(' · ')}
          placeholder="Buscar por nome ou código..."
        />
      </CampoDeFiltro>
      {mostrarLojas && (
        <CampoDeFiltro rotulo="Lojas" htmlFor={`${id}-lojas`}>
          <MultiSelect
            id={`${id}-lojas`}
            label="Lojas"
            items={lojas}
            selected={lojaIds}
            onChange={(v) => atualizar('loja_ids', v)}
            getKey={(l) => l.loja_id}
            getLabel={(l) => l.nome_loja || String(l.loja_id)}
            getSubLabel={(l) => `ID ${l.loja_id}`}
            placeholder="Buscar por nome da loja..."
          />
        </CampoDeFiltro>
      )}
    </PainelDeFiltros>
  );
}

/** Query string das analytics: arrays separados por | (EANs podem conter vírgula) */
export function paramsDeVendas(filtros) {
  const p = new URLSearchParams();
  if (filtros.data_inicio) p.set('data_inicio', filtros.data_inicio);
  if (filtros.data_fim) p.set('data_fim', filtros.data_fim);
  if (filtros.vendor) p.set('vendor', filtros.vendor);
  if (filtros.eans?.length) p.set('eans', filtros.eans.join('|'));
  if (filtros.loja_ids?.length) p.set('loja_ids', filtros.loja_ids.join('|'));
  return p.toString();
}
