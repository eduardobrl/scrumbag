# Phase 10: Estimate Audit History & Drift Summary - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-11
**Phase:** 10-Estimate Audit History & Drift Summary
**Areas discussed:** Audit record storage, History display in story panel, Drift summary placement & style, Cancelled stories in drift scope

---

## Audit Record Storage

### Per-field vs per-update granularity

| Option | Description | Selected |
|--------|-------------|----------|
| Per-field rows | One audit row per changed field. A single save updating both points (5→8) and days (3→5) creates two rows. More queryable. | ✓ |
| Per-update rows | One audit row per save. Single save creates one row with both old/new points and old/new days. Simpler to display. | |

### changeReason field

| Option | Description | Selected |
|--------|-------------|----------|
| No extra fields | storyId, field, oldValue, newValue, timestamp only | |
| Add changeReason only | Optional text field for squad member to note why estimate changed | ✓ |

### Audit scope

| Option | Description | Selected |
|--------|-------------|----------|
| Estimates only | Audit only storyPoints and estimatedDays | ✓ |
| All story fields | Also track title, description, acceptanceCriteria changes | |

### Null value handling

| Option | Description | Selected |
|--------|-------------|----------|
| Record null explicitly | oldValue=null, newValue=5 is a valid row. UI renders null as '—' | ✓ |
| Skip null-to-null changes only | Only skip when both old and new are null | |

**User's choice:** Per-field rows, changeReason only, estimates only, null recorded explicitly.
**Notes:** Per-field granularity matches AUD-02 wording of "field changed". changeReason provides context without overcomplicating the schema.

---

## History Display in Story Panel

### Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Below edit form | Collapsible section below StoryForm on edit page. One page, no tab complexity. | ✓ |
| Separate detail page | Dedicated /stories/[id]/history page or tab | |

### Format

| Option | Description | Selected |
|--------|-------------|----------|
| Compact table | Field / Old / New / Date / Reason columns. Familiar pattern from story-list. | |
| Chronological list with deltas | Each entry as a card showing what changed with date and reason. More narrative. | ✓ |

### Color coding

| Option | Description | Selected |
|--------|-------------|----------|
| Color-coded deltas | Green badge for decreases, red/amber for increases. Arrow icons. | ✓ |
| Neutral presentation | All entries same visual weight — impartial audit log | |

### Empty state

| Option | Description | Selected |
|--------|-------------|----------|
| Hide entirely | Don't render section when no history exists or release is PLANNING | ✓ |
| Show empty state | Always show section header with 'No changes' message | |

**User's choice:** Below edit form, chronological list with deltas, color-coded, hide when empty.
**Notes:** User prefers the more narrative list format over a compact table. Color coding provides visual scan of drift direction.

---

## Drift Summary Placement & Style

### Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated section above sprints | New "Estimate Drift" section between stat cards and sprint table | ✓ |
| Additional stat cards in top grid | Add drift cards to existing stat card grid | |

### Content layout

| Option | Description | Selected |
|--------|-------------|----------|
| Side-by-side comparison | Two columns: Baseline vs Current, with delta highlighted | ✓ |
| Delta-focused with sparklines | Prominent delta plus top N stories with biggest changes | |

### Delta visual treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Color-coded with arrows | Green + ↓ for reduction, amber + ↑ for up to 20%, red + ↑ for over 20% | ✓ |
| Plain numeric delta | Just '+8 points, +3.5 days' in neutral text | |

### Visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Only when baseline exists | Show only for IN_PROGRESS/CLOSED releases with baseline | ✓ |
| Always visible with placeholder | Show section always with placeholder text for pre-go-live | |

**User's choice:** Dedicated section above sprints, side-by-side comparison, color-coded with arrows, only when baseline exists.
**Notes:** Consistent color scheme with story history. Drift is a release-level metric deserving its own section.

---

## Cancelled Stories in Drift Scope

### Baselined-then-cancelled stories

| Option | Description | Selected |
|--------|-------------|----------|
| Exclude cancelled from current | Both sides exclude cancelled at their respective times | |
| Include all baselined stories | Always compare same set — shows full picture including scope removal | ✓ |

### Post-baseline stories

| Option | Description | Selected |
|--------|-------------|----------|
| Exclude post-baseline stories | Only compare stories in the baseline — new scope is separate concern | ✓ |
| Include post-baseline stories | Show all non-cancelled stories including those added after go-live | |

### Story-level metadata

| Option | Description | Selected |
|--------|-------------|----------|
| Include story-level context | Show "Compared N stories (M with changes, K cancelled, J added)" below totals | ✓ |
| Aggregate numbers only | Just baseline/current/delta totals | |

**User's choice:** Include all baselined stories even if cancelled, exclude post-baseline stories, show story-level context metadata.
**Notes:** User wants the drift to show scope removal honestly. Post-baseline stories represent new scope — conflating with drift would be misleading.

---

## the agent's Discretion

- Placement of changeReason input in the story form
- Exact color coding thresholds (the 20% red threshold is a suggestion)

## Deferred Ideas

None — discussion stayed within phase scope.
