---
title: "Modelo de Impedimentos"
date: 2026-06-04
context: "Exploracao via /gsd-explore"
---

## Decisao

Impedimentos sao registrados como entidade separada (nao como atributo de historia),
permitindo que um unico evento (ex: freezing de implantacao, outage AWS, licenca de
membro) impacte multiplas historias.

## Gatilho

Uma historia nao foi concluida na sprint. O impedimento explica o motivo.

## Campos

- Data do evento
- Descricao do impedimento
- Historias afetadas (N:N)

## Visualizacao

Os impedimentos devem aparecer na timeline do release, contextualizando para a
lideranca por que o planejamento nao foi atingido como esperado.

## Tipos de evento cobertos

- Ausencia de membro do time (licenca, doenca)
- Retrabalho (algo precisou ser refeito)
- Subestimativa (refinamento revelou escopo maior)
- Bloqueios externos (freezing, outage, dependencia de terceiros)
