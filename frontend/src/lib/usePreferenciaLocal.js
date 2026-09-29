import { useCallback, useState } from 'react';

// Preferência de interface guardada no navegador (aberto/fechado de um painel, menu recolhido...).
// Nunca para dado de negócio. Leitura e escrita protegidas: em janela privada o storage pode falhar.
export function usePreferenciaLocal(chave, padrao) {
  const [valor, setValor] = useState(() => {
    try {
      const salvo = localStorage.getItem(chave);
      return salvo === null ? padrao : JSON.parse(salvo);
    } catch {
      return padrao;
    }
  });

  const definir = useCallback(
    (novo) => {
      setValor((anterior) => {
        const resolvido = typeof novo === 'function' ? novo(anterior) : novo;
        try {
          localStorage.setItem(chave, JSON.stringify(resolvido));
        } catch {
          /* storage indisponível: segue só em memória */
        }
        return resolvido;
      });
    },
    [chave]
  );

  return [valor, definir];
}
