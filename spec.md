# SPEC — Webapp Local para Planejamento e Acompanhamento de Squad

## 1. Visão geral

O sistema será um webapp local para apoiar o planejamento e acompanhamento de releases de uma Squad.

O app permitirá cadastrar releases, features, histórias, sprints e membros da Squad. A partir desses dados, o sistema calculará capacidade disponível, esforço planejado, riscos de estouro de capacidade e progresso das features ao longo das sprints.

O sistema será auxiliar, não substituindo ferramentas como Jira, Azure DevOps ou Trello.

A primeira versão deverá funcionar localmente, com baixa complexidade de instalação e execução, e incluir suporte a IA/MCP para consulta e apoio ao planejamento.

---

## 2. Objetivos

### 2.1 Objetivo principal

Organizar o escopo de uma release, quebrando features em histórias, distribuindo histórias em sprints e visualizando se o planejamento cabe dentro da capacidade disponível da Squad.

### 2.2 Objetivos secundários

* Acompanhar execução das sprints.
* Calcular capacidade da Squad considerando férias, folgas, feriados, reuniões e sustentação.
* Exibir timeline das features dentro da release.
* Exibir alertas quando uma sprint ou release ultrapassar capacidade.
* Registrar histórias que vazam de uma sprint para outra.
* Permitir consulta e apoio via IA/MCP.
* Permitir exportações simples para relatório.

---

## 3. Escopo da primeira versão

A primeira versão conterá:

* cadastro de Squad;
* cadastro de membros;
* cadastro de férias e folgas;
* cadastro de releases;
* geração automática de sprints;
* cadastro de features;
* cadastro de histórias;
* backlog geral;
* planejamento manual das histórias nas sprints;
* board da sprint com drag-and-drop;
* encerramento e reabertura de sprint;
* cálculo de capacidade;
* alertas de estouro de capacidade;
* timeline da release;
* dashboard simples da release;
* exportação para Excel/CSV;
* servidor MCP local;
* assistente de IA para consultas e sugestões.

---

## 4. Fora do escopo da primeira versão

Não fazem parte da primeira versão:

* autenticação multiusuário;
* controle avançado de permissões;
* integração com Jira, Azure DevOps ou GitHub;
* cálculo automático de velocidade da Squad em story points;
* planejamento automático obrigatório;
* WIP limit;
* responsável por história;
* múltiplas releases ativas ao mesmo tempo;
* sprints paralelas;
* dependências bloqueantes;
* edição colaborativa em tempo real;
* banco de dados remoto;
* deploy em servidor corporativo.

---

## 5. Arquitetura proposta

## 5.1 Tipo de aplicação

Webapp executado localmente na máquina de um membro da Squad.

A aplicação deverá subir um servidor local e ser acessada pelo navegador.

Exemplo de acesso:

```text
http://localhost:3000
```

## 5.2 Stack sugerida

Para simplicidade e boa experiência visual:

```text
Frontend + Backend: Next.js
Linguagem: TypeScript
Banco local: SQLite
ORM: Prisma
UI: React + TailwindCSS
Drag-and-drop: dnd-kit
Gráficos/timeline: Recharts ou biblioteca similar
MCP: servidor Node.js local
Exportação: XLSX/CSV
```

## 5.3 Persistência

Os dados serão armazenados localmente em SQLite.

Arquivo sugerido:

```text
./data/squad-planner.db
```

O sistema deverá permitir backup manual exportando o banco ou exportando os dados principais em JSON.

---

## 6. Conceitos principais

## 6.1 Squad

Representa o time responsável pela execução da release.

Uma Squad possui membros, configurações de capacidade e registros de ausências.

## 6.2 Membro

Pessoa da Squad.

Cada membro possui tipo de jornada:

* Full time: 8h por dia útil.
* Estagiário: 6h por dia útil.

Na primeira versão não existirão outros tipos de jornada.

## 6.3 Release

Agrupamento de features que serão planejadas e acompanhadas dentro de um período.

Uma release possui início, fim, objetivo, descrição e uma sequência de sprints.

Apenas uma release poderá estar ativa por vez.

## 6.4 Sprint

Período de trabalho dentro da release.

As sprints são criadas automaticamente a partir da data de início, data de fim e duração padrão informada na release.

A sprint possui capacidade calculada, meta, histórias planejadas e status.

## 6.5 Feature

