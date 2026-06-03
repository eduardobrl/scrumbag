# Squad Planner Agent Guide

This repository uses GSD planning artifacts in `.planning/`.

## Project Context

Read these files before planning or implementation work:

1. `.planning/PROJECT.md` - product context, core value, constraints, and decisions.
2. `.planning/REQUIREMENTS.md` - v1 requirements and phase traceability.
3. `.planning/ROADMAP.md` - coarse MVP phases and success criteria.
4. `.planning/STATE.md` - current phase and workflow preferences.
5. `spec.md` and `telas.md` - original product and screen specifications.

## Workflow

- Current phase: Phase 1 - Local Foundation And Squad Setup.
- Recommended next step: `$gsd-discuss-phase 1`.
- Use `$gsd-ui-phase 1` before implementation because Phase 1 includes UI.
- Use `$gsd-plan-phase 1` after discussion or when the phase plan is ready.

## Preferences

- Mode: YOLO.
- Granularity: Coarse.
- Execution: Parallel when plans are independent.
- Research before planning each phase: Disabled.
- Plan check: Enabled.
- Verifier: Enabled.
- Drift guard: Enabled.
- Commit planning docs: Enabled.

## Product Guardrails

- Keep the first version local-first and localhost-only.
- Store app data locally in SQLite.
- Do not add multi-user auth, remote DB, or external tool integrations in v1.
- Capacity is based on estimated business days and normalized hours, not story point conversion.
- AI/MCP can suggest and explain, but sensitive changes require explicit user confirmation.
- Favor desktop-first operational UI: navigation, tables, badges, progress, capacity alerts, boards, timelines, and reports.
