# Phase 3: Sprint Planning, Board & Estimation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-31T11:20:41.3224670-03:00
**Phase:** 3-Sprint Planning, Board & Estimation
**Areas discussed:** Workspace de planejamento da sprint, Selecao e priorizacao por drag-and-drop, Semantica de estimativas, Comportamento do board

---

## Workspace de planejamento da sprint

| Option | Description | Selected |
|--------|-------------|----------|
| Duas colunas: backlog + sprint | Backlog a esquerda, sprint a direita, com totais/capacity visiveis. | yes |
| Tela de sprint com seletor de backlog | Sprint como foco, backlog em lista/modal. | |
| Tabela unica com filtros | Lista unica com campos de sprint/status/prioridade. | |
| Outro | Preferencia livre. | |

**User's choice:** Duas colunas: backlog + sprint.
**Notes:** Capacity deve alertar sem bloquear; pontos e dias/capacity devem aparecer lado a lado; sprints ficam em lista propria com botao novo.

---

## Selecao e priorizacao por drag-and-drop

| Option | Description | Selected |
|--------|-------------|----------|
| Backlog para sprint + ordenar sprint | Arrastar itens para sprint e ordenar sprint. | |
| Prioridade global + sprint | Reordenar backlog global, adicionar a sprint e ordenar sprint. | yes |
| So dentro da sprint/board | Backlog usa botoes; drag fica dentro da sprint/board. | |
| Outro | Preferencia livre. | |

**User's choice:** Prioridade global + sprint.
**Notes:** So historias e bugs entram na sprint; epicos/features sao impedidos com explicacao. Reordenar backlog atualiza `priority` automaticamente. Remover da sprint volta o item para o topo do backlog.

---

## Semantica de estimativas

| Option | Description | Selected |
|--------|-------------|----------|
| So historias e bugs | Itens executaveis tem estimativa; epicos/features agregam filhos. | yes |
| Historias, bugs e features | Feature pode ter estimativa provisoria. | |
| Todos os tipos | Maxima flexibilidade, maior risco de duplicacao. | |
| Outro | Preferencia livre. | |

**User's choice:** So historias e bugs.
**Notes:** Dias significam dias de trabalho da squad. Item sem estimativa pode entrar com alerta e nao conta nos totais. Epicos/features agregam filhos diretos e indiretos. Fibonacci fechado em `1, 2, 3, 5, 8, 13, 21`.

---

## Comportamento do board

| Option | Description | Selected |
|--------|-------------|----------|
| Sim: Backlog / In Progress / Done | Reutiliza `status` existente. | yes |
| Sim: To Do / In Progress / Done | UI usa To Do, banco pode continuar `backlog`. | |
| Criar status separado para sprint | Backlog e board teriam estados separados. | |
| Outro | Preferencia livre. | yes |

**User's choice:** Mapear direto para status atual; ao mover para Done, perguntar a data real de conclusao e salvar `completed_at`.
**Notes:** Done pode voltar sem perguntar, limpando `completed_at`. Ordenacao no board e manual por coluna. Sprint deve ter botao explicito de fechar sprint.

---

## the agent's Discretion

- Escolher biblioteca e detalhes tecnicos do drag-and-drop.
- Escolher schema exato para sprints, sprint items, ordenacao e fechamento, desde que preserve as decisoes capturadas.
- Escolher copy curta em portugues para mensagens de bloqueio/alerta.

## Deferred Ideas

- Planning poker.
- Sugestoes automaticas de historias por capacity restante.
- Colunas customizadas do board.
- Velocity, burndown, analytics e forecasting avancados.