Unidade funcional ou entrega relevante da release.

Uma feature pertence a uma release e é composta por histórias.

A estimativa da feature é sempre calculada pela soma das histórias.

## 6.6 História

Unidade planejável de trabalho.

Cada história pertence obrigatoriamente a uma feature.

A história possui estimativa em story points e em dias úteis.

Story points representam esforço relativo.

Dias úteis representam esforço usado para comparação com capacidade.

## 6.7 Backlog geral

Lista de histórias que ainda não foram atribuídas a uma sprint.

## 6.8 Backlog da sprint

Lista de histórias atribuídas a uma sprint, mas ainda não iniciadas.

---

## 7. Regras de negócio

## 7.1 Release

### RB01 — Criação de release

Uma release deve possuir:

* nome;
* objetivo;
* descrição opcional;
* data de início;
* data de fim;
* duração padrão da sprint em dias úteis;
* percentual de sustentação;
* percentual de reuniões;
* status.

Status possíveis:

```text
Planejada
Em andamento
Encerrada
Cancelada
```

### RB02 — Apenas uma release ativa

O sistema não permitirá mais de uma release com status “Em andamento”.

### RB03 — Geração automática de sprints

Ao criar uma release, o sistema deverá gerar automaticamente as sprints.

As sprints serão criadas em sequência, sem sobreposição.

### RB04 — Última sprint absorve o restante

Caso o período da release não feche exatamente com a duração padrão das sprints, o sistema não criará uma sprint final muito pequena.

A última sprint planejada deverá absorver os dias restantes e ficar maior.

Exemplo:

```text
Release: 01/07 a 31/07
Duração padrão: 10 dias úteis

Sprint 1: 01/07 a 14/07
Sprint 2: 15/07 a 31/07
```

### RB05 — Edição de sprint

O usuário poderá editar datas de uma sprint individual.

O sistema deverá:

* recalcular a capacidade da sprint editada;
* impedir sobreposição entre sprints;
* alertar caso existam lacunas na release;
* alertar caso histórias planejadas fiquem fora da capacidade.

### RB06 — Sprint não deve ficar vazia

Uma sprint não poderá ser encerrada se não possuir nenhuma história planejada, exceto se for uma sprint criada automaticamente e ainda não utilizada.

---

## 7.2 Feature

### RB07 — Feature pertence a uma release

Toda feature deve pertencer a uma release.

### RB08 — Feature pode ser não planejada

Uma feature pode ser criada como “não planejada” dentro da release, sem histórias atribuídas a sprints.

### RB09 — Estimativa da feature

A estimativa da feature será sempre calculada pela soma das histórias associadas.

```text
feature.storyPoints = soma(history.storyPoints)
feature.estimatedDays = soma(history.estimatedDays)
```

### RB10 — Status da feature

O status da feature será calculado automaticamente com base nas histórias.

Status possíveis:

```text
Não iniciada
Em andamento
Finalizada
```

Regras:

```text
Não iniciada = nenhuma história finalizada ou em execução
Em andamento = pelo menos uma história em execução ou finalizada, mas nem todas finalizadas
Finalizada = todas as histórias finalizadas
```

---

## 7.3 História

### RB11 — História pertence a uma feature

Toda história deve pertencer obrigatoriamente a uma feature.

### RB12 — Estimativas da história

Cada história terá:

* story points;
* dias úteis estimados.

Os dois campos são independentes.

O sistema não converterá automaticamente story points em dias.

### RB13 — Dias úteis da história

Os dias úteis estimados da história representam esforço consumido da capacidade da sprint.

Exemplo:

```text
História A = 3 dias úteis
Capacidade líquida da sprint = 20 dias úteis
Capacidade restante após adicionar História A = 17 dias úteis
```

### RB14 — Status da história

Status possíveis:

```text
Backlog
Backlog da Sprint
Em Execução
Finalizado
Cancelado
```

O status “Cancelado” existirá para remover uma história do escopo sem apagá-la historicamente.

### RB15 — Finalizado

Na primeira versão, “Finalizado” significa trabalho concluído pela Squad para fins de planejamento e acompanhamento.

Não haverá distinção entre desenvolvimento concluído, homologado ou pronto para produção.

---

## 7.4 Backlog

### RB16 — Backlog geral

Histórias criadas e não atribuídas a nenhuma sprint ficam no backlog geral.

