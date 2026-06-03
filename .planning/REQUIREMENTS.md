# Requirements: Squad Planner

**Defined:** 2026-06-02
**Core Value:** A squad can see whether a release plan fits the team's real sprint capacity and adjust scope before delivery risk becomes invisible.

## v1 Requirements

Requirements for the initial release. Each maps to exactly one roadmap phase.

### Local App Foundation

- [x] **APP-01**: User can install dependencies and run the app locally from standard commands.
- [x] **APP-02**: User can access the app in a browser on localhost.
- [x] **APP-03**: User can navigate between Dashboard, Releases, Features/Stories, Backlog, Sprints, Squad, Reports, Assistant AI, and Settings.
- [x] **APP-04**: User can see active release context, release status, capacity indicator, and assistant access in a global header.
- [x] **APP-05**: User data persists locally in SQLite and survives app restarts.
- [x] **APP-06**: User can configure general capacity settings including full-time hours, intern hours, standard day hours, MCP host, and MCP port.

### Squad And Calendar

- [x] **SQUAD-01**: User can create, edit, activate, and deactivate squad members.
- [x] **SQUAD-02**: User can set each member as full time or intern.
- [x] **SQUAD-03**: User can register vacations and day-off absences for members.
- [x] **SQUAD-04**: User can register holidays that reduce capacity for all active members.
- [x] **SQUAD-05**: User can view daily gross capacity, future absences, holidays, and absence impact by sprint.

### Releases And Sprints

- [x] **REL-01**: User can create, edit, list, and inspect releases with name, objective, optional description, dates, sprint length, meeting percentage, support percentage, and status.
- [x] **REL-02**: User cannot set more than one release to in-progress status.
- [x] **REL-03**: User can save a release and have sprints generated automatically from start date, end date, and default sprint length in business days.
- [x] **REL-04**: Generated sprints are sequential, non-overlapping, and make the final sprint absorb remaining days instead of creating a very small final sprint.
- [x] **SPR-01**: User can list sprints for a release with period, status, capacity, planned effort, remaining capacity, occupancy, and risk.
- [x] **SPR-02**: User can edit sprint goal and dates.
- [x] **SPR-03**: System prevents overlapping sprints, warns about release gaps, and recalculates affected capacity after sprint date changes.

### Features, Stories, And Backlog

- [x] **FEAT-01**: User can create, edit, list, inspect, and cancel features for a release.
- [x] **FEAT-02**: User can create, edit, list, inspect, and cancel stories for a feature.
- [x] **FEAT-03**: User can enter story title, description, acceptance criteria, story points, estimated business days, status, and current sprint.
- [x] **FEAT-04**: System calculates feature story points and estimated days from non-canceled stories.
- [x] **FEAT-05**: System calculates feature status from its stories as not started, in progress, or finished.
- [x] **FEAT-06**: System calculates feature progress by finished story points, falling back to story count when story points are absent.
- [x] **BACK-01**: User can view stories not assigned to any sprint in a general backlog.
- [x] **BACK-02**: User can filter backlog by release, feature, status, free text, unplanned stories, and canceled stories.
- [x] **BACK-03**: User can plan a backlog story into a sprint after seeing the sprint capacity impact.
- [x] **BACK-04**: User can remove a story from a sprint and return it to general backlog with Backlog status.

### Sprint Execution And Capacity

- [ ] **BOARD-01**: User can open a sprint board with fixed columns Backlog da Sprint, Em Execucao, and Finalizado.
- [ ] **BOARD-02**: User can drag stories between board columns and have the story status update.
- [ ] **BOARD-03**: User can add stories from backlog to a sprint from the sprint screen.
- [ ] **BOARD-04**: User can see sprint gross capacity, net capacity, planned effort, remaining capacity, occupancy percentage, and over-capacity alerts.
- [ ] **CAP-01**: System calculates gross sprint capacity from active members, work schedule, and business days.
- [ ] **CAP-02**: System reduces capacity for vacations, day offs, and holidays.
- [ ] **CAP-03**: System applies meeting and support percentages to calculate net capacity.
- [ ] **CAP-04**: System normalizes net capacity hours into 8-hour days.
- [ ] **CAP-05**: System compares planned story estimated days with net capacity days and allows over-capacity planning with a clear warning.
- [ ] **SPR-04**: User can close a sprint only when closure rules are satisfied.
- [ ] **SPR-05**: System leaves finished stories in the closed sprint and moves unfinished stories to the next sprint while preserving status.
- [ ] **SPR-06**: System creates a next sprint automatically when the last sprint is closed with unfinished stories.
- [ ] **SPR-07**: System records story leakage history with origin sprint, destination sprint, event date, and status at event.
- [ ] **SPR-08**: User can reopen a closed sprint while preserving leakage history.

