# Phase 2: Squad & Capacity Engine - Research

**Gathered:** 2026-05-31
**Status:** Ready for planning
**Source:** Inline research for Phase 2 planning

## Domain

### Phase Boundary

Phase 2 delivers squad management, absence tracking, and realistic capacity calculation. This builds directly on Phase 1's SQLite + React stack. The core value is enabling realistic sprint planning by adjusting capacity for real-world factors (absences, holidays, waste/overhead).

Key domain concepts:
- **Squad Member**: A person with name, role, and typical daily capacity in hours
- **Absence**: A period where a member is unavailable (vacation, sick leave, unpaid leave, holiday)
- **Holiday**: Special absence type that applies to the entire squad (company holidays, national holidays)
- **Capacity**: Available work-hours for a date range, computed as: (working days × daily capacity) − absence hours − waste/overhead
- **Waste/Overhead**: Non-discretionary time (meetings, support, incidents) expressed as a percentage or fixed hours
- **Override**: Manual adjustment of computed capacity for a specific date or member

### Capacity Calculation Formula

```
Raw Capacity = working_days_in_range × daily_capacity_hours
Absence Deduction = SUM(absence_hours_per_day)
Waste Deduction = Raw Capacity × waste_percentage
Real Capacity = Raw Capacity − Absence Deduction − Waste Deduction
```

Working days exclude weekends (Saturday/Sunday) and holidays.

## Technical Research

### Database Schema Approach

Given the existing `bun:sqlite` stack, Phase 2 needs three new tables:
1. `squad_members` — stores member profiles
2. `absences` — stores absence records with date ranges
3. `capacity_overrides` — stores manual override values

No ORM is used (consistent with Phase 1). Raw SQL via `bun:sqlite` with repository classes.

### Date Handling

The project does not have `date-fns` installed yet. For capacity calculation, we need:
- Enumerate dates in a range
- Check if a date is a weekend
- Check if a date falls within an absence range
- Count working days

Since this is a corporate tool and the project is small, we can either:
1. Install `date-fns` (recommended by STACK.md) for robust date math
2. Use native `Date` with careful edge-case handling

**Decision:** Install `date-fns` for reliability. It was already in the recommended stack.

### Capacity Service Pattern

The capacity calculation is pure business logic with no side effects — ideal for a service class:
- Input: date range, optional member filter
- Output: capacity breakdown per member and total
- The service reads from `squad_members`, `absences`, and `capacity_overrides`

### UI Patterns

Following Phase 1 patterns:
- Tab-based navigation in App.tsx
- Form components for CRUD
- List/table components for display
- No external UI library (shadcn/ui was recommended but not adopted in Phase 1)

For capacity display:
- A "Capacity" tab showing a date-range selector and results grid
- Breakdown visualization: raw capacity, absences, waste, real capacity
- Override input fields inline with results

## Implementation Decisions

### Decision: Install date-fns
- Rationale: Date range iteration, working-day calculation, and holiday handling are error-prone with native Date
- Consequence: Adds one dependency; aligns with STACK.md recommendation

### Decision: Repository + Service pattern
- Rationale: Phase 1 uses repository for data access; business logic (capacity calculation) should live in a service layer
- Consequence: `SquadRepository`, `AbsenceRepository`, and `CapacityService` classes

### Decision: Waste as percentage stored in config JSON
- Rationale: Simple and editable; for v1, a single global waste percentage is sufficient (configurable per-phase if needed later)
- Consequence: No waste_categories table for v1; store in a simple `app_config` table or compute from a constant with UI override

### Decision: Capacity is computed on demand, not cached
- Rationale: Small dataset (3 users), fast SQLite queries, avoids cache invalidation complexity
- Consequence: Capacity API recalculates on every request; acceptable for 3 users

### Decision: Holiday as an absence type applied to all members
- Rationale: Company holidays affect everyone; modeling as absence with `member_id = null` avoids duplicating records
- Consequence: Absence queries must handle `member_id IS NULL` as squad-wide

## Specific Ideas

- Capacity view should allow selecting a date range (sprint dates) and show a per-member breakdown
- Add a "Squad" tab to App.tsx for member management
- Add a "Capacity" tab for capacity calculation and breakdown
- Override should be per-member per-date, stored in `capacity_overrides` and applied after computation

## Deferred Ideas

- Recurring absences (e.g., "every Friday afternoon") — too complex for v1
- Partial-day absence granularity below half-day — v1 uses full-day or half-day
- Capacity forecasting across multiple future sprints — belongs to Phase 4
- Squad member avatar upload — out of scope
- Multiple squads — out of scope for v1 (one squad only)

---

*Phase: 02-squad-capacity-engine*
*Context gathered: 2026-05-31 via inline research*
