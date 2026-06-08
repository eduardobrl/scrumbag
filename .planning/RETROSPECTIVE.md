# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Squad Planner MVP

**Shipped:** 2026-06-04
**Phases:** 6 | **Plans:** 16 | **Requirements:** 64

### What Was Built
- Local-first squad planner with members, absences, holidays, releases, sprints, features, and stories
- Sprint board with capacity engine comparing planned effort against net available hours
- Dashboard intelligence with timeline, progress, capacity alerts, and leakage tracking
- CSV/Excel reports and exports for release planning and tracking data
- Local MCP server and AI assistant surface with confirmation-gated write operations
- Brazilian Portuguese (pt-BR) default localization with English fallback

### What Worked
- Coarse-grained phases (3-4 plans each) delivered broad vertical slices efficiently
- The capacity engine decision to calculate on-demand kept data consistent without summary tables
- Keeping leakage history append-only preserved historical truth for reports and dashboards
- Sharing query logic across dashboard, reports, and MCP kept all surfaces consistent

### What Was Inefficient
- Prisma 7 schema-engine apply failed on Windows/Node 24 — required local sync script workaround
- Phase 6 (UX polish) was a single-plan catch-all; may have benefited from more granular structure

### Patterns Established
- AI-confirmation gates on MCP write operations (close sprint, cancel story, cancel feature)
- Release context as view-only selector (does not change one-active-release status)
- Business-day normalization for capacity math (meetings, support, waste factors)
- Repository pattern for SQLite access with Prisma

### Key Lessons
1. Calculate capacity on-demand rather than persisting derived summaries — avoids drift
2. The one-active-release constraint simplifies navigation and decision-making
3. Business-day math needs explicit holiday and absence modeling from day one

### Cost Observations
- 6 phases across ~2.5 development days
- Sequential execution (no parallelization) was fine at this scale

---

## Milestone: v1.1 — Squad Planner Next

**Shipped:** 2026-06-06
**Phases:** 2 | **Plans:** 6 | **Requirements:** 7

### What Was Built
- Story-linked impediment tracking with OPEN/RESOLVED states, cross-release validation, and business-day delivery impact
- Impediment UI with sidebar navigation, creation, list inspection, detail impact review, and resolution
- Release timeline impediment markers showing affected-sprint spans, resolved check marks, and impact tooltips
- Annual timeline data contract with month/quarter grid, release comparison metrics, and feature month spans
- Standalone /timeline page with yearly navigation, cross-release comparison, and release swimlane grid
- Drag-and-drop feature reassignment between releases with transactional story backlog detachment and undo toast

### What Worked
- Three-wave planning per phase (data → UI → integration) provided clean dependency chains
- The annual timeline staying independent from release selector kept architecture simple
- Reassignment detaching stories to backlog was the safest default (no guessing sprint remaps)
- Delivery impact calculated on-demand kept impedance data consistent with affected stories

### What Was Inefficient
- Phase 7 (Multi-Release) was planned, discussed, and cancelled — planning churn is unavoidable but could be reduced with earlier user input
- Two 3-plan phases vs one 6-plan phase — the coarser structure worked for v1.1 scope but may not scale

### Patterns Established
- Impediments remain story-linked and release-scoped through affected stories
- Impediment resolution is final and does not mutate affected story statuses
- Feature reassignment detaches moved stories to backlog (undo available from toast)
- Annual timeline stays cross-release and independent of active release filtering

### Key Lessons
1. Drag-and-drop reassignment needs transactional rollback — undo toast with API reversal is cleaner than optimistic UI
2. Always detach stories to backlog when moving features across releases — remapping sprints is error-prone
3. Keep timeline pages independent of active release context unless there's a clear UX reason to couple them
4. User decisions on constraints (e.g., one-active-release) should be captured early and revisited only with new evidence

### Cost Observations
- 2 phases across ~2 development days
- 26 tasks across 6 plans, ~111 minutes total execution time
- Phase 7 cancellation added ~15 min of planning churn

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 6 | 16 | Coarse MVP phases, broad vertical slices |
| v1.1 | 2 | 6 | Tighter scope, three-wave per phase pattern |

### Cumulative Quality

| Milestone | Tests (files) | Build | Known Warnings |
|-----------|---------------|-------|----------------|
| v1.0 | N/A (embedded) | Passed | N/A |
| v1.1 | 6 test files | Passed | 5 pre-existing lint warnings (unrelated) |

### Top Lessons (Verified Across Milestones)

1. Calculate capacity and delivery impact on-demand rather than persisting derived summaries
2. Keep independent views independent — timeline pages should not inherit active release filtering
3. Confirmation gates on destructive operations keep AI/tool interactions safe without blocking value
4. Detaching stories to backlog on feature reassignment is the correct safe default
