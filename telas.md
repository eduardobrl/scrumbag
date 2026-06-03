# SPEC de Telas — Squad Planner

## 1. Visão geral da navegação

O app terá uma navegação lateral fixa com as principais áreas:

```text
+-------------------------------------------------------------+
| Squad Planner                                               |
+----------------------+--------------------------------------+
| Dashboard            |                                      |
| Releases             |                                      |
| Features/Histórias   |          Conteúdo da tela             |
| Backlog              |                                      |
| Sprints              |                                      |
| Squad                |                                      |
| Relatórios           |                                      |
| Assistente IA        |                                      |
+----------------------+--------------------------------------+
```

## 1.1 Menu lateral

Itens:

```text
Dashboard
Releases
Features / Histórias
Backlog
Sprints
Squad
Relatórios
Assistente IA
Configurações
```

## 1.2 Header global

Todas as telas terão um header superior com:

* nome da release ativa;
* status da release;
* botão de troca/seleção de release;
* indicador rápido de capacidade;
* botão para abrir Assistente IA.

Exemplo:

```text
+-------------------------------------------------------------------+
| Release Ativa: Release Q3 2026 | Em andamento | Capacidade: 87%   |
|                                                    [Assistente IA] |
+-------------------------------------------------------------------+
```

---

# 2. Tela Dashboard

## 2.1 Objetivo

Dar uma visão executiva da release ativa.

Deve responder rapidamente:

* a release está dentro da capacidade?
* qual o progresso geral?
* quais sprints estão em risco?
* quais features estão atrasando?
* quantas histórias vazaram?
* qual é a previsão de término das features?

---

## 2.2 Esboço

```text
+--------------------------------------------------------------------------------+
| Dashboard                                                                       |
| Release ativa: Release Q3 2026                         [Exportar] [IA]         |
+--------------------------------------------------------------------------------+

+-------------------+ +-------------------+ +-------------------+ +-------------+
| Progresso Release | | Capacidade Total  | | Esforço Planejado | | Risco       |
| 42%               | | 180 dias          | | 195 dias          | | Acima +15d  |
+-------------------+ +-------------------+ +-------------------+ +-------------+

+--------------------------------------------------------------------------------+
| Alertas                                                                         |
| ⚠ Sprint 4 acima da capacidade em 6 dias                                        |
| ⚠ Feature "Onboarding Digital" atravessa 5 sprints                             |
| ⚠ 3 histórias vazaram da Sprint 2                                               |
+--------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------+
| Timeline das Features                                                           |
|                                                                                |
| Feature                         S1        S2        S3        S4        S5      |
| Onboarding Digital              █████████████████████                          |
| Nova Autenticação                         █████████████████████                |
| Relatório Gerencial                                  █████████████████         |
| Integração API Externa          █████████████████████████████████████          |
+--------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------+
| Sprints                                                                         |
| Sprint      Período        Capacidade   Planejado   Status                     |
| Sprint 1    01/07-12/07    28d          26d         OK                         |
| Sprint 2    15/07-26/07    25d          31d         Acima +6d                  |
| Sprint 3    29/07-09/08    30d          29d         OK                         |
+--------------------------------------------------------------------------------+
```

---

## 2.3 Componentes

### Cards superiores

Cards:

```text
Progresso da Release
Capacidade Total
Esforço Planejado
Risco
Features
Histórias
Histórias Vazadas
```

### Painel de alertas

Exibe alertas ordenados por severidade.

Tipos de alerta:

```text
Sprint acima da capacidade
Release acima da capacidade
Feature sem histórias
História sem estimativa
História vazada
Sprint sem meta
Sprint sem histórias
```

### Timeline das features

Mostra cada feature em linha e as sprints como colunas.

Cada feature deve exibir:

* nome;
* início previsto;
* fim previsto;
* percentual de conclusão;
* sprints com atividade;
* sprints sem atividade dentro do intervalo;
* indicador de feature finalizada.