### RB17 — Filtros do backlog

O backlog geral deverá permitir filtro por:

* release;
* feature;
* status;
* texto livre;
* histórias não planejadas;
* histórias canceladas.

### RB18 — Remover história da sprint

Uma história poderá ser removida da sprint e voltar ao backlog geral.

Ao voltar ao backlog geral, o status será alterado para:

```text
Backlog
```

---

## 7.5 Sprint board

### RB19 — Colunas fixas

A tela da sprint terá as seguintes colunas:

```text
Backlog da Sprint
Em Execução
Finalizado
```

### RB20 — Drag-and-drop

O usuário poderá arrastar histórias entre as colunas.

Ao mover uma história, o sistema atualiza seu status.

### RB21 — Capacidade visível

A tela da sprint deverá exibir:

* capacidade bruta;
* capacidade líquida;
* esforço planejado;
* capacidade restante;
* percentual de ocupação;
* alerta de estouro.

### RB22 — Estouro de capacidade

O sistema deverá permitir que a capacidade da sprint seja ultrapassada.

Porém, deverá exibir alerta visual claro.

Exemplo:

```text
Capacidade líquida: 25 dias
Planejado: 31 dias
Estouro: 6 dias
Status: acima da capacidade
```

---

## 7.6 Encerramento de sprint

### RB23 — Encerrar sprint

Ao clicar em “Encerrar Sprint”, o sistema deverá encerrar a sprint atual.

### RB24 — Histórias finalizadas

Histórias na coluna “Finalizado” permanecem na sprint encerrada e contam como concluídas naquela sprint.

### RB25 — Histórias não finalizadas

Histórias que não estiverem em “Finalizado” serão movidas automaticamente para a próxima sprint.

Isso inclui histórias em:

```text
Backlog da Sprint
Em Execução
```

### RB26 — Manter status ao vazar

Histórias movidas automaticamente para a próxima sprint devem manter seu status.

Exemplo:

```text
Em Execução na Sprint 1 → Em Execução na Sprint 2
Backlog da Sprint na Sprint 1 → Backlog da Sprint na Sprint 2
```

### RB27 — Criar próxima sprint automaticamente

Se não existir próxima sprint, o sistema deverá criar uma nova sprint automaticamente após a última sprint da release.

Essa nova sprint ficará vinculada à release e ampliará a previsão da release.

### RB28 — Registrar vazamento

O sistema deverá registrar quando uma história vaza de uma sprint para outra.

Deverá ser possível consultar:

* sprint original;
* sprint destino;
* data do vazamento;
* status no momento do vazamento.

### RB29 — Vazamento não conta como conclusão

Histórias vazadas não contam como concluídas na sprint anterior.

### RB30 — Reabrir sprint

Uma sprint encerrada poderá ser reaberta.

Ao reabrir, o sistema deverá manter o histórico, mas permitir ajustes manuais.

---

## 7.7 Capacidade

### RB31 — Capacidade bruta

A capacidade bruta da sprint será calculada com base nos membros da Squad e dias úteis da sprint.

```text
Capacidade bruta = soma das horas disponíveis dos membros nos dias úteis da sprint
```

Full time:

```text
8h por dia útil
```

Estagiário:

```text
6h por dia útil
```

### RB32 — Férias, folgas e feriados

Férias, folgas e feriados reduzem a capacidade.

Ausências são calculadas por membro.

Feriados reduzem a capacidade de todos os membros.

### RB33 — Reuniões

Reuniões serão configuradas como percentual da Squad na release.

Exemplo:

```text
Reuniões = 10%
```

### RB34 — Sustentação

Sustentação será configurada como percentual da Squad na release.

Exemplo:

```text
Sustentação = 20%
```

### RB35 — Fórmula de capacidade líquida

A capacidade líquida será calculada assim:

```text
capacidadeApósAusências = capacidadeBruta - férias - folgas - feriados

capacidadeLíquida =
capacidadeApósAusências × (1 - percentualReuniões - percentualSustentação)
```

Exemplo:

```text
Capacidade após ausências: 300h
Reuniões: 10%
Sustentação: 20%

Capacidade líquida = 300 × (1 - 0,10 - 0,20)
Capacidade líquida = 210h
```

### RB36 — Conversão para dias

A capacidade em dias será normalizada com base em dias de 8h.

```text
capacidadeEmDias = capacidadeEmHoras / 8
```

