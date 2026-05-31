# Feature Research

**Domain:** Scrum capacity planning and sprint management web app
**Researched:** 2026-05-30
**Confidence:** HIGH (based on extensive market analysis of agile tools and specific project constraints)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Backlog Management** | Core artifact of Scrum; teams need a structured place for stories, features, bugs, and epics | Medium | Must support hierarchy (epics → features → stories). Drag-and-drop prioritization is expected. |
| **Sprint Planning & Time-boxing** | Sprints are the heartbeat of Scrum; users expect to create sprints with start/end dates and goals | Low-Medium | 2-week sprints are most common. Must allow manual scope selection from backlog. |
| **Story Point Estimation** | Universal currency for Scrum teams to size work relative to each other | Low | Fibonacci scale (1, 2, 3, 5, 8, 13, 21) is standard. Support for planning poker optional. |
| **Sprint Board (Kanban/Scrum)** | Visualizing workflow stages is non-negotiable; every tool has this | Medium | Minimum: To Do, In Progress, Done. Custom columns nice-to-have. |
| **Velocity Tracking** | Teams use historical velocity to plan future sprints; without this, capacity planning is guesswork | Low | Simple rolling average of completed story points per sprint over last 3-5 sprints. |
| **Basic Burndown Chart** | Standard visual for monitoring sprint health during daily standups | Low | Plot ideal vs. actual remaining effort by day. |
| **Team Member Management** | Capacity planning requires knowing who is on the team and their typical availability | Low | Names, roles, typical capacity (e.g., 6.5h/day), and skill tags. |
| **Work Item Hierarchy** | Epics contain features, features contain stories; users expect parent-child relationships | Medium | Essential for portfolio-level forecasting. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Realistic Capacity Calculation** | Most tools assume 100% availability; adjusting for absences, holidays, and part-time status is rare and highly valued | Medium | Calculate: `(team members × daily hours × sprint days) − absences − holidays`. This is the #1 promised value. |
| **Waste/Overhead Tracking** | Explicitly accounting for meetings, support, incidents, and context switching is almost never built into tools | Medium | Configurable categories with tolerance thresholds. E.g., "max 15% on support." |
| **Epic Delivery Forecasting** | Connecting sprint-level capacity to long-term epic completion dates | Medium-High | Monte Carlo or simple linear projection based on adjusted velocity. Critical for portfolio manager. |
| **Excel/OneDrive Synchronization** | Turning the corporate constraint (Excel-only data source) into a seamless input method | Medium | Auto-detect file changes, parse structured sheets, map to internal data model. |
| **AI Agent Integration (MCP Server)** | Allowing AI agents to query capacity, suggest stories, and assist in planning decisions | Medium | Exposes capacity, backlog, and forecasts via standardized MCP protocol. Novel in this space. |
| **Sprint Story Suggestions** | Intelligently recommending which stories fit in the remaining adjusted capacity | Low-Medium | Based on story points + priority + dependencies. Reduces manual math during planning. |
| **Offline-First Web App** | Functioning without installation and with intermittent connectivity addresses the core deployment constraint | Medium | Service Workers, local storage/IndexedDB, sync when online. |
| **Dual Estimation (Story Points + Days)** | Supporting both abstract points and concrete calendar days for different planning horizons | Low | Story points for sprint planning; days for epic/calendar forecasting. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems or conflict with project constraints.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Complex Multi-User Authentication** | "Enterprise apps need SSO/roles" | Only 3 internal users; SSO overhead is waste for this use case | Simple local auth or none; trust boundary is the corporate network |
| **Native Mobile App** | "Users want to manage sprints on their phones" | PROJECT.md explicitly excludes this; native apps require installation (forbidden by corporate policy) | Responsive CSS/Grid; maybe PWA for home-screen shortcut |
| **Real-Time Collaborative Editing** | "Google Docs does it, why can't we?" | OneDrive sync already resolves data sync; building OT/CRDT is massive overkill for 3 users | Optimistic UI with periodic sync; show "syncing" status |
| **Automatic Notifications/Alerts** | "Teams need to know when things change" | Out of scope per PROJECT.md; corporate users already have email/Teams | Manual status checks; optional on-screen reminders only |
| **Advanced BI/Dashboards** | "Management loves Tableau-style reports" | "Dashboards básicos são suficientes" per PROJECT.md; complex reporting distracts from core capacity planning | Simple, focused charts: burndown, velocity trend, epic forecast |
| **Direct Jira/Azure DevOps Integration** | "Everyone integrates with Jira" | Explicitly out of scope; corporate tool has no API. Attempting this is impossible given constraints | Excel/OneDrive bridge as the canonical integration point |
| **Built-in Chat/Messaging** | "Teams need to discuss stories" | Reinventing Slack/Teams; adds complexity with zero differentiation | Link out to corporate Teams or rely on existing channels |
| **Complex Workflow Engine** | "Our process is unique" | Every team does Scrum slightly differently, but custom workflows are a rabbit hole that kills momentum | 3-4 fixed statuses max; convention over configuration |
| **Public API/REST Server** | "We might need API access later" | MCP server is the chosen integration pattern; maintaining two APIs doubles surface area | Expose MCP only; if REST needed later, generate from MCP schema |
| **Time Tracking per Task** | "We need to know where time goes" | Conflicts with story points; encourages hour-counting over outcome-focus | Track at sprint level only (capacity vs. actual), not per-task |