### Tabela de sprints

Exibe resumo de cada sprint.

Campos:

```text
Sprint
Período
Capacidade líquida
Esforço planejado
Capacidade restante
Percentual de ocupação
Status
```

---

## 2.4 Ações

```text
Abrir release
Abrir sprint
Abrir feature
Exportar dashboard
Perguntar para IA
```

---

## 2.5 Comportamentos

Ao clicar em uma sprint na tabela, o usuário vai para a tela da sprint.

Ao clicar em uma feature na timeline, o usuário vai para o detalhe da feature.

Ao clicar em um alerta, o usuário é levado para a tela correspondente.

Exemplo:

```text
Alerta: Sprint 4 acima da capacidade
Clique → abre Tela da Sprint 4
```

---

# 3. Tela Releases

## 3.1 Objetivo

Criar, configurar e acompanhar releases.

---

## 3.2 Esboço — Lista de releases

```text
+--------------------------------------------------------------------------------+
| Releases                                                        [+ Nova Release]|
+--------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------+
| Filtros: [Status v] [Texto livre____________________]                           |
+--------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------+
| Nome                 Período          Status          Progresso     Capacidade  |
| Release Q3 2026      01/07-30/09      Em andamento    42%           108%        |
| Release Q4 2026      01/10-20/12      Planejada       0%            0%          |
+--------------------------------------------------------------------------------+
```

---

## 3.3 Esboço — Criar/editar release

```text
+--------------------------------------------------------------------------------+
| Nova Release                                                                    |
+--------------------------------------------------------------------------------+

Nome
[ Release Q3 2026________________________________________________ ]

Objetivo
[ Entregar melhorias do fluxo de onboarding______________________ ]

Descrição
[________________________________________________________________]
[________________________________________________________________]

Data início        Data fim
[01/07/2026]       [30/09/2026]

Duração padrão da sprint em dias úteis
[10]

Percentual de reuniões da Squad
[10%]

Percentual de sustentação da release
[20%]

Status
[Planejada v]

[Cancelar]                                      [Salvar e gerar sprints]
```

---

## 3.4 Esboço — Detalhe da release

```text
+--------------------------------------------------------------------------------+
| Release Q3 2026                                      [Editar] [Exportar] [IA]   |
+--------------------------------------------------------------------------------+

Objetivo: Entregar melhorias do fluxo de onboarding
Período: 01/07/2026 até 30/09/2026
Status: Em andamento

+-------------------+ +-------------------+ +-------------------+ +-------------+
| Capacidade Total  | | Planejado         | | Restante          | | Ocupação    |
| 180d              | | 195d              | | -15d              | | 108%        |
+-------------------+ +-------------------+ +-------------------+ +-------------+

+--------------------------------------------------------------------------------+
| Sprints geradas                                                                |
| Sprint      Período        Capacidade   Planejado   Restante   Status          |
| Sprint 1    01/07-12/07    28d          26d         +2d        Aberta          |
| Sprint 2    15/07-26/07    25d          31d         -6d        Aberta          |
| Sprint 3    29/07-09/08    30d          29d         +1d        Planejada       |
+--------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------+
| Timeline das Features                                                           |
| Feature                         S1        S2        S3        S4        S5      |
| Onboarding Digital              █████████████████████                          |
| Nova Autenticação                         █████████████████████                |
+--------------------------------------------------------------------------------+
```

---

## 3.5 Regras da tela

Ao criar uma release, o sistema gera automaticamente as sprints.

Se a duração padrão não couber exatamente no período, a última sprint absorve o restante.

A tela deve recalcular capacidade sempre que:

```text
datas da release mudarem
percentual de reuniões mudar
percentual de sustentação mudar
membros da Squad mudarem
férias ou folgas mudarem
feriados mudarem
datas das sprints mudarem
```

---

# 4. Tela Features / Histórias

## 4.1 Objetivo

