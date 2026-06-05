# Requirements: Squad Planner

**Defined:** 2026-06-05
**Core Value:** A squad can see whether a release plan fits the team's real sprint capacity and adjust scope before delivery risk becomes invisible.

## v1.1 Requirements

Requirements for v1.1 milestone. Each maps to roadmap phases.

### Impediment Tracking

- [ ] **IMP-01**: User can register an impediment with title, description, date, and affected stories
- [ ] **IMP-02**: User can view impediment markers on the release timeline showing when they occurred and which stories they impacted
- [ ] **IMP-03**: User can track impediment resolution — record resolution date, view blocked duration, and see delivery impact

### Multi-Release Management

- [ ] **MREL-01**: User can have multiple releases active in parallel (remove the one-active-release constraint)
- [ ] **MREL-02**: User can view a cross-release summary comparing releases side by side with key metrics

### Annual Timeline

- [ ] **TL-01**: User can view a yearly release timeline showing all releases across months and quarters
- [ ] **TL-02**: User can see features displayed on the timeline grouped under their target release
- [ ] **TL-03**: User can drag and drop features between releases on the timeline to reassign them

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Impediment Tracking

- **IMP-04**: Dashboard alerts for stories with unresolved impediments
- **IMP-05**: Export impediment data to CSV and Excel

### Multi-Release Management

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
| IMP-01 | — | Pending |
| IMP-02 | — | Pending |
| IMP-03 | — | Pending |
| MREL-01 | — | Pending |
| MREL-02 | — | Pending |
| TL-01 | — | Pending |
| TL-02 | — | Pending |
| TL-03 | — | Pending |

**Coverage:**
- v1.1 requirements: 8 total
- Mapped to phases: 0
- Unmapped: 8 ⚠️

---
*Requirements defined: 2026-06-05*
*Last updated: 2026-06-05 after v1.1 milestone definition*