## Feature Dependencies

```
Team Member Management
    └──requires──> Absence/Holiday Tracking
                        └──requires──> Realistic Capacity Calculation
                                            └──requires──> Sprint Story Suggestions
                                            └──requires──> Epic Delivery Forecasting

Backlog Management
    └──requires──> Work Item Hierarchy
                        └──enhances──> Epic Delivery Forecasting

Story Point Estimation
    └──requires──> Velocity Tracking
                        └──requires──> Epic Delivery Forecasting

Excel/OneDrive Sync
    └──enhances──> Backlog Management (initial population)
    └──enhances──> Team Member Management (initial population)

Realistic Capacity Calculation
    └──enhances──> Waste/Overhead Tracking
    └──enhances──> Sprint Story Suggestions
```

### Dependency Notes

- **Realistic Capacity Calculation requires Absence/Holiday Tracking:** Without knowing who is unavailable, capacity is just headcount × hours, which is the naive calculation every other tool already does.
- **Epic Delivery Forecasting requires Velocity Tracking:** Forecasts need historical data; otherwise they're pure guesswork.
- **Excel/OneDrive Sync enhances Backlog Management:** Initial population and bidirectional sync reduce manual data entry burden in corporate context.
- **Realistic Capacity Calculation enhances Waste/Overhead Tracking:** Waste deduction is a multiplier on base capacity; they work together but waste tracking can be simplified to a flat percentage in v1.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] **Backlog Management** — Table stakes; nothing works without this
- [ ] **Team Member Management + Absence Tracking** — Foundation for capacity calculation
- [ ] **Realistic Capacity Calculation** — Core differentiator; the reason this tool exists
- [ ] **Sprint Planning & Board** — Table stakes; enables daily use
- [ ] **Story Point Estimation + Velocity Tracking** — Required for forecasting
- [ ] **Epic Delivery Forecasting** — Secondary differentiator; critical for portfolio manager
- [ ] **Excel/OneDrive Sync** — Makes data entry viable in corporate context
- [ ] **Basic Burndown Chart** — Expected by Scrum practitioners

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **MCP Server** — Can be added after data model stabilizes; early API churn would break AI agents
- [ ] **Sprint Story Suggestions** — Requires stable capacity + estimation first
- [ ] **Waste/Overhead Tracking** — Start with simple percentage deduction; advanced categorization later
- [ ] **Offline-First Support** — Important but can be v1.x; start with online-only to validate core mechanics

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Planning Poker Integration** — Nice for estimation ceremonies, but manual entry works fine for 3 users
- [ ] **Custom Board Columns** — Fixed workflow is fine until team scales or diversifies
- [ ] **Multi-Squad/Portfolio Views** — Currently one squad; add when managing multiple teams
- [ ] **Advanced Analytics (Cycle Time, CFD)** — Useful but not essential for core capacity planning

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Backlog Management | HIGH | Medium | P1 |
| Sprint Planning & Board | HIGH | Medium | P1 |
| Story Point Estimation | HIGH | Low | P1 |
| Team Member Management | HIGH | Low | P1 |
| Realistic Capacity Calculation | HIGH | Medium | P1 |
| Velocity Tracking | HIGH | Low | P1 |
| Epic Delivery Forecasting | HIGH | Medium-High | P1 |
| Excel/OneDrive Sync | HIGH | Medium | P1 |
| Basic Burndown Chart | MEDIUM | Low | P1 |
| Absence/Holiday Tracking | HIGH | Low | P1 |
| Dual Estimation (Points + Days) | MEDIUM | Low | P2 |
| Sprint Story Suggestions | MEDIUM | Low-Medium | P2 |
| Waste/Overhead Tracking | MEDIUM | Medium | P2 |
| Offline-First Support | MEDIUM | Medium | P2 |
| MCP Server | MEDIUM | Medium | P2 |
| Work Item Hierarchy | MEDIUM | Medium | P2 |
| Planning Poker | LOW | Medium | P3 |
| Custom Board Columns | LOW | Low | P3 |
| Multi-Squad Views | LOW | High | P3 |
| Advanced Analytics | LOW | High | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Jira | Azure DevOps | Monday.com | Zoho Sprints | Our Approach |
|---------|------|--------------|------------|--------------|--------------|
| Backlog Management | Deep hierarchy, JQL filtering | Portfolio backlogs, area paths | Visual boards, item linking | Backlog, epics, custom types | Simple hierarchy, focused on planning |
| Sprint Planning | Native, scope control, capacity | Sprint forecasting, taskboards | Sprint management, automations | Dedicated sprint modules | Capacity-aware with adjusted availability |
| Capacity Planning | Story points, sprint capacity | Capacity, assigned work visibility | Team load views | Estimation, time tracking | **Realistic capacity with absences + waste** |
| Epic Forecasting | Roadmaps, releases | Delivery Plans, portfolio backlogs | Roadmap planning | Release management, epics | **Linear/Monte Carlo based on adjusted velocity** |
| Data Input | Native/Jira only | Native/Azure only | Integrations, manual | Integrations, manual | **Excel/OneDrive sync as primary source** |
| AI Integration | Atlassian Intelligence (Rovo) | Copilot, limited | monday AI | Zia (limited) | **MCP server for agent queries** |
| Offline Support | No | No | No | No | **Offline-first web app** |
| Installation | Cloud/on-premise | Cloud/on-premise | Cloud | Cloud | **No installation, browser-only** |

Key insight: Competitors treat capacity as a simple multiplication (headcount × velocity). None adjust for real-world absences, holidays, and overhead waste in the way Scrumbag proposes. The Excel bridge and MCP server are unique positioning in this landscape.

## Sources

- [Smartsheet — 12 Best Agile Management Software Tools in 2026](https://www.smartsheet.com/content/best-agile-management-software) (HIGH confidence — comprehensive feature comparison of 12 major tools)
- [Upskillist — 10 Best Agile Tools for Scrum Teams 2026](https://www.upskillist.com/blog/10-best-agile-tools-for-scrum-teams-2025/) (HIGH confidence — detailed feature breakdowns, pricing, and use cases)
- [Wikipedia — Scrum (software development)](https://en.wikipedia.org/wiki/Scrum_(software_development)) (HIGH confidence — authoritative framework reference)
- PROJECT.md (HIGH confidence — direct project constraints, decisions, and out-of-scope items)

---
*Feature research for: Scrum capacity planning and sprint management web app*
*Researched: 2026-05-30*