Cadastrar features e quebrá-las em histórias estimadas.

---

## 4.2 Esboço — Lista de features

```text
+--------------------------------------------------------------------------------+
| Features / Histórias                                           [+ Nova Feature] |
+--------------------------------------------------------------------------------+

Release: [Release Q3 2026 v]
Filtros: [Status v] [Texto livre____________________]

+--------------------------------------------------------------------------------+
| Feature              Status         SP     Dias     Progresso     Período       |
| Onboarding Digital   Em andamento   34     18d      45%           S1-S3         |
| Nova Autenticação    Não iniciada   21     11d      0%            S2-S4         |
| Relatório Gerencial  Finalizada     13     7d       100%          S1-S2         |
+--------------------------------------------------------------------------------+
```

---

## 4.3 Esboço — Detalhe da feature

```text
+--------------------------------------------------------------------------------+
| Feature: Onboarding Digital                         [Editar] [+ Nova História] |
+--------------------------------------------------------------------------------+

Descrição:
Permitir que novos usuários completem o onboarding com menos fricção.

+-------------------+ +-------------------+ +-------------------+ +-------------+
| Status            | | Story Points      | | Dias Estimados    | | Progresso   |
| Em andamento      | | 34                | | 18d               | | 45%         |
+-------------------+ +-------------------+ +-------------------+ +-------------+

+--------------------------------------------------------------------------------+
| Histórias                                                                       |
| Título                         Status              SP     Dias      Sprint      |
| Criar tela inicial             Finalizado          5      2d        Sprint 1    |
| Criar API de cadastro          Em Execução         8      4d        Sprint 2    |
| Enviar evento de conclusão     Backlog Sprint      5      3d        Sprint 3    |
| Criar logs de auditoria        Backlog             3      2d        -           |
+--------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------+
| Timeline da feature                                                             |
| Sprint 1      Sprint 2      Sprint 3      Sprint 4                              |
| █████████████████████████                                                       |
+--------------------------------------------------------------------------------+
```

---

## 4.4 Esboço — Criar/editar feature

```text
+--------------------------------------------------------------------------------+
| Nova Feature                                                                    |
+--------------------------------------------------------------------------------+

Release
[Release Q3 2026 v]

Nome
[________________________________________________________________]

Descrição
[________________________________________________________________]
[________________________________________________________________]

[Cancelar]                                                        [Salvar]
```

---

## 4.5 Esboço — Criar/editar história

```text
+--------------------------------------------------------------------------------+
| Nova História                                                                   |
+--------------------------------------------------------------------------------+

Feature
[Onboarding Digital v]

Título
[________________________________________________________________]

Descrição
[________________________________________________________________]
[________________________________________________________________]

Critérios de aceite
[________________________________________________________________]
[________________________________________________________________]

Story Points
[ 5 ]

Dias úteis estimados
[ 2 ]

Status
[Backlog v]

[Cancelar]                                                        [Salvar]
```

---

## 4.6 Comportamentos

Ao criar uma história, se nenhuma sprint for selecionada, ela entra no backlog geral.

Ao editar story points ou dias de uma história, a feature deve recalcular automaticamente:

```text
story points totais
dias totais
progresso
capacidade planejada
timeline
```

Ao cancelar uma história, ela não deve ser apagada. O status muda para:

```text
Cancelado
```

Histórias canceladas não contam em capacidade, progresso ou estimativa da feature.

---

# 5. Tela Backlog

## 5.1 Objetivo

Exibir histórias ainda não planejadas em sprints e permitir associação a uma sprint.

---

## 5.2 Esboço

