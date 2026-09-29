import { useState } from 'react';
import { Copy, Download, FileSpreadsheet } from 'lucide-react';
import { Popover, usePopover } from '../ui/Popover';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { baixarArquivo, copiarParaPlanilha, gerarCsv, montarDocumento, nomeDeArquivo } from './exportar';
import { cn } from '../../lib/cn';

/**
 * Um botão "Exportar": escopo (como está na tela vs. tudo o que foi consultado) + formato.
 * Quando o escopo é "tudo", a linha de totais não entra (o total da tela não corresponde ao recorte).
 * Formatos disponíveis sem dependências: CSV e copiar para planilha.
 */
export function MenuExportar({ titulo, filtros = [], tabela, linhasCompletas, totais, size = 'default', desabilitado = false }) {
  return (
    <Popover
      align="end"
      larguraClasse="w-80"
      trigger={
        <Button variant="outline" size={size} disabled={desabilitado} aria-label="Exportar">
          <Download aria-hidden />
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      }
    >
      <ConteudoDoMenu titulo={titulo} filtros={filtros} tabela={tabela} linhasCompletas={linhasCompletas} totais={totais} />
    </Popover>
  );
}

function ConteudoDoMenu({ titulo, filtros, tabela, linhasCompletas, totais }) {
  const { fechar } = usePopover();
  const { notificar } = useToast();
  const naTela = tabela.linhasOrdenadas;
  const tudo = linhasCompletas ?? naTela;
  const temDiferenca = tudo.length !== naTela.length;
  const [escopo, setEscopo] = useState('tela');

  const montar = () => {
    const linhas = escopo === 'tela' ? naTela : tudo;
    const totaisEfetivos = escopo === 'tela' && totais ? (typeof totais === 'function' ? totais(linhas) : totais) : null;
    return montarDocumento({ titulo, filtros, colunas: tabela.colunasVisiveis, linhas, totais: totaisEfetivos });
  };

  const baixarCsv = () => {
    baixarArquivo(gerarCsv(montar()), nomeDeArquivo(titulo, 'csv'), 'text/csv;charset=utf-8');
    notificar({ tipo: 'sucesso', titulo: 'Arquivo gerado', descricao: 'O CSV foi baixado.' });
    fechar();
  };

  const copiar = async () => {
    try {
      await copiarParaPlanilha(montar());
      notificar({ tipo: 'sucesso', titulo: 'Copiado', descricao: 'Cole direto na planilha (Ctrl+V).' });
    } catch {
      notificar({ tipo: 'erro', titulo: 'Não foi possível copiar', descricao: 'O navegador bloqueou o acesso à área de transferência.' });
    }
    fechar();
  };

  return (
    <div className="flex flex-col gap-3">
      {temDiferenca && (
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-xs font-semibold text-neutral-700">O que exportar</legend>
          {[
            { v: 'tela', l: `Como está na tela (${naTela.length.toLocaleString('pt-BR')} linhas)` },
            { v: 'tudo', l: `Tudo o que foi consultado (${tudo.length.toLocaleString('pt-BR')} linhas)` },
          ].map((op) => (
            <label key={op.v} className={cn('flex cursor-pointer items-center gap-2 rounded-xs px-1.5 py-1 text-sm hover:bg-neutral-50', escopo === op.v && 'text-secondary')}>
              <input type="radio" name="escopo" value={op.v} checked={escopo === op.v} onChange={() => setEscopo(op.v)} className="accent-[var(--secondary)]" />
              {op.l}
            </label>
          ))}
        </fieldset>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-neutral-700">Formato</p>
        <button type="button" onClick={baixarCsv} className="flex items-center gap-2 rounded-xs px-1.5 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50">
          <FileSpreadsheet className="size-4 text-success" aria-hidden />
          Baixar CSV (abre no Excel)
        </button>
        <button type="button" onClick={copiar} className="flex items-center gap-2 rounded-xs px-1.5 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50">
          <Copy className="size-4 text-neutral-500" aria-hidden />
          Copiar para colar em planilha
        </button>
      </div>
    </div>
  );
}
