# Design system do frontend — decisões locais

Este frontend segue o guia portável de UI/UX (sidebar, barra superior, painel de filtros, kit de
tabela, cartões de KPI, formulários em diálogo, confirmação de exclusão). Este arquivo registra só
o que foi **decidido aqui**, para ninguém precisar redescobrir.

## Stack

React 18 + Vite 5 + Tailwind 3.4 + lucide-react. Sem shadcn/Radix: os primitivos equivalentes
vivem em `src/components/ui/` (Button, Badge, Input, Select, Popover, DropdownMenu, Dialog,
AlertDialog, Sheet, Switch, Checkbox, Skeleton, Toast).

## Tokens

- Única fonte: `src/styles/tokens.js`. O `tailwind.config.js` lê esse arquivo para gerar as
  utilities (`bg-primary`, `text-neutral-500`, ...) **e** para emitir as mesmas variáveis em
  `:root` (`--primary`, `--neutral-500`, `--r-lg`, ...). Gráficos importam `graficos` de lá.
- **Nunca hex solto fora de `tokens.js`.** Cor nova = token novo, documentado.
- **Cor de ação é `secondary` (#0056A6, o azul histórico do IA Cometa).** Botão que grava,
  item ativo do menu e foco de campo usam `secondary`. `primary` (#003D7A) é o tom
  institucional (logo, foco de elemento nativo).
- Raio: `rounded-sm` 8px (campos/botões), `rounded-lg` 12px (cards/tabela), `rounded-xl` 16px
  (diálogos/toast). Sombra e movimento também vêm dos tokens.
- Altura única de controle: 40px (`h-10`). Botão `sm` 32px, `lg` 44px.
- Superfície única: classe `.superficie` (`rounded-lg border border-neutral-200 bg-white`).
- Resets de elemento nativo ficam **dentro de `@layer base`** com seletor de elemento puro, para
  que qualquer utility vença sem `!important` (Tailwind 3 não usa camadas nativas do CSS, então
  a especificidade ainda conta: nada de `:not()` nesses resets).

## Casca e visão

- `CascaDaFerramenta` é o **único** lugar com o `if` de visão: `EscritorioShell` (sidebar fixa +
  TopBar + conteúdo `max-w-conteudo` + rodapé) ou `CelularShell` (cabeçalho fino + conteúdo + barra
  inferior). A decisão é tomada uma vez em `VisaoContext` (user-agent, com escolha manual gravada
  em `localStorage["app:visao"]` que sempre vence; a troca recarrega a página).
- A **mesma** `Sidebar` serve às duas visões (no celular, dentro de um `Sheet`). Os itens de menu
  vêm de uma lista única em `src/config/menu.js`; a barra inferior mostra no máximo 4 + "Menu".
- O título da tela é registrado pela própria página com `useTituloDaPagina(titulo, subtitulo)`;
  a TopBar e o cabeçalho mobile leem do `PaginaContext`.

## Filtros

`PainelDeFiltros` (busca sempre visível em `slotFixo`, chips quando fechado, "Limpar" desabilitado
sem filtro, aberto/fechado guardado por `telaId`). `FiltrosDeVendas` é a composição de domínio
(período, bandeira, subcategoria, produtos, lojas) usada em Dashboard e Vendas.

## Tabela

`src/components/tabela/`: contrato de coluna por `tipo` (`texto | numero | data | categoria |
custom`) → `useTabelaDeDados` (visibilidade/ordem, filtros por coluna, ordenação com "sem dado" no
fim, "mostrar mais") → `TabelaDeDados` (desktop) que vira lista de `CartaoDeLinha` no celular pelo
mesmo registro. Coluna de data **sempre** formata a partir da string `aaaa-mm-dd` (`renderizar`
obrigatório) para não recuar um dia por fuso.

Diferenças em relação ao guia, assumidas de propósito:

- Gerenciador de colunas reordena por botões ↑↓ (sem `@dnd-kit`).
- Exportação: CSV (`;` e vírgula decimal) e "copiar para planilha". Excel/PDF/Word exigiriam
  `exceljs`/`jspdf`/`docx`; o documento intermediário em `exportar.js` já está pronto para
  receber esses geradores por `import()` dinâmico.
- Nada de preferência de coluna persiste entre visitas.

## Formulários e confirmação

`useFormulario` (valores, erros por campo, rolagem até o primeiro `aria-invalid`) +
`CampoDeFormulario` dentro de `Dialog` com rodapé Cancelar (outline) / ação (secondary).
Toda exclusão passa por `ConfirmarExclusaoDialog` (AlertDialog, não fecha ao clicar fora), com o
texto dizendo o que para de acontecer e se há volta. `alert()`/`confirm()` foram substituídos por
`useToast()` e pelos diálogos.

## Datas

`hojeLocal()` em `src/lib/formatar.js` dá a data de hoje no fuso local. Não usar
`new Date().toISOString().slice(0, 10)` para "hoje": após as 21h no Brasil vira amanhã.

## Acesso restrito

`useResourceGuard(recurso)` expõe `isDenied` (só verdadeiro depois que as permissões carregaram) e
a página renderiza `RestrictedAccess` mantendo a casca. Esconder botão não substitui a recusa no
backend.
