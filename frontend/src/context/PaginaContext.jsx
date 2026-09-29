import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// O título da tela NÃO é prop da casca: cada página se anuncia com useTituloDaPagina()
// e a TopBar (desktop) ou o cabeçalho (mobile) lê daqui.

const Contexto = createContext(null);

export function PaginaProvider({ children }) {
  const [pagina, setPagina] = useState(null);

  const registrar = useCallback((nova) => {
    setPagina(nova);
    return () => setPagina((atual) => (atual === nova ? null : atual));
  }, []);

  return <Contexto.Provider value={{ pagina, registrar }}>{children}</Contexto.Provider>;
}

export function useTituloDaPagina(titulo, subtitulo) {
  const registrar = useContext(Contexto)?.registrar;
  useEffect(() => {
    document.title = titulo ? `${titulo} · IA Cometa` : 'IA Cometa';
    if (!registrar) return undefined;
    return registrar({ titulo, subtitulo });
  }, [registrar, titulo, subtitulo]);
}

export function usePaginaTitulo() {
  return useContext(Contexto)?.pagina ?? null;
}
