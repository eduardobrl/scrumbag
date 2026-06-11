# Requirements: Squad Planner

**Defined:** 2026-06-08
**Core Value:** A squad can see whether a release plan fits the team's real sprint capacity and adjust scope before delivery risk becomes invisible.

## v1.2 Requirements

Requirements for v1.2 milestone. Each maps to roadmap phases.

### Release Lifecycle

- [ ] **REL-01**: User can move a release into PLANNING before it starts, with PLANNING shown as a distinct release status between DRAFT and IN_PROGRESS
- [ ] **REL-02**: User can advance a release only in the allowed order DRAFT -> PLANNING -> IN_PROGRESS -> COMPLETED, and invalid transitions are rejected

### Estimate Editing

- [ ] **EST-01**: User can freely edit story points and estimated days while the release is in PLANNING, without creating audit history entries
- [ ] **EST-02**: User can continue editing story points and estimated days on stories in PLANNING without estimate drift being treated as a change log event

### Estimate Audit

- [x] **AUD-01**: When a release moves from PLANNING to IN_PROGRESS, the system captures a baseline snapshot of each story's story points and estimated days
- [x] **AUD-02**: After a release is IN_PROGRESS, changing a story's points or estimated days records the old value, new value, field changed, and timestamp
- [x] **AUD-03**: User can view a story's estimate change history in the story detail panel

### Drift Summary

- [x] **DRF-01**: User can view a release-level drift summary that compares baseline totals against current totals for story points and estimated days since go-live

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Audit & Analytics

- **AUD-04**: User can filter estimate history by field, date range, or author
- **DRF-02**: User can export estimate drift history for reporting

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Automatic estimate rewrites or AI-applied estimate corrections | v1.2 focuses on auditability and visibility, not auto-editing planning data |
| Cross-release estimate comparison | The milestone is release-local and does not expand into portfolio analytics |
| Story-point-to-day conversion changes | Existing planning model keeps points and days independent |
| Bulk estimate editing across multiple releases | Adds workflow complexity beyond the release-local audit use case |
| External integrations for estimate sync | Local-first v1 scope stays self-contained |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| REL-01 | Phase 9 | Pending |
| REL-02 | Phase 9 | Pending |
| EST-01 | Phase 9 | Pending |
| EST-02 | Phase 9 | Pending |
| AUD-01 | Phase 10 | Complete |
| AUD-02 | Phase 10 | Complete |
| AUD-03 | Phase 10 | Complete |
| DRF-01 | Phase 10 | Complete |

**Coverage:**

- v1.2 requirements: 8 total
- Mapped to phases: 8
- Unmapped: 0

---
*Requirements defined: 2026-06-08*
*Last updated: 2026-06-08 after v1.2 milestone initialization*
