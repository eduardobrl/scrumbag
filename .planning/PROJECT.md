# Scrumbag

## What This Is

Um app web leve de **capacity planning e sprint management** para times Scrum. Lê planilhas Excel de uma pasta sincronizada no OneDrive, permite planejar features, histórias e épicos com estimativas, calcula capacity real da squad considerando ausências e desperdícios, e prevê entregas. Inclui um servidor MCP para que agentes de IA possam consultar os dados e auxiliar na tomada de decisões. Desenvolvido para uso de Tech Lead, PM e gestora de portfólio em ambiente corporativo com restrições de instalação de software.

## Core Value

Permitir o planejamento realista de sprints com capacity ajustada à realidade da squad (ausências, desperdício), gerando previsões confiáveis de entrega de épicos.

## Requirements

### Validated

- [x] Estimar historias em story points e dias de trabalho - Validated in Phase 3: Sprint Planning, Board & Estimation
- [x] Visualizar e gerenciar board de sprint - Validated in Phase 3: Sprint Planning, Board & Estimation
- [x] Priorizar backlog e sprint por drag-and-drop - Validated in Phase 3: Sprint Planning, Board & Estimation
- [x] Planejar releases antes dos sprints, com sprints pertencendo a uma release - Validated in Phase 4: Release Planning UX Redesign
- [x] Planejar features em uma timeline de release por sprints, com avisos de capacidade - Validated in Phase 4: Release Planning UX Redesign
- [x] Criar historias e bugs dentro de features, evitando itens orfaos - Validated in Phase 4: Release Planning UX Redesign
- [x] Abrir sprint em tela dedicada com abas de Board, Planning, Capacity e Closure - Validated in Phase 4: Release Planning UX Redesign
- [x] Cadastrar e gerenciar membros da squad - Validated in Phase 2: Squad & Capacity Engine
- [x] Registrar ausências, férias, folgas não compensadas e feriados - Validated in Phase 2: Squad & Capacity Engine
- [x] Calcular capacity real da sprint com ajustes de disponibilidade - Validated in Phase 2: Squad & Capacity Engine
- [x] Calcular desperdícios (reuniões, suporte, incidentes) com tolerância configurável - Validated in Phase 2: Squad & Capacity Engine

### Active

- [ ] Ler e sincronizar planilhas Excel de pasta no OneDrive
- [ ] Visualizar épicos com previsão de entrega
- [ ] Sugerir histórias que cabem na capacity da sprint
- [ ] Expor dados via servidor MCP para agentes de IA
- [ ] Funcionar sem instalação (web app) em ambiente corporativo restrito

### Out of Scope

- Integração direta com Jira/Azure DevOps — a ferramenta interna da empresa não permite APIs
- Mobile app nativo — web app responsivo é suficiente
- Autenticação multiusuário complexa — uso interno entre 3 pessoas
- Edição colaborativa em tempo real — sincronização via OneDrive já resolve
- Notificações automáticas — fora do escopo de MVP
- Relatórios avançados/BI — dashboards básicos são suficientes

## Context

- Ambiente corporativo com restrições de instalação de software
- Ferramenta interna da empresa não oferece capacity planning nem previsão de épicos
- Dados de entrada vêm de planilhas Excel em pasta sincronizada no OneDrive
- Squad atual não tem acesso a ferramentas de mercado (Jira, etc.)
- Três usuários principais: Tech Lead (você), PM e gestora de portfólio

## Constraints

- **Instalação**: Não pode instalar apps desktop por política de segurança — deve rodar no navegador ou ser executável sem instalação
- **Dados**: Fonte primária são arquivos Excel em pasta do OneDrive; o app deve detectar mudanças nos arquivos
- **Público**: Uso interno entre 3 pessoas; não precisa de escalabilidade massiva
- **Offline-first**: Deve funcionar localmente mesmo com conectividade intermitente

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Web app sem instalação | Restrições de segurança corporativa | — Pending |
| Excel/OneDrive como fonte de dados | Ferramenta interna não tem API; Excel é o formato usado hoje | — Pending |
| Estimativa em story points + dias | Time já familiarizado com story points; dias ajudam na previsão de calendário | — Pending |
| Servidor MCP embutido | Permitir que agentes de IA consultem dados para decisões de planejamento | — Pending |
| Manual entry para histórias | Não há integração automática disponível com a ferramenta interna | — Pending |
| Capacity final pós-waste e override | Planejamento deve usar a capacidade final após ausências, feriados, desperdício e ajustes manuais | Validated in Phase 2 |

## Evolution

Phase 3 completion note: sprint board closure now preserves status, estimates, and completed_at for Phase 4 velocity and analytics.

Phase 4 completion note: release-first planning is now the primary workflow, with release-scoped sprints, feature timelines, capacity warnings, and feature-first child backlog rules.

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-02 after Phase 4 completion*