```text
+--------------------------------------------------------------------------------+
| Backlog                                                                         |
+--------------------------------------------------------------------------------+

Release: [Release Q3 2026 v]
Feature: [Todas v]
Status:  [Backlog v]
Busca:   [Digite para buscar___________________________________]

+--------------------------------------------------------------------------------+
| Histórias não planejadas                                                        |
|                                                                                |
| Título                         Feature              SP    Dias    Ação          |
| Criar logs de auditoria        Onboarding Digital   3     2d      [Planejar]    |
| Criar template de e-mail       Nova Autenticação    5     3d      [Planejar]    |
| Criar fallback de erro         API Externa          2     1d      [Planejar]    |
+--------------------------------------------------------------------------------+
```

---

## 5.3 Modal — Planejar história

```text
+------------------------------------------------------------+
| Planejar história                                          |
+------------------------------------------------------------+

História:
Criar logs de auditoria

Feature:
Onboarding Digital

Story Points: 3
Dias: 2

Selecionar sprint
[Sprint 3 - 29/07 até 09/08 v]

Capacidade da sprint:
Capacidade líquida: 30d
Planejado atual:    29d
Após adicionar:     31d

⚠ Esta sprint ficará 1 dia acima da capacidade.

[Cancelar]                                      [Adicionar mesmo assim]
```

---

## 5.4 Comportamentos

O botão “Planejar” abre modal para escolher sprint.

Ao escolher uma sprint, o sistema mostra impacto na capacidade antes de confirmar.

Se a sprint ultrapassar capacidade, o sistema alerta, mas permite adicionar.

Depois de planejada, a história sai do backlog geral e entra no backlog da sprint.

---

# 6. Tela Sprints

## 6.1 Objetivo

Listar sprints da release e permitir acesso ao board operacional.

---

## 6.2 Esboço — Lista de sprints

```text
+--------------------------------------------------------------------------------+
| Sprints                                                                         |
+--------------------------------------------------------------------------------+

Release: [Release Q3 2026 v]

+--------------------------------------------------------------------------------+
| Sprint      Período        Status       Capacidade   Planejado   Ocupação       |
| Sprint 1    01/07-12/07    Encerrada    28d          26d         93%            |
| Sprint 2    15/07-26/07    Aberta       25d          31d         124% ⚠         |
| Sprint 3    29/07-09/08    Planejada    30d          29d         97%            |
+--------------------------------------------------------------------------------+
```

Ao clicar em uma sprint, abre o detalhe da sprint.

---

# 7. Tela Detalhe da Sprint

## 7.1 Objetivo

Configurar e acompanhar uma sprint específica.

---

## 7.2 Esboço

```text
+--------------------------------------------------------------------------------+
| Sprint 2                                                       [Editar Datas]   |
| 15/07/2026 até 26/07/2026                                      [Encerrar]       |
+--------------------------------------------------------------------------------+

Meta da Sprint
[ Finalizar autenticação e iniciar onboarding digital___________________________ ]

+-------------------+ +-------------------+ +-------------------+ +-------------+
| Capacidade Bruta  | | Capacidade Líquida| | Planejado         | | Restante    |
| 36d               | | 25d               | | 31d               | | -6d ⚠       |
+-------------------+ +-------------------+ +-------------------+ +-------------+

+--------------------------------------------------------------------------------+
| Adicionar história                                                             |
| [Buscar história no backlog____________________________________] [Adicionar]    |
+--------------------------------------------------------------------------------+

+-------------------------+-------------------------+----------------------------+
| Backlog da Sprint       | Em Execução             | Finalizado                 |
+-------------------------+-------------------------+----------------------------+
| [Card História A]       | [Card História C]       | [Card História E]          |
| SP: 5 | Dias: 2         | SP: 8 | Dias: 4         | SP: 3 | Dias: 1          |
| Feature: Onboarding     | Feature: Login          | Feature: Relatórios        |
|                         |                         |                            |
| [Card História B]       | [Card História D]       |                            |
| SP: 3 | Dias: 2         | SP: 5 | Dias: 3         |                            |
+-------------------------+-------------------------+----------------------------+
```

---

## 7.3 Card de história

Cada card deve mostrar:

```text
Título
Feature
Story points
Dias estimados
Indicador de vazamento, se houver
```