### RB37 — Comparação com esforço planejado

O esforço planejado da sprint será:

```text
soma dos dias estimados das histórias atribuídas à sprint
```

O sistema comparará:

```text
capacidade líquida em dias
versus
dias estimados das histórias
```

---

## 7.8 Progresso

### RB38 — Progresso da feature

O percentual de conclusão da feature será calculado por story points finalizados.

```text
progressoFeature =
story points finalizados da feature / story points totais da feature
```

Se a feature não possuir story points, o sistema deverá calcular por quantidade de histórias finalizadas.

### RB39 — Progresso da release

O progresso da release será calculado por story points finalizados.

```text
progressoRelease =
story points finalizados da release / story points totais da release
```

### RB40 — Progresso da sprint

O progresso da sprint será calculado por dias estimados finalizados.

```text
progressoSprint =
dias das histórias finalizadas / dias totais planejados na sprint
```

### RB41 — Timeline da feature

A timeline da feature será calculada com base nas sprints onde suas histórias estão planejadas.

```text
início previsto = primeira sprint com história da feature
fim previsto = última sprint com história da feature
```

### RB42 — Timeline com buracos

Uma feature pode ter histórias na Sprint 1, nenhuma na Sprint 2 e novas histórias na Sprint 3.

Na timeline, isso será exibido como intervalo contínuo da Sprint 1 até a Sprint 3, com indicação visual de sprints sem atividade.

### RB43 — Planejado versus realizado

A timeline deverá exibir:

* início previsto;
* fim previsto;
* progresso atual;
* sprints com histórias finalizadas;
* sprints com histórias vazadas;
* percentual da feature planejado em cada sprint;
* comparação entre o percentual definido no planejamento e o percentual atualmente alocado.

O percentual por sprint da feature será calculado por dias estimados:

```text
percentualFeatureNaSprint =
dias estimados da feature naquela sprint / dias estimados totais da feature
```

Quando existir baseline de planejamento, o sistema deverá comparar o percentual capturado no go-live com a alocação atual das histórias por sprint. Antes do baseline existir, a timeline exibirá a distribuição planejada atual.

---

## 8. Telas

## 8.1 Tela inicial / Dashboard

A tela inicial deverá exibir a release ativa.

Informações exibidas:

* nome da release;
* período da release;
* status;
* progresso da release;
* capacidade total da release;
* esforço planejado total;
* estouro ou sobra de capacidade;
* quantidade de features;
* quantidade de histórias;
* quantidade de histórias finalizadas;
* quantidade de histórias vazadas;
* alerta de risco.

Ações:

* abrir release;
* criar nova release;
* acessar backlog;
* acessar squad;
* exportar relatório;
* abrir assistente de IA.

---

## 8.2 Tela de Releases

Permite criar e configurar releases.

Campos:

* nome;
* objetivo;
* descrição;
* data de início;
* data de fim;
* duração padrão da sprint;
* percentual de reuniões;
* percentual de sustentação;
* status.

Ao salvar, o sistema gera as sprints automaticamente.

A tela deverá exibir:

* lista de sprints;
* capacidade de cada sprint;
* esforço planejado;
* capacidade restante;
* alerta de estouro;
* timeline das features.

---

## 8.3 Tela de Features e Histórias

Permite cadastrar features e suas histórias.

Feature:

* nome;
* descrição;
* release;
* status calculado;
* story points totais;
* dias totais;
* progresso;
* início previsto;
* fim previsto.

História:

* título;
* descrição;
* critérios de aceite;
* feature;
* story points;
* dias úteis estimados;
* status;
* sprint atual;
* cancelada ou não.

Ações:

* criar feature;
* editar feature;
* cancelar feature;
* criar história;
* editar história;
* cancelar história;
* mover história para backlog;
* visualizar progresso da feature.

---

## 8.4 Tela de Backlog

Exibe histórias ainda não atribuídas a sprints.

Filtros:

* release;
* feature;
* status;
* texto livre;
* histórias não planejadas;
* histórias canceladas.

Ações:

* editar história;
* cancelar história;
* associar história a uma sprint;
* visualizar feature relacionada.

---

## 8.5 Tela de Sprint

Tela operacional da sprint.

Deve exibir:

* nome da sprint;
* período;
* meta da sprint;
* status;
* capacidade bruta;
* capacidade líquida;
* esforço planejado;
* capacidade restante;
* percentual de ocupação;
* alerta de estouro.