### Dashboard, Timeline, And Progress

- [ ] **DASH-01**: User can view active release dashboard cards for progress, total capacity, planned effort, risk, feature count, story count, finished story count, and leaked story count.
- [ ] **DASH-02**: User can view consolidated alerts for over-capacity sprints, over-capacity release, features without stories, stories without estimates, leaked stories, sprints without goals, and empty sprints.
- [ ] **DASH-03**: User can view a release timeline showing features across sprints, continuous feature spans, inactive gaps, completion progress, finished sprints, and leaked sprints.
- [ ] **DASH-04**: User can open related release, sprint, or feature screens from dashboard tables, timelines, and alerts.
- [ ] **PROG-01**: System calculates release progress by finished story points, falling back to story count when story points are absent.
- [ ] **PROG-02**: System calculates sprint progress by finished estimated days over planned estimated days.

### Reports, MCP, And AI Assistant

- [ ] **REP-01**: User can generate release planning, sprint capacity, stories by sprint, feature progress, leakage, planned-versus-capacity, and timeline reports.
- [ ] **REP-02**: User can export reports to CSV.
- [ ] **REP-03**: User can export reports to Excel.
- [ ] **MCP-01**: Local MCP server listens only on localhost by default.
- [ ] **MCP-02**: MCP exposes read tools for releases, active release, summaries, sprints, sprint capacity, features, stories, backlog, timeline, capacity report, and leakage report.
- [ ] **MCP-03**: MCP exposes suggestion tools for scope adjustments, story redistribution, capacity risks, late features, and release status explanation.
- [ ] **MCP-04**: MCP exposes explicit write tools for feature/story creation and updates, story movement, and story status changes.
- [ ] **MCP-05**: Critical MCP operations such as closing sprints, reopening sprints, and canceling stories or features require confirmation or dangerous-operation marking.
- [ ] **AI-01**: User can open a local AI assistant chat from the app.
- [ ] **AI-02**: User can ask quick prompts about release fit, risky sprints, risky features, leaked stories, redistribution, management summaries, and stories without estimates.
- [ ] **AI-03**: Assistant responses are grounded in app data through MCP.
- [ ] **AI-04**: Assistant can suggest changes but does not apply sensitive changes without explicit user confirmation.

## v2 Requirements

Deferred to future releases. Tracked but not in the current roadmap.

### Integrations

- **INT-01**: User can import or synchronize planning data with Jira.
- **INT-02**: User can import or synchronize planning data with Azure DevOps.
- **INT-03**: User can import or synchronize planning data with Trello.
- **INT-04**: User can import or synchronize planning data with GitHub.

### Advanced Planning

- **PLAN-01**: System can calculate squad velocity automatically from completed story points.
- **PLAN-02**: System can enforce WIP limits on sprint board columns.
- **PLAN-03**: User can assign stories to individual squad members.
- **PLAN-04**: User can model blocking dependencies between stories or features.
- **PLAN-05**: User can run multiple active releases or parallel sprint tracks.

### Collaboration And Deployment

- **COLL-01**: Multiple users can authenticate and collaborate in the same planning workspace.
- **COLL-02**: Admin can manage roles and permissions.
- **COLL-03**: Users can edit the plan collaboratively in real time.
- **DEP-01**: App can run against a remote database.
- **DEP-02**: App can be deployed to a shared corporate server.

## Out of Scope

