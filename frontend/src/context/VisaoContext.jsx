import { createContext, useContext, useState } from 'react';

// A decisão "visão de celular ou de computador" é tomada UMA vez, aqui, e todo o app só lê.
// Media query nunca decide qual estrutura de componente renderizar — só ajusta detalhe dentro
// de uma visão já escolhida.

const CHAVE = 'app:visao';
const Contexto = createContext('computador');

export function visaoForcada() {
  try {
    const v = localStorage.getItem(CHAVE);
    return v === 'celular' || v === 'computador' ? v : null;
  } catch {
    return null;
  }
}

function detectarVisao() {
  const forcada = visaoForcada();
  if (forcada) return forcada; // escolha manual sempre vence a detecção
  if (typeof navigator === 'undefined') return 'computador';
  const ua = navigator.userAgent || '';
  // Aparelho de mão: Android com "Mobile" (tablets Android não têm), iPhone/iPod, Windows Phone.
  const aparelhoDeMao = /Android.*Mobile|iPhone|iPod|Windows Phone/i.test(ua);
  return aparelhoDeMao ? 'celular' : 'computador';
}

export function VisaoProvider({ children }) {
  const [visao] = useState(detectarVisao);
  return <Contexto.Provider value={visao}>{children}</Contexto.Provider>;
}

export function useVisao() {
  return useContext(Contexto) ?? 'computador';
}

/** Escape hatch: grava a escolha explícita e recarrega — a troca sempre revalida a casca inteira. */
export function trocarVisao(alvo) {
  try {
    localStorage.setItem(CHAVE, alvo);
  } catch {
    /* sem storage: só recarrega e a detecção decide */
  }
  window.location.reload();
}