Exemplo:

```text
+-----------------------------+
| Criar API de cadastro       |
| Feature: Onboarding Digital |
| SP: 8 | Dias: 4             |
| ⚠ Vazou da Sprint 1         |
+-----------------------------+
```

---

## 7.4 Adicionar história à sprint

O campo de busca deve listar histórias do backlog geral.

Ao selecionar uma história, mostrar preview de impacto:

```text
+------------------------------------------------------------+
| Adicionar história                                         |
+------------------------------------------------------------+
| História: Criar logs de auditoria                          |
| Dias: 2                                                    |
|                                                            |
| Capacidade líquida: 25d                                    |
| Planejado atual: 31d                                       |
| Após adicionar: 33d                                        |
|                                                            |
| ⚠ Sprint ficará 8 dias acima da capacidade.                |
|                                                            |
| [Cancelar] [Adicionar mesmo assim]                         |
+------------------------------------------------------------+
```

---

## 7.5 Drag-and-drop

As colunas aceitam drag-and-drop.

Movimentos permitidos:

```text
Backlog da Sprint → Em Execução
Em Execução → Finalizado
Finalizado → Em Execução
Em Execução → Backlog da Sprint
Backlog da Sprint → Finalizado
Finalizado → Backlog da Sprint
```

Cada movimento atualiza o status da história.

---

## 7.6 Encerrar sprint

Ao clicar em “Encerrar Sprint”, abrir modal de confirmação.

```text
+------------------------------------------------------------+
| Encerrar Sprint 2                                          |
+------------------------------------------------------------+
| Histórias finalizadas: 3                                   |
| Histórias não finalizadas: 4                               |
|                                                            |
| As histórias não finalizadas serão movidas para Sprint 3.  |
| Elas manterão o status atual.                              |
| O vazamento será registrado no histórico.                  |
|                                                            |
| [Cancelar]                              [Encerrar Sprint]  |
+------------------------------------------------------------+
```

Se não existir próxima sprint:

```text
+------------------------------------------------------------+
| Encerrar Sprint 5                                          |
+------------------------------------------------------------+
| Esta é a última sprint da release.                         |
| Existem 3 histórias não finalizadas.                       |
|                                                            |
| O sistema criará automaticamente a Sprint 6 após o fim     |
| da Sprint 5 e moverá as histórias não finalizadas para lá. |
|                                                            |
| [Cancelar]                              [Criar e Encerrar] |
+------------------------------------------------------------+
```

---

## 7.7 Reabrir sprint

Se a sprint estiver encerrada, o botão principal muda para:

```text
[Reabrir Sprint]
```

Ao reabrir, exibir confirmação:

```text
+------------------------------------------------------------+
| Reabrir Sprint                                             |
+------------------------------------------------------------+
| Esta ação permitirá editar novamente a sprint.             |
| O histórico de vazamentos será mantido.                    |
|                                                            |
| [Cancelar]                                  [Reabrir]      |
+------------------------------------------------------------+
```

---

# 8. Tela Squad

## 8.1 Objetivo

Cadastrar membros, jornadas, férias, folgas e feriados.

---

## 8.2 Esboço

```text
+--------------------------------------------------------------------------------+
| Squad                                                          [+ Novo Membro]  |
+--------------------------------------------------------------------------------+

+-------------------+ +-------------------+ +-------------------+ +-------------+
| Membros ativos    | | Capacidade diária | | Ausências futuras | | Feriados    |
| 8                 | | 58h               | | 5                 | | 3           |
+-------------------+ +-------------------+ +-------------------+ +-------------+

+--------------------------------------------------------------------------------+
| Membros                                                                         |
| Nome                  Jornada          Horas/dia        Status       Ações      |
| Ana                   Full time        8h               Ativo        [Editar]   |
| Bruno                 Estagiário       6h               Ativo        [Editar]   |
| Carla                 Full time        8h               Inativo      [Editar]   |
+--------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------+
| Ausências                                                                       |
| Membro        Tipo        Início        Fim           Observação                |
| Ana           Férias      10/07         20/07         Férias                    |
| Bruno         Folga       15/07         15/07         Abonada                   |
+--------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------+
| Feriados                                                                        |
| Data          Nome                                                                  |
| 09/07         Revolução Constitucionalista                                          |
+--------------------------------------------------------------------------------+
```

