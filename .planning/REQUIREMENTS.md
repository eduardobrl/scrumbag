# Requirements: Squad Planner

**Defined:** 2026-06-05
**Core Value:** A squad can see whether a release plan fits the team's real sprint capacity and adjust scope before delivery risk becomes invisible.

## v1.1 Requirements

Requirements for v1.1 milestone. Each maps to roadmap phases.

### Impediment Tracking

- [x] **IMP-01**: User can register an impediment with title, description, date, and affected stories
- [x] **IMP-02**: User can view impediment markers on the release timeline showing when they occurred and which stories they impacted
- [x] **IMP-03**: User can track impediment resolution — record resolution date, view blocked duration, and see delivery impact

### Multi-Release Management

- **MREL-01**: Remove the one-active-release constraint — allow multiple releases IN_PROGRESS simultaneously. Deferred 2026-06-06 per user decision.

### Annual Timeline

- [x] **TL-01**: User can view a yearly release timeline showing all releases across months and quarters
- [x] **TL-02**: User can see features displayed on the timeline grouped under their target release
- [x] **TL-03**: User can drag and drop features between releases on the timeline to reassign them

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Impediment Tracking

- **IMP-04**: Dashboard alerts for stories with unresolved impediments
- **IMP-05**: Export impediment data to CSV and Excel

### Multi-Release Management

- **MREL-01**: Remove the one-active-release constraint — allow multiple releases IN_PROGRESS simultaneously. Deferred 2026-06-06 per user decision.
- **MREL-03**: Per-release report generation scoped to the selected release context

### Annual Timeline

- **TL-04**: Timeline filters by year, quarter, or feature status

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Jira/Azure DevOps/GitHub integration | App complements external tools; sync is complex and not core to capacity planning |
| WIP limits | Useful later but not central to the portfolio and impediment focus of v1.1 |
| Story assignee ownership | v1 plans squad capacity, not individual allocation |
| Blocking dependency management | Dependencies can be discussed manually; formal model deferred |
| Real-time collaborative editing | Local-first scope keeps implementation simple |
| Remote database or server deployment | SQLite and localhost remain the intended operating model |
| Velocity calculation from story points | Capacity is based on estimated business days, not point conversion |
| Impediment dashboard alerts | Deferred to v1.next — timeline markers and resolution tracking are priority |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| IMP-01 | Phase 7 | Complete |
| IMP-02 | Phase 7 | Complete |
| IMP-03 | Phase 7 | Complete |
| MREL-02 | Phase 8 | Complete |
| TL-01 | Phase 8 | Complete |
| TL-02 | Phase 8 | Complete |
| TL-03 | Phase 8 | Complete |

**Coverage:**

- v1.1 requirements: 7 total
- Mapped to phases: 7
- Unmapped: 0 ✓
- Deferred: 1 (MREL-01)

---
*Requirements defined: 2026-06-05*
*Last updated: 2026-06-06 after Phase 8 completion*
