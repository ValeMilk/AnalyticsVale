// Junta classes ignorando valores falsos. Sem tailwind-merge: componentes são desenhados
// para que a className externa ADICIONE classes, nunca dispute a mesma propriedade.
export function cn(...args) {
  return args.flat(Infinity).filter(Boolean).join(' ');
}
