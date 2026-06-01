# Requirements: Scrumbag

**Defined:** 2026-05-30
**Core Value:** Permitir o planejamento realista de sprints com capacity ajustada à realidade da squad (ausências, desperdício), gerando previsões confiáveis de entrega de épicos.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Backlog & Hierarchy

- [ ] **BACK-01**: User can create and manage backlog items (stories, features, bugs, epics)
- [ ] **BACK-02**: User can organize work items in hierarchy (epics → features → stories)
- [x] **BACK-03**: User can prioritize backlog items via drag-and-drop

### Sprint Planning & Board

- [x] **SPRT-01**: User can create sprints with start date, end date, and goal
- [x] **SPRT-02**: User can select backlog items to include in a sprint
- [ ] **SPRT-03**: User can view and manage sprint board with columns (To Do, In Progress, Done)
- [x] **SPRT-04**: User can move items between board columns via drag-and-drop

### Estimation

- [x] **EST-01**: User can estimate stories using Fibonacci story points (1, 2, 3, 5, 8, 13, 21)
- [x] **EST-02**: User can estimate stories in work days

### Squad & Capacity

- [x] **TEAM-01**: User can register squad members with name, role, and typical daily capacity
- [x] **TEAM-02**: User can register absences, vacations, unpaid leave, and holidays
- [x] **CAP-01**: System calculates realistic sprint capacity adjusting for absences and holidays
- [x] **CAP-02**: System calculates capacity considering waste/overhead (meetings, support, incidents)
- [x] **CAP-03**: System shows transparent capacity breakdown with manual override option

### Velocity & Tracking

- [ ] **VEL-01**: System tracks velocity as rolling average of completed story points (last 3-5 sprints)
- [ ] **BURN-01**: System displays basic burndown chart (ideal vs actual remaining effort)

### Forecasting

- [ ] **FORE-01**: System forecasts epic delivery with confidence intervals (not single dates)
- [ ] **FORE-02**: System updates forecasts automatically when scope changes

### Integration

- [ ] **SYNC-01**: System detects changes in Excel files from OneDrive-synced folder
- [ ] **SYNC-02**: System imports Excel data into internal data model with content-hash validation

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### AI Integration

- **MCP-01**: MCP server exposes capacity, backlog, and forecast data for AI agent queries
- **MCP-02**: MCP server provides read-only tools first (query_capacity, list_sprints, get_backlog)

### Advanced Features

- **SUGG-01**: System suggests stories that fit remaining sprint capacity based on priority and dependencies
- **WASTE-01**: Advanced waste/overhead tracking with configurable categories and trend visualization
- **OFF-01**: Enhanced offline-first support with adaptive sync and sync status indicators
- **EXP-01**: JSON data export/backup functionality

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Complex multi-user auth/SSO | Only 3 internal users; corporate network is the trust boundary |
| Native mobile app | PROJECT.md explicitly excludes; violates "no installation" constraint |
| Real-time collaborative editing | OneDrive already syncs Excel; CRDT/OT is overkill for 3 users |
| Automatic notifications/alerts | Out of scope per PROJECT.md; users have email/Teams |
| Advanced BI/dashboards | "Dashboards básicos são suficientes" per PROJECT.md |
| Direct Jira/Azure DevOps integration | Corporate tool has no API; Excel/OneDrive is the canonical bridge |
| Built-in chat/messaging | Reinventing Slack/Teams; adds complexity with zero differentiation |
| Complex workflow engine | Fixed workflow is sufficient; convention over configuration |
| Public REST API | MCP is the chosen integration pattern |
| Time tracking per task | Conflicts with story points; track at sprint level only |
| Planning poker integration | Manual entry works for 3 users; defer to v2+ |
| Custom board columns | Fixed Kanban columns are sufficient for v1 |
| Multi-squad/portfolio views | One squad now; add when managing multiple teams |
| Advanced analytics (Cycle Time, CFD) | Useful but not essential for core capacity planning |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BACK-01 | Phase 1 | Pending |
| BACK-02 | Phase 1 | Pending |
| BACK-03 | Phase 3 | Complete |
| SPRT-01 | Phase 3 | Complete |
| SPRT-02 | Phase 3 | Complete |
| SPRT-03 | Phase 3 | Pending |
| SPRT-04 | Phase 3 | Complete |
| EST-01 | Phase 3 | Complete |
| EST-02 | Phase 3 | Complete |
| TEAM-01 | Phase 2 | Complete |
| TEAM-02 | Phase 2 | Complete |
| CAP-01 | Phase 2 | Complete |
| CAP-02 | Phase 2 | Complete |
| CAP-03 | Phase 2 | Complete |
| VEL-01 | Phase 4 | Pending |
| BURN-01 | Phase 4 | Pending |
| FORE-01 | Phase 4 | Pending |
| FORE-02 | Phase 4 | Pending |
| SYNC-01 | Phase 1 | Pending |
| SYNC-02 | Phase 1 | Pending |
| MCP-01 | v2 | Deferred |
| MCP-02 | v2 | Deferred |
| SUGG-01 | v2 | Deferred |
| WASTE-01 | v2 | Deferred |
| OFF-01 | v2 | Deferred |
| EXP-01 | v2 | Deferred |

**Coverage:**

- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-30*
*Last updated: 2026-05-30 after roadmap creation*