---

## 8.3 Modal — Novo membro

```text
+------------------------------------------------------------+
| Novo Membro                                                |
+------------------------------------------------------------+

Nome
[____________________________________________]

Jornada
[Full time v]

Status
[Ativo v]

[Cancelar]                                      [Salvar]
```

---

## 8.4 Modal — Nova ausência

```text
+------------------------------------------------------------+
| Nova Ausência                                              |
+------------------------------------------------------------+

Membro
[Ana v]

Tipo
[Férias v]

Data início
[10/07/2026]

Data fim
[20/07/2026]

Observação
[____________________________________________]

[Cancelar]                                      [Salvar]
```

---

## 8.5 Modal — Novo feriado

```text
+------------------------------------------------------------+
| Novo Feriado                                               |
+------------------------------------------------------------+

Data
[09/07/2026]

Nome
[Revolução Constitucionalista_________________]

[Cancelar]                                      [Salvar]
```

---

## 8.6 Comportamentos

Ao cadastrar ou editar férias, folgas ou feriados, o sistema recalcula automaticamente a capacidade das sprints afetadas.

Se uma ausência estiver fora do período da release ativa, ela fica registrada, mas não afeta a release atual.

---

# 9. Tela Relatórios

## 9.1 Objetivo

Permitir exportação e análise do planejamento.

---

## 9.2 Esboço

```text
+--------------------------------------------------------------------------------+
| Relatórios                                                                      |
+--------------------------------------------------------------------------------+

Release
[Release Q3 2026 v]

Selecione o relatório

( ) Planejamento da release
( ) Capacidade por sprint
( ) Histórias por sprint
( ) Progresso por feature
( ) Histórias vazadas
( ) Esforço planejado versus capacidade
( ) Timeline da release

Formato
[Excel v]

[Gerar relatório]
```

---

## 9.3 Relatórios

### Planejamento da release

Contém:

```text
release
features
histórias
sprints
capacidade
planejado
status
```

### Capacidade por sprint

Contém:

```text
sprint
período
capacidade bruta
ausências
reuniões
sustentação
capacidade líquida
planejado
saldo
```

### Histórias por sprint

Contém:

```text
sprint
história
feature
status
story points
dias estimados
vazou de sprint anterior
```

### Progresso por feature

Contém:

```text
feature
status
story points totais
story points finalizados
dias totais
progresso
início previsto
fim previsto
```

### Histórias vazadas

Contém:

```text
história
feature
sprint origem
sprint destino
status no vazamento
data do vazamento
```

---

# 10. Tela Assistente IA

## 10.1 Objetivo

Permitir interação em linguagem natural com os dados do planejamento.

---

## 10.2 Esboço

```text
+--------------------------------------------------------------------------------+
| Assistente IA                                                                   |
+--------------------------------------------------------------------------------+

Contexto atual:
Release Q3 2026 | Em andamento | Ocupação 108% | 3 alertas

+--------------------------------------------------------------------------------+
| Sugestões rápidas                                                               |
| [Essa release cabe?] [Quais sprints estão em risco?] [Redistribuir histórias]   |
| [Quais features atrasam?] [Resumo para gestão]                                  |
+--------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------+
| Chat                                                                            |
|                                                                                |
| Usuário: Essa release cabe na capacidade atual?                                 |
|                                                                                |
| IA: Não. A release possui 180 dias de capacidade líquida e 195 dias planejados. |
|     O estouro atual é de 15 dias. As sprints mais críticas são Sprint 2 e       |
|     Sprint 4.                                                                   |
|                                                                                |
+--------------------------------------------------------------------------------+

[Digite sua pergunta____________________________________________________] [Enviar]
```