Board com três colunas:

```text
Backlog da Sprint
Em Execução
Finalizado
```

Ações:

* arrastar história entre colunas;
* adicionar histórias do backlog;
* remover história da sprint;
* editar meta da sprint;
* editar datas;
* encerrar sprint;
* reabrir sprint.

---

## 8.6 Tela da Squad

Permite configurar membros, ausências e capacidade.

Campos do membro:

* nome;
* tipo: full time ou estagiário;
* ativo/inativo.

Ausências:

* férias;
* folgas abonadas.

Campos de ausência:

* membro;
* tipo;
* data de início;
* data de fim;
* observação.

A tela deverá exibir:

* capacidade bruta estimada;
* ausências futuras;
* impacto das ausências por sprint.

---

## 8.7 Tela de Relatórios

Relatórios da primeira versão:

* planejamento da release;
* capacidade por sprint;
* histórias por sprint;
* progresso por feature;
* histórias vazadas;
* esforço planejado versus capacidade;
* timeline da release.

Formatos:

```text
Excel
CSV
```

---

## 8.8 Assistente de IA

O app terá uma interface simples de chat local conectada ao MCP.

O assistente poderá consultar dados do planejamento e sugerir melhorias.

Exemplos de perguntas:

```text
Essa release cabe na capacidade atual?
Quais sprints estão acima da capacidade?
Quais features estão em risco?
Quais histórias vazaram?
Como posso redistribuir melhor as histórias?
Qual é o progresso da release?
Qual feature termina mais tarde?
```

Na primeira versão, a IA poderá sugerir alterações, mas não deverá aplicar mudanças automaticamente sem confirmação do usuário.

---

## 9. MCP

## 9.1 Objetivo

Expor os dados e operações principais do app para agentes de IA compatíveis com MCP, como Claude, Codex, Copilot ou outro agente local.

## 9.2 Modo de execução

O servidor MCP será executado localmente junto com o webapp.

Exemplo:

```text
npm run dev
npm run mcp
```

Ou em processo único:

```text
npm run start:local
```

## 9.3 Recursos MCP

### Consultas

O MCP deverá expor ferramentas para:

```text
list_releases
get_active_release
get_release_summary
list_sprints
get_sprint_capacity
list_features
get_feature_details
list_stories
list_backlog
get_timeline
get_capacity_report
get_leakage_report
```

### Sugestões

O MCP deverá expor ferramentas para:

```text
suggest_scope_adjustments
suggest_story_redistribution
identify_capacity_risks
identify_late_features
explain_release_status
```

### Escrita controlada

Na primeira versão, o MCP poderá criar e alterar dados, mas sempre por operações explícitas.

Ferramentas permitidas:

```text
create_feature
update_feature
create_story
update_story
move_story_to_sprint
move_story_to_backlog
update_story_status
```

Operações críticas deverão exigir confirmação na interface ou serem marcadas como perigosas:

```text
close_sprint
reopen_sprint
delete_or_cancel_story
delete_or_cancel_feature
```

## 9.4 Segurança local

Como o app será local:

* o MCP deve escutar apenas em localhost;
* não deve abrir acesso externo por padrão;
* não deve expor dados em rede sem configuração explícita;
* logs não devem conter informações sensíveis desnecessárias.

---

## 10. Modelo de dados inicial

## 10.1 SquadMember

```text
id
name
roleType: FULL_TIME | INTERN
active
createdAt
updatedAt
```

## 10.2 Absence

```text
id
memberId
type: VACATION | DAY_OFF
startDate
endDate
notes
createdAt
updatedAt
```

## 10.3 Holiday

```text
id
date
name
createdAt
updatedAt
```

## 10.4 Release

```text
id
name
objective
description
startDate
endDate
defaultSprintLengthBusinessDays
meetingPercentage
supportPercentage
status: PLANNED | IN_PROGRESS | CLOSED | CANCELLED
createdAt
updatedAt
```

## 10.5 Sprint

```text
id
releaseId
name
goal
startDate
endDate
status: PLANNED | IN_PROGRESS | CLOSED
createdAt
updatedAt
```

## 10.6 Feature

```text
id
releaseId
name
description
statusCalculated
createdAt
updatedAt
```

## 10.7 Story