Explicitly excluded from v1 to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Multi-user authentication | The app is local and single-user for v1. |
| Advanced permission control | No multi-user surface exists in v1. |
| Jira, Azure DevOps, Trello, or GitHub integration | The app is an auxiliary local planning tool in v1. |
| Automatic velocity calculation from story points | v1 capacity is based on estimated business days. |
| Mandatory automatic planning | User remains responsible for planning decisions. |
| WIP limits | Useful later, but not core to release capacity fit. |
| Story assignees | v1 plans squad-level capacity, not individual allocation. |
| Multiple active releases | v1 keeps release context simple and focused. |
| Parallel sprint streams | v1 assumes one sprint sequence per release. |
| Blocking dependencies | Adds planning-model complexity outside the first release. |
| Real-time collaboration | Conflicts with local-first simplicity. |
| Remote database or server deployment | v1 targets localhost and SQLite. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| APP-01 | Phase 1 | Complete |
| APP-02 | Phase 1 | Complete |
| APP-03 | Phase 1 | Complete |
| APP-04 | Phase 1 | Complete |
| APP-05 | Phase 1 | Complete |
| APP-06 | Phase 1 | Complete |
| SQUAD-01 | Phase 1 | Complete |
| SQUAD-02 | Phase 1 | Complete |
| SQUAD-03 | Phase 1 | Complete |
| SQUAD-04 | Phase 1 | Complete |
| SQUAD-05 | Phase 1 | Complete |
| REL-01 | Phase 2 | Complete |
| REL-02 | Phase 2 | Complete |
| REL-03 | Phase 2 | Complete |
| REL-04 | Phase 2 | Complete |
| SPR-01 | Phase 2 | Complete |
| SPR-02 | Phase 2 | Complete |
| SPR-03 | Phase 2 | Complete |
| FEAT-01 | Phase 3 | Complete |
| FEAT-02 | Phase 3 | Complete |
| FEAT-03 | Phase 3 | Complete |
| FEAT-04 | Phase 3 | Complete |
| FEAT-05 | Phase 3 | Complete |
| FEAT-06 | Phase 3 | Complete |
| BACK-01 | Phase 3 | Complete |
| BACK-02 | Phase 3 | Complete |
| BACK-03 | Phase 3 | Complete |
| BACK-04 | Phase 3 | Complete |
| BOARD-01 | Phase 4 | Pending |
| BOARD-02 | Phase 4 | Pending |
| BOARD-03 | Phase 4 | Pending |
| BOARD-04 | Phase 4 | Pending |
| CAP-01 | Phase 4 | Pending |
| CAP-02 | Phase 4 | Pending |
| CAP-03 | Phase 4 | Pending |
| CAP-04 | Phase 4 | Pending |
| CAP-05 | Phase 4 | Pending |
| SPR-04 | Phase 4 | Pending |
| SPR-05 | Phase 4 | Pending |
| SPR-06 | Phase 4 | Pending |
| SPR-07 | Phase 4 | Pending |
| SPR-08 | Phase 4 | Pending |
| DASH-01 | Phase 5 | Pending |
| DASH-02 | Phase 5 | Pending |
| DASH-03 | Phase 5 | Pending |
| DASH-04 | Phase 5 | Pending |
| PROG-01 | Phase 5 | Pending |
| PROG-02 | Phase 5 | Pending |
| REP-01 | Phase 5 | Pending |
| REP-02 | Phase 5 | Pending |
| REP-03 | Phase 5 | Pending |
| MCP-01 | Phase 5 | Pending |
| MCP-02 | Phase 5 | Pending |
| MCP-03 | Phase 5 | Pending |
| MCP-04 | Phase 5 | Pending |
| MCP-05 | Phase 5 | Pending |
| AI-01 | Phase 5 | Pending |
| AI-02 | Phase 5 | Pending |
| AI-03 | Phase 5 | Pending |
| AI-04 | Phase 5 | Pending |

**Coverage:**

- v1 requirements: 60 total
- Mapped to phases: 60
- Unmapped: 0

---
*Requirements defined: 2026-06-02*
*Last updated: 2026-06-03 after Phase 3 completion*
