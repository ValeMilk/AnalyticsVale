import { useCallback, useState } from 'react';

/** Depois de uma validação reprovada, leva foco e rolagem até o primeiro campo inválido. */
export function rolarAtePrimeiroErro(raiz) {
  requestAnimationFrame(() => {
    const el = (raiz || document).querySelector('[aria-invalid="true"]');
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.focus?.({ preventScroll: true });
  });
}

/**
 * Estado de formulário simples: valores, erros por campo, envio.
 * `validar(valores)` devolve { campo: 'mensagem' } — vazio quando tudo está certo.
 */
export function useFormulario({ valoresIniciais, validar }) {
  const [valores, setValores] = useState(valoresIniciais);
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);

  const definir = useCallback((campo, valor) => {
    setValores((v) => ({ ...v, [campo]: valor }));
    setErros((e) => {
      if (!e[campo]) return e;
      const n = { ...e };
      delete n[campo];
      return n;
    });
  }, []);

  const resetar = useCallback(
    (novos) => {
      setValores(novos ?? valoresIniciais);
      setErros({});
    },
    [valoresIniciais]
  );

  const submeter = useCallback(
    (aoValidar) => async (evento) => {
      evento?.preventDefault?.();
      const raiz = evento?.currentTarget;
      const novosErros = validar ? validar(valores) : {};
      setErros(novosErros);
      if (Object.keys(novosErros).length) {
        rolarAtePrimeiroErro(raiz);
        return;
      }
      setEnviando(true);
      try {
        await aoValidar(valores);
      } finally {
        setEnviando(false);
      }
    },
    [validar, valores]
  );

  const propsDoCampo = useCallback(
    (campo) => ({
      value: valores[campo] ?? '',
      onChange: (ev) => definir(campo, ev && ev.target ? ev.target.value : ev),
      'aria-invalid': erros[campo] ? true : undefined,
    }),
    [valores, erros, definir]
  );

  return { valores, erros, setErros, definir, resetar, submeter, enviando, propsDoCampo };
}
