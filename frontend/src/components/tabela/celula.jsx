import { formatarNumero } from '../../lib/formatar';
import { cn } from '../../lib/cn';

export const Vazio = () => <span className="text-neutral-400">-</span>;

/**
 * Célula unificada: a MESMA função alimenta <td> (desktop) e os campos do cartão (mobile),
 * garantindo que um tipo de coluna nunca vira texto de dois jeitos diferentes.
 */
export function celula(coluna, linha) {
  switch (coluna.tipo) {
    case 'texto':
      return coluna.renderizar?.(linha) ?? coluna.valor(linha) ?? <Vazio />;
    case 'numero': {
      if (coluna.renderizar) return coluna.renderizar(linha);
      const valor = coluna.valor(linha);
      if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return <Vazio />;
      const negativo = Number(valor) < 0;
      return <span className={cn('tabular-nums', negativo && 'font-medium text-danger')}>{formatarNumero(valor, coluna.formato)}</span>;
    }
    case 'data':
      return coluna.renderizar(linha); // sempre a cargo do registro (formata da string crua)
    case 'categoria': {
      const valor = coluna.valor(linha);
      if (Array.isArray(valor)) return valor.join(', ') || <Vazio />;
      return coluna.renderizar?.(linha) ?? valor ?? <Vazio />;
    }
    case 'custom':
      return coluna.renderizar(linha);
    default:
      return <Vazio />;
  }
}
