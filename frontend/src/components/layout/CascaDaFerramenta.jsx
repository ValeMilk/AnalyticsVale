import { useVisao } from '../../context/VisaoContext';
import { EscritorioShell } from './EscritorioShell';
import { CelularShell } from './CelularShell';

// O ÚNICO lugar com o `if` de visão. As duas cascas recebem exatamente as mesmas props.
export function CascaDaFerramenta({ children }) {
  const visao = useVisao();
  return visao === 'celular' ? <CelularShell>{children}</CelularShell> : <EscritorioShell>{children}</EscritorioShell>;
}