```text
id
featureId
title
description
acceptanceCriteria
storyPoints
estimatedDays
status: BACKLOG | SPRINT_BACKLOG | IN_PROGRESS | DONE | CANCELLED
currentSprintId
createdAt
updatedAt
```

## 10.8 StorySprintHistory

```text
id
storyId
fromSprintId
toSprintId
eventType: ADDED | MOVED | LEAKED | REMOVED | COMPLETED
statusAtEvent
eventDate
notes
createdAt
```

## 10.9 AppSettings

```text
id
workingHoursFullTime
workingHoursIntern
standardDayHours
createdAt
updatedAt
```

Valores padrão:

```text
workingHoursFullTime = 8
workingHoursIntern = 6
standardDayHours = 8
```

---

## 11. Cálculos

## 11.1 Dias úteis

Dias úteis são segunda a sexta, excluindo feriados cadastrados.

## 11.2 Capacidade bruta da sprint

```text
Para cada dia útil da sprint:
  Para cada membro ativo:
    somar 8h se full time
    somar 6h se estagiário
```

## 11.3 Ausências

Se um membro estiver de férias ou folga em um dia útil, suas horas daquele dia são removidas da capacidade.

## 11.4 Capacidade após ausências

```text
capacidadeApósAusências =
capacidadeBruta - horasAusentes
```

## 11.5 Capacidade líquida

```text
capacidadeLíquida =
capacidadeApósAusências × (1 - meetingPercentage - supportPercentage)
```

## 11.6 Capacidade em dias

```text
capacidadeDias =
capacidadeLíquidaHoras / 8
```

## 11.7 Esforço planejado da sprint

```text
esforçoPlanejadoSprint =
soma estimatedDays das histórias atribuídas à sprint
```

## 11.8 Ocupação da sprint

```text
ocupaçãoSprint =
esforçoPlanejadoSprint / capacidadeDias
```

## 11.9 Capacidade da release

```text
capacidadeRelease =
soma capacidadeDias das sprints da release
```

## 11.10 Esforço planejado da release

```text
esforçoPlanejadoRelease =
soma estimatedDays das histórias das features da release
```

## 11.11 Progresso da feature

```text
progressoFeature =
storyPointsFinalizados / storyPointsTotais
```

Fallback:

```text
históriasFinalizadas / históriasTotais
```

## 11.12 Progresso da release

```text
progressoRelease =
storyPointsFinalizadosRelease / storyPointsTotaisRelease
```

Fallback:

```text
históriasFinalizadasRelease / históriasTotaisRelease
```

---

## 12. Alertas

O sistema deverá exibir alertas para:

## 12.1 Sprint acima da capacidade

Quando:

```text
esforçoPlanejadoSprint > capacidadeDias
```

## 12.2 Release acima da capacidade

Quando:

```text
esforçoPlanejadoRelease > capacidadeRelease
```

## 12.3 Feature sem histórias

Quando uma feature não possuir histórias.

## 12.4 História sem estimativa

Quando uma história não possuir story points ou dias estimados.

## 12.5 História vazada

Quando uma história for movida automaticamente por encerramento de sprint.

## 12.6 Sprint sem meta

Quando uma sprint não possuir objetivo/meta.

## 12.7 Sprint sem histórias

Quando uma sprint estiver vazia.

---

## 13. Critérios de aceite

## 13.1 Cadastro de release

Dado que o usuário informa nome, período e duração da sprint, quando salva a release, então o sistema cria automaticamente as sprints dentro do período informado.

## 13.2 Capacidade da sprint

Dado que a Squad possui membros cadastrados, férias, folgas e feriados, quando o usuário visualiza uma sprint, então o sistema exibe a capacidade bruta, líquida e em dias úteis.

## 13.3 Planejamento acima da capacidade

Dado que uma sprint possui capacidade de 20 dias, quando o usuário adiciona histórias que somam 25 dias, então o sistema permite a ação, mas exibe alerta de estouro de 5 dias.

## 13.4 Feature soma histórias

Dado que uma feature possui três histórias de 3, 5 e 8 story points, quando o usuário visualiza a feature, então o sistema exibe 16 story points totais.

## 13.5 Encerrar sprint

Dado que uma sprint possui histórias em Backlog da Sprint, Em Execução e Finalizado, quando o usuário encerra a sprint, então as histórias não finalizadas são movidas para a próxima sprint e as finalizadas permanecem na sprint encerrada.