---

## 10.3 Sugestões rápidas

Botões sugeridos:

```text
Essa release cabe?
Quais sprints estão acima da capacidade?
Quais features estão em risco?
Quais histórias vazaram?
Sugira redistribuição de histórias
Gere resumo para gestão
Liste histórias sem estimativa
```

---

## 10.4 Comportamento

A IA deve consultar os dados via MCP.

A IA pode sugerir alterações, mas não aplica mudanças críticas automaticamente.

Exemplo:

```text
IA:
Sugiro mover a história "Criar logs de auditoria" da Sprint 2 para Sprint 3.
Isso reduziria o estouro da Sprint 2 de 6 dias para 4 dias.

[Aplicar sugestão] [Ignorar]
```

Ao clicar em “Aplicar sugestão”, o sistema deve pedir confirmação:

```text
+------------------------------------------------------------+
| Confirmar alteração                                        |
+------------------------------------------------------------+
| Mover história "Criar logs de auditoria"                  |
| De: Sprint 2                                               |
| Para: Sprint 3                                             |
|                                                            |
| [Cancelar]                                  [Confirmar]    |
+------------------------------------------------------------+
```

---

# 11. Tela Configurações

## 11.1 Objetivo

Configurar parâmetros gerais do app local.

---

## 11.2 Esboço

```text
+--------------------------------------------------------------------------------+
| Configurações                                                                   |
+--------------------------------------------------------------------------------+

Capacidade

Horas por dia - Full time
[8]

Horas por dia - Estagiário
[6]

Horas padrão para conversão em dias
[8]

Banco local
./data/squad-planner.db

Backup
[Exportar backup JSON] [Importar backup JSON]

MCP
[x] Habilitar servidor MCP local
Host: localhost
Porta: [3333]

[Salvar configurações]
```

---

# 12. Estados vazios

## 12.1 Sem release

```text
+------------------------------------------------------------+
| Nenhuma release criada                                     |
+------------------------------------------------------------+
| Crie sua primeira release para começar o planejamento.     |
|                                                            |
| [Criar Release]                                            |
+------------------------------------------------------------+
```

## 12.2 Sem Squad

```text
+------------------------------------------------------------+
| Squad ainda não configurada                                |
+------------------------------------------------------------+
| Cadastre os membros da Squad para calcular capacidade.     |
|                                                            |
| [Configurar Squad]                                         |
+------------------------------------------------------------+
```

## 12.3 Feature sem histórias

```text
+------------------------------------------------------------+
| Esta feature ainda não possui histórias                    |
+------------------------------------------------------------+
| Quebre a feature em histórias para estimar esforço.        |
|                                                            |
| [+ Nova História]                                          |
+------------------------------------------------------------+
```

## 12.4 Sprint sem histórias

```text
+------------------------------------------------------------+
| Nenhuma história nesta sprint                              |
+------------------------------------------------------------+
| Busque histórias no backlog para planejar esta sprint.     |
|                                                            |
| [Adicionar História]                                       |
+------------------------------------------------------------+
```

---

# 13. Validações de interface

## 13.1 Release

Campos obrigatórios:

```text
nome
data de início
data de fim
duração padrão da sprint
percentual de reuniões
percentual de sustentação
```

Validações:

```text
data fim deve ser maior que data início
duração da sprint deve ser maior que zero
percentual de reuniões deve estar entre 0 e 100
percentual de sustentação deve estar entre 0 e 100
soma de reuniões e sustentação não pode ser maior que 100
```

---

## 13.2 História

Campos obrigatórios:

```text
feature
título
story points
dias úteis estimados
```

Validações:

