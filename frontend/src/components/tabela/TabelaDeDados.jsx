import { Inbox, SearchX } from 'lucide-react';
import { useVisao } from '../../context/VisaoContext';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { CabecalhoDeColuna } from './CabecalhoDeColuna';
import { FiltrosAtivos } from './FiltrosAtivos';
import { CartaoDeLinha } from './CartaoDeLinha';
import { celula } from './celula';
import { alinhamentoDaColuna, papelEfetivo, valorComoTexto } from './colunas';
import { cn } from '../../lib/cn';

/**
 * Listagem de dados. Só lê o estado do hook e o registro de colunas — nunca calcula filtro
 * ou ordenação por conta própria. No celular, o MESMO registro vira uma lista de cartões.
 */
export function TabelaDeDados({
  tabela,
  chaveDaLinha,
  classeDaLinha,
  aoClicarLinha,
  vazio = {},
  temFiltroDeTela = false,
  onLimparFiltrosDeTela,
  carregando = false,
  erro = null,
  aoTentarNovamente,
  totais,
  tom = 'escuro',
  fixarPrimeiraColuna = false,
  className,
}) {
  const visao = useVisao();
  const temFiltro = temFiltroDeTela || tabela.temFiltroDeColuna;
  const limparTudo = () => {
    tabela.limparTudo();
    onLimparFiltrosDeTela?.();
  };

  if (visao === 'celular') {
    return (
      <ListaDeCartoes
        tabela={tabela}
        chaveDaLinha={chaveDaLinha}
        aoClicarLinha={aoClicarLinha}
        vazio={vazio}
        temFiltro={temFiltro}
        onLimparTudo={limparTudo}
        carregando={carregando}
        erro={erro}
        aoTentarNovamente={aoTentarNovamente}
        className={className}
      />
    );
  }

  const colunas = tabela.colunasVisiveis;
  const colSpan = Math.max(1, colunas.length);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <FiltrosAtivos chips={tabela.chips} onLimparTudo={tabela.limparTudo} />
      <div className="superficie overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {colunas.map((c, i) => (
                  <CabecalhoDeColuna key={c.id} coluna={c} tabela={tabela} tom={tom} fixarNaRolagem={fixarPrimeiraColuna && i === 0} />
                ))}
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="border-b border-neutral-100">
                    {colunas.map((c) => (
                      <td key={c.id} className="px-3 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : erro ? (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-12 text-center">
                    <p className="text-sm font-medium text-danger">Não foi possível carregar os dados</p>
                    <p className="mt-1 text-xs text-neutral-500">{String(erro)}</p>
                    {aoTentarNovamente && (
                      <Button variant="outline" size="sm" className="mt-4" onClick={aoTentarNovamente}>
                        Tentar novamente
                      </Button>
                    )}
                  </td>
                </tr>
              ) : tabela.linhasVisiveis.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-12">
                    <EstadoVazio vazio={vazio} temFiltro={temFiltro} onLimparTudo={limparTudo} />
                  </td>
                </tr>
              ) : (
                tabela.linhasVisiveis.map((linha, indice) => {
                  const clicavel = typeof aoClicarLinha === 'function';
                  return (
                    <tr
                      key={chaveDaLinha ? chaveDaLinha(linha, indice) : indice}
                      role={clicavel ? 'button' : undefined}
                      tabIndex={clicavel ? 0 : undefined}
                      onClick={clicavel ? () => aoClicarLinha(linha) : undefined}
                      onKeyDown={
                        clicavel
                          ? (e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                aoClicarLinha(linha);
                              }
                            }
                          : undefined
                      }
                      className={cn(
                        'border-b border-neutral-100 transition-colors last:border-0',
                        clicavel && 'cursor-pointer hover:bg-secondary/5 focus-visible:bg-secondary/5 focus-visible:outline-none',
                        !clicavel && 'hover:bg-neutral-50',
                        classeDaLinha?.(linha)
                      )}
                    >
                      {colunas.map((c, i) => (
                        <td
                          key={c.id}
                          className={cn(
                            'px-3 py-2.5 align-middle text-neutral-800',
                            alinhamentoDaColuna(c) === 'right' && 'text-right',
                            c.larguraClasse,
                            fixarPrimeiraColuna && i === 0 && 'sticky left-0 z-[1] bg-white'
                          )}
                        >
                          {celula(c, linha)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
            {totais && !carregando && !erro && tabela.linhasVisiveis.length > 0 && (
              <tfoot>
                <tr className="border-t border-neutral-200 bg-neutral-50 font-semibold text-neutral-900">
                  {colunas.map((c, i) => (
                    <td key={c.id} className={cn('px-3 py-2.5 tabular-nums', alinhamentoDaColuna(c) === 'right' && 'text-right', fixarPrimeiraColuna && i === 0 && 'sticky left-0 bg-neutral-50')}>
                      {totais[c.id] ?? (i === 0 ? 'Total' : '')}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        {!carregando && !erro && tabela.linhasVisiveis.length > 0 && (
          <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 text-sm text-neutral-500">
            <span>
              Mostrando {tabela.linhasVisiveis.length.toLocaleString('pt-BR')} de {tabela.total.toLocaleString('pt-BR')}
            </span>
            {tabela.restantes > 0 && (
              <Button variant="outline" size="sm" onClick={tabela.mostrarMais}>
                Mostrar mais {Math.min(tabela.passo, tabela.restantes)}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Distingue "vazio de verdade" de "vazio por causa de filtro" */
function EstadoVazio({ vazio, temFiltro, onLimparTudo }) {
  const Icone = temFiltro ? SearchX : Inbox;
  const mensagem = temFiltro ? vazio.mensagemFiltrada ?? 'Nenhum registro corresponde aos filtros' : vazio.mensagemVazio ?? 'Nenhum registro encontrado';
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Icone className="size-8 text-neutral-300" aria-hidden />
      <p className="text-sm text-neutral-500">{mensagem}</p>
      {temFiltro ? (
        <Button variant="secondary" size="sm" onClick={onLimparTudo}>
          Limpar filtros
        </Button>
      ) : (
        vazio.acao
      )}
    </div>
  );
}

function ListaDeCartoes({ tabela, chaveDaLinha, aoClicarLinha, vazio, temFiltro, onLimparTudo, carregando, erro, aoTentarNovamente, className }) {
  const colunas = tabela.colunasVisiveis.filter((c) => papelEfetivo(c) !== 'oculto');
  const colTitulo = colunas.find((c) => papelEfetivo(c) === 'titulo') ?? colunas[0];
  const colEtiqueta = colunas.find((c) => papelEfetivo(c) === 'etiqueta');
  const colStatus = colunas.find((c) => papelEfetivo(c) === 'status');
  const colCampos = colunas.filter((c) => c !== colTitulo && c !== colEtiqueta && c !== colStatus && papelEfetivo(c) !== 'oculto');

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {carregando ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div key={`sk-${i}`} className="superficie p-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-2 h-3 w-1/3" />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
            </div>
          </div>
        ))
      ) : erro ? (
        <div className="superficie p-6 text-center">
          <p className="text-sm font-medium text-danger">Não foi possível carregar os dados</p>
          <p className="mt-1 text-xs text-neutral-500">{String(erro)}</p>
          {aoTentarNovamente && (
            <Button variant="outline" size="sm" className="mt-4" onClick={aoTentarNovamente}>
              Tentar novamente
            </Button>
          )}
        </div>
      ) : tabela.linhasVisiveis.length === 0 ? (
        <div className="superficie p-8">
          <EstadoVazio vazio={vazio} temFiltro={temFiltro} onLimparTudo={onLimparTudo} />
        </div>
      ) : (
        <>
          {tabela.linhasVisiveis.map((linha, indice) => (
            <CartaoDeLinha
              key={chaveDaLinha ? chaveDaLinha(linha, indice) : indice}
              titulo={colTitulo ? valorComoTexto(colTitulo, linha) || (colTitulo.tipo === 'custom' ? undefined : '-') : undefined}
              etiqueta={colEtiqueta ? valorComoTexto(colEtiqueta, linha) : undefined}
              status={colStatus ? celula(colStatus, linha) : undefined}
              campos={colCampos.map((c) => ({ rotulo: c.rotulo, valor: celula(c, linha), largo: c.tipo === 'custom' }))}
              aoTocar={aoClicarLinha ? () => aoClicarLinha(linha) : undefined}
            />
          ))}
          <div className="flex items-center justify-between px-1 py-2 text-xs text-neutral-500">
            <span>
              {tabela.linhasVisiveis.length.toLocaleString('pt-BR')} de {tabela.total.toLocaleString('pt-BR')}
            </span>
            {tabela.restantes > 0 && (
              <Button variant="outline" size="sm" onClick={tabela.mostrarMais}>
                Mostrar mais
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
