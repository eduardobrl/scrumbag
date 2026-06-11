# Roadmap: Squad Planner

**Created:** 2026-06-02
**Granularity:** Coarse
**Planning Mode:** YOLO

## Milestones

- ✅ **v1.0 Squad Planner MVP** — Phases 01-06 (shipped 2026-06-04)
- ✅ **v1.1 Squad Planner Next** — Phases 07-08 (shipped 2026-06-06)
- 📋 **v1.2 Planning & Estimate Audit** — Phases 09-10 (planning)

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

<details>
<summary>✅ v1.1 Squad Planner Next (Phases 07-08) — SHIPPED 2026-06-06</summary>

- [x] Phase 07: Impediment Tracking — Register, timeline view, and resolution tracking (3/3 plans) — completed 2026-06-06
- [x] Phase 08: Annual Timeline & Cross-Release View — Yearly timeline, cross-release comparison, drag-and-drop reassignment (3/3 plans) — completed 2026-06-06

</details>

<details>
<summary>📋 v1.2 Planning & Estimate Audit (Phases 09-10) — PLANNING</summary>

- [ ] Phase 09: Release Planning State & Editable Estimates (0/2 plans)
- [x] Phase 10: Estimate Audit History & Drift Summary (2/2 plans) (completed 2026-06-11)

</details>

## Phase Details

### Phase 09: Release Planning State & Editable Estimates

**Goal**: Users can move a release into PLANNING, freely edit story estimates while it is in that state, and advance to IN_PROGRESS with a captured estimate baseline.
**Depends on**: Phase 08
**Requirements**: REL-01, REL-02, EST-01, EST-02
**Success Criteria** (what must be TRUE):

  1. User can set a release to PLANNING and see PLANNING as a distinct status in the lifecycle
  2. User can edit story points and estimated days while the release is in PLANNING without audit records being created
  3. User can move the release from PLANNING to IN_PROGRESS only in the allowed order
  4. Transitioning from PLANNING to IN_PROGRESS captures a baseline snapshot of all story estimates
  5. Invalid lifecycle jumps are rejected and do not change the release status

**Plans**:

- Wave 1: `09-01-release-planning-state` — release lifecycle enum/status rules, transition guards, and baseline snapshot hooks
- Wave 2: `09-02-editable-estimates-in-planning` — estimate editing behavior in PLANNING, validation, and UI support

Cross-cutting constraints:

- PLANNING sits between DRAFT and IN_PROGRESS and does not remove existing release behaviors.
- Estimate edits in PLANNING are intentionally not audited.
- Baseline capture must happen exactly once on PLANNING -> IN_PROGRESS.

**UI hint**: yes

### Phase 10: Estimate Audit History & Drift Summary

**Goal**: Users can inspect estimate changes after go-live and see how the release has drifted from its baseline.
**Depends on**: Phase 09
**Requirements**: AUD-01, AUD-02, AUD-03, DRF-01
**Success Criteria** (what must be TRUE):

  1. Changing a story's points or estimated days after IN_PROGRESS creates an audit record with old value, new value, field, and timestamp
  2. Story detail panels show estimate change history in a readable chronological order
  3. Release views show a drift summary comparing baseline totals against current totals for points and days
  4. Drift summary updates when post-go-live estimate values change

**Plans**:

- Wave 1: `10-01-estimate-audit-history` — persistence, audit query surfaces, and story detail history UI
- Wave 2: `10-02-release-drift-summary` — aggregate drift calculations, release summary UI, and verification coverage

Cross-cutting constraints:

- Audit history starts only after the release reaches IN_PROGRESS.
- Baseline values remain immutable after capture.
- Drift summary is derived on demand from the baseline snapshot and current story estimates.

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
| 07. Impediment Tracking | v1.1 | 3/3 | Complete | 2026-06-06 |
| 08. Annual Timeline & Cross-Release View | v1.1 | 3/3 | Complete | 2026-06-06 |
| 09. Release Planning State & Editable Estimates | v1.2 | 0/2 | Planning | — |
| 10. Estimate Audit History & Drift Summary | v1.2 | 2/2 | Complete    | 2026-06-11 |

## Coverage

| Phase | Requirement Count | Status |
|-------|-------------------|--------|
| Phase 1 | 11 | Complete |
| Phase 2 | 7 | Complete |
| Phase 3 | 10 | Complete |
| Phase 4 | 13 | Complete |
| Phase 5 | 18 | Complete |
| Phase 6 | 4 | Complete |
| Phase 7 | 3 | Complete |
| Phase 8 | 4 | Complete |
| Phase 9 | 4 | Planning |
| Phase 10 | 4 | Complete |

**Total v1.0 requirements:** 64 (shipped)
**Total v1.1 requirements:** 7 (shipped)
**Total v1.2 requirements:** 8
**Mapped v1.2 requirements:** 8
**Unmapped v1.2 requirements:** 0

---

*Roadmap created: 2026-06-02*
*Last updated: 2026-06-08 after v1.2 milestone initialization*