## 13.6 Criar próxima sprint automaticamente

Dado que uma sprint é a última da release, quando ela é encerrada com histórias não finalizadas, então o sistema cria uma nova sprint automaticamente e move as histórias não finalizadas para ela.

## 13.7 História vazada

Dado que uma história não finalizada é movida para a próxima sprint no encerramento, quando o usuário consulta histórico, então o sistema mostra que a história vazou da sprint anterior.

## 13.8 Reabrir sprint

Dado que uma sprint está encerrada, quando o usuário clica em reabrir, então o sistema permite editar a sprint novamente.

## 13.9 Timeline

Dado que uma feature possui histórias distribuídas entre Sprint 1 e Sprint 3, quando o usuário visualiza a timeline da release, então o sistema mostra a feature iniciando na Sprint 1 e terminando na Sprint 3.

## 13.10 MCP consulta release

Dado que o servidor MCP está ativo, quando um agente chama `get_active_release`, então o sistema retorna dados resumidos da release ativa.

## 13.11 IA sugere risco

Dado que uma sprint está acima da capacidade, quando o usuário pergunta à IA sobre riscos da release, então a IA deve apontar a sprint acima da capacidade e explicar o motivo.

---

## 14. Fluxos principais

## 14.1 Criar planejamento de release

1. Usuário cadastra Squad.
2. Usuário cadastra membros.
3. Usuário cadastra férias, folgas e feriados.
4. Usuário cria release.
5. Sistema gera sprints.
6. Usuário cria features.
7. Usuário quebra features em histórias.
8. Usuário estima histórias em story points e dias.
9. Usuário distribui histórias nas sprints.
10. Sistema exibe capacidade, alertas e timeline.

## 14.2 Executar sprint

1. Usuário abre sprint.
2. Usuário visualiza board.
3. Usuário move histórias entre colunas.
4. Sistema atualiza status.
5. Usuário acompanha capacidade e progresso.
6. Usuário encerra sprint.
7. Sistema move histórias não finalizadas para próxima sprint.
8. Sistema registra vazamentos.

## 14.3 Consultar IA

1. Usuário abre assistente.
2. Usuário pergunta sobre release, sprint, capacidade ou risco.
3. Assistente consulta dados via MCP.
4. Assistente responde com análise.
5. Se sugerir alteração, a alteração não é aplicada automaticamente sem comando explícito.

---

## 15. Requisitos não funcionais

## 15.1 Execução local

O sistema deve funcionar localmente na máquina do usuário.

## 15.2 Simplicidade

A instalação deve ser simples, preferencialmente com comandos padronizados.

Exemplo:

```text
npm install
npm run dev
```

Ou empacotado com script único:

```text
start.bat
```

## 15.3 Performance

O sistema deve responder rapidamente para uma Squad típica.

Volume esperado:

```text
1 Squad
1 release ativa
Até 20 sprints por release
Até 100 features
Até 1000 histórias
Até 30 membros
```

## 15.4 Offline

O sistema deve funcionar sem internet para funcionalidades principais.

Recursos de IA podem depender da ferramenta/agente utilizada pelo usuário, mas o MCP deve funcionar localmente.

## 15.5 Portabilidade

O banco SQLite deve poder ser copiado para backup ou transferência.

## 15.6 Segurança

Por padrão, o sistema deve escutar apenas em localhost.

Nenhuma API deve ser exposta externamente sem configuração explícita.




## 18. Decisões tomadas para a primeira versão

As decisões abaixo foram assumidas para fechar a SPEC:

1. O app será local, web e acessado por navegador.
2. O banco será SQLite.
3. Não haverá login na primeira versão.
4. Só haverá uma release ativa por vez.
5. Story points não serão usados para capacidade.
6. Capacidade será calculada em horas e convertida para dias.
7. Dias estimados das histórias serão usados para capacidade.
8. O planejamento poderá ultrapassar capacidade, mas com alerta.
9. O percentual de feature e release será calculado por story points finalizados.
10. A sprint poderá ser reaberta.
11. Histórias vazadas manterão status.
12. A última sprint da release absorverá dias restantes para evitar sprint final pequena.
13. MCP entra na primeira versão.
14. IA poderá sugerir, consultar e explicar, mas alterações sensíveis exigem ação explícita.
15. O sistema será desenhado para uso por uma Squad local, não como SaaS.

---