```text
story points deve ser maior ou igual a zero
dias úteis estimados deve ser maior ou igual a zero
história cancelada não pode ser movida para sprint
```

---

## 13.3 Sprint

Validações:

```text
sprint não pode sobrepor outra sprint da mesma release
sprint encerrada não pode receber novas histórias sem ser reaberta
sprint encerrada não pode ter status de história alterado sem ser reaberta
```

---

## 13.4 Squad

Validações:

```text
nome do membro é obrigatório
jornada é obrigatória
data fim da ausência deve ser maior ou igual à data início
ausência precisa estar vinculada a um membro
```

---

# 14. Padrões visuais

## 14.1 Indicadores de capacidade

```text
Até 85%: saudável
Entre 86% e 100%: atenção
Acima de 100%: acima da capacidade
```

## 14.2 Status visuais

História:

```text
Backlog
Backlog da Sprint
Em Execução
Finalizado
Cancelado
```

Sprint:

```text
Planejada
Aberta
Encerrada
```

Release:

```text
Planejada
Em andamento
Encerrada
Cancelada
```

Feature:

```text
Não iniciada
Em andamento
Finalizada
```

---

# 15. Fluxos detalhados

## 15.1 Fluxo: criar release

```text
Usuário acessa Releases
→ clica em Nova Release
→ preenche dados
→ clica em Salvar e gerar sprints
→ sistema valida dados
→ sistema gera sprints
→ sistema calcula capacidade
→ usuário é levado para detalhe da release
```

---

## 15.2 Fluxo: criar feature e histórias

```text
Usuário acessa Features/Histórias
→ clica em Nova Feature
→ preenche nome e descrição
→ salva
→ abre detalhe da feature
→ clica em Nova História
→ preenche título, descrição, critérios, SP e dias
→ salva
→ história entra no Backlog geral
→ feature recalcula totais
```

---

## 15.3 Fluxo: planejar história na sprint

```text
Usuário acessa Backlog ou Sprint
→ seleciona história
→ escolhe sprint
→ sistema calcula impacto na capacidade
→ se ultrapassar, exibe alerta
→ usuário confirma
→ história muda para Backlog da Sprint
→ história passa a pertencer à sprint
```

---

## 15.4 Fluxo: executar sprint

```text
Usuário acessa Sprint
→ visualiza board
→ arrasta história para Em Execução
→ sistema atualiza status
→ arrasta história para Finalizado
→ sistema atualiza status
→ progresso da sprint, feature e release são recalculados
```

---

## 15.5 Fluxo: encerrar sprint

```text
Usuário acessa Sprint
→ clica em Encerrar Sprint
→ sistema mostra resumo
→ usuário confirma
→ histórias finalizadas permanecem
→ histórias não finalizadas vão para próxima sprint
→ se não houver próxima sprint, sistema cria uma
→ sistema registra vazamento
→ sprint muda para Encerrada
→ dashboard é recalculado
```

---

## 15.6 Fluxo: usar IA

```text
Usuário acessa Assistente IA
→ faz pergunta em linguagem natural
→ IA consulta dados via MCP
→ IA responde com análise
→ se sugerir alteração, mostra ação aplicável
→ usuário confirma ou ignora
```

---

# 16. Comportamento mobile

A primeira versão será otimizada para desktop.

Em telas menores:

* menu lateral pode virar menu recolhido;
* board da sprint pode virar colunas empilhadas;
* timeline pode ter rolagem horizontal;
* tabelas podem ter rolagem horizontal.

Mobile não será prioridade do MVP.

---

# 17. Priorização de implementação das telas

## Fase 1

```text
Layout base
Menu lateral
Dashboard simples
Squad
Releases
```

## Fase 2

```text
Features
Histórias
Backlog
Sprints
Board da Sprint
```

## Fase 3

```text
Encerramento de sprint
Histórico de vazamentos
Timeline
Alertas
```

## Fase 4

```text
Relatórios
Assistente IA
MCP
Configurações
```

---
