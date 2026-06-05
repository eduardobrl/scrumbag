# Roadmap: Squad Planner

**Created:** 2026-06-02
**Granularity:** Coarse
**Planning Mode:** YOLO

## Milestones

- ✅ **v1.0 Squad Planner MVP** — Phases 01-06 (shipped 2026-06-04)
- 📋 **v1.1 Squad Planner Next** — Phases 07-09 (planning)

## Phases

<details>
<summary>✅ v1.0 Squad Planner MVP (Phases 01-06) — SHIPPED 2026-06-04</summary>

- [x] Phase 01: Local Foundation And Squad Setup (3/3 plans) — completed 2026-06-03
- [x] Phase 02: Release And Sprint Planning Core (3/3 plans) — completed 2026-06-03
- [x] Phase 03: Feature, Story, And Backlog Planning (3/3 plans) — completed 2026-06-03
- [x] Phase 04: Sprint Board, Capacity Engine, And Leakage (3/3 plans) — completed 2026-06-03
- [x] Phase 05: Release Intelligence, Reports, MCP, And AI (3/3 plans) — completed 2026-06-03
- [x] Phase 06: UX Polish And Localization (1/1 plan) — completed 2026-06-04

</details>

### 📋 v1.1 Squad Planner Next (Planning)

**Milestone Goal:** Add multi-release portfolio planning with an annual timeline, impediment tracking with resolution history, and drag-and-drop feature reassignment across releases.

- [ ] **Phase 7: Multi-Release Foundation** — Remove one-active-release constraint, enable parallel releases
- [ ] **Phase 8: Impediment Tracking** — Register, timeline view, and resolution tracking
- [ ] **Phase 9: Annual Timeline & Cross-Release View** — Yearly timeline, cross-release comparison, drag-and-drop reassignment

## Phase Details

### Phase 7: Multi-Release Foundation
**Goal**: Users can create and manage multiple releases simultaneously without the one-active-release constraint, enabling parallel release planning.
**Depends on**: Phase 6
**Requirements**: MREL-01
**Success Criteria** (what must be TRUE):
  1. User can create a new release while another release remains active (IN_PROGRESS)
  2. User can switch between releases in the header selector and each release maintains independent sprints, features, and stories
  3. Multiple releases can have IN_PROGRESS status simultaneously
**Plans**: TBD
**UI hint**: yes

### Phase 8: Impediment Tracking
**Goal**: Users can register impediments with affected stories, see them as markers on the release timeline, and track resolution with blocked duration and delivery impact.
**Depends on**: Phase 7
**Requirements**: IMP-01, IMP-02, IMP-03
**Success Criteria** (what must be TRUE):
  1. User can register an impediment with title, description, date, and select affected stories
  2. User can view impediment markers on the release timeline showing when they occurred and which stories they impacted
  3. User can record a resolution date for an impediment, marking it as resolved
  4. User can view blocked duration (time between registration and resolution) for resolved impediments
  5. User can see delivery impact showing how impediments affected story or sprint completion
**Plans**: TBD
**UI hint**: yes

### Phase 9: Annual Timeline & Cross-Release View
**Goal**: Users can view all releases on a yearly timeline with features grouped under each release, compare releases side by side, and reassign features between releases via drag-and-drop.
**Depends on**: Phase 7
**Requirements**: MREL-02, TL-01, TL-02, TL-03
**Success Criteria** (what must be TRUE):
  1. User can view a cross-release summary comparing key metrics across all releases side by side
  2. User can view a yearly timeline showing all releases positioned across months and quarters
  3. User can see features displayed on the timeline grouped under their target release
  4. User can drag a feature from one release and drop it onto another on the timeline
  5. Feature reassignment via drag-and-drop updates the feature's release association immediately
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 01. Local Foundation And Squad Setup | v1.0 | 3/3 | Complete | 2026-06-03 |
| 02. Release And Sprint Planning Core | v1.0 | 3/3 | Complete | 2026-06-03 |
| 03. Feature, Story, And Backlog Planning | v1.0 | 3/3 | Complete | 2026-06-03 |
| 04. Sprint Board, Capacity Engine, And Leakage | v1.0 | 3/3 | Complete | 2026-06-03 |
| 05. Release Intelligence, Reports, MCP, And AI | v1.0 | 3/3 | Complete | 2026-06-03 |
| 06. UX Polish And Localization | v1.0 | 1/1 | Complete | 2026-06-04 |
| 07. Multi-Release Foundation | v1.1 | 0/0 | Not started | - |
| 08. Impediment Tracking | v1.1 | 0/0 | Not started | - |
| 09. Annual Timeline & Cross-Release View | v1.1 | 0/0 | Not started | - |

## Coverage

| Phase | Requirement Count | Status |
|-------|-------------------|--------|
| Phase 1 | 11 | Complete |
| Phase 2 | 7 | Complete |
| Phase 3 | 10 | Complete |
| Phase 4 | 13 | Complete |
| Phase 5 | 18 | Complete |
| Phase 6 | 4 | Complete |
| Phase 7 | 1 | Not started |
| Phase 8 | 3 | Not started |
| Phase 9 | 4 | Not started |

**Total v1.0 requirements:** 64 (shipped)
**Total v1.1 requirements:** 8
**Mapped v1.1 requirements:** 8
**Unmapped v1.1 requirements:** 0

---

*Roadmap created: 2026-06-02*
*Last updated: 2026-06-05 after v1.1 roadmap creation*
