# Squad Planner

## What This Is

Squad Planner is a local web app for planning and tracking squad releases from scope definition through sprint execution. It helps a squad register members, absences, holidays, releases, sprints, features, and stories, then compares planned effort against available capacity and highlights delivery risk.

The app is desktop-first, runs on localhost, stores data in SQLite, supports impediment tracking with resolution history and timeline markers, and provides an annual timeline with cross-release comparison and drag-and-drop feature reassignment. It includes a local MCP surface plus an AI assistant so agents can query the plan, explain risk, and suggest changes without applying sensitive actions automatically. The UI defaults to Brazilian Portuguese (pt-BR) with English fallback.

## Shipped Milestones

| Version | Name | Shipped | Phases | Plans | Highlights |
|---------|------|---------|--------|-------|------------|
| v1.0 | Squad Planner MVP | 2026-06-04 | 01-06 | 16 | Foundation, releases, sprints, features, stories, capacity, board, reports, dashboards, MCP, AI, polish |
| v1.1 | Squad Planner Next | 2026-06-06 | 07-08 | 6 | Impediment tracking with timeline markers, annual timeline, cross-release comparison, drag-and-drop reassignment |

Stack: Next.js 15, TypeScript, Prisma 7 + SQLite, Tailwind CSS, next-intl, dnd-kit. Persistence at `./data/squad-planner.db`.

## Core Value

A squad can see whether a release plan fits the team's real sprint capacity and adjust scope before delivery risk becomes invisible.

## Requirements

### Validated

- ✓ User can run the app locally in a browser with a simple install/start flow — v1.0
- ✓ User can configure squad members, work schedules, absences, and holidays — v1.0
- ✓ User can create a release and have sprints generated from the release period — v1.0
- ✓ User can create features, split them into estimated stories, and plan stories into sprints — v1.0
- ✓ User can operate a sprint board, compare planned effort against net capacity, and track leakage — v1.0
- ✓ User can view dashboard, timeline, progress, and capacity alerts for the active release — v1.0
- ✓ User can export release planning and tracking reports to CSV or Excel — v1.0
- ✓ AI agents can query local planning data through MCP and provide suggestions safely — v1.0
- ✓ User can operate the app in Brazilian Portuguese, switch release view context, and see sprint calendar ranges — v1.0
- ✓ User can register impediments with affected stories and track resolution with delivery impact — v1.1
- ✓ User can view impediment markers on the release timeline with sprint spans and impact tooltips — v1.1
- ✓ User can view all releases on an annual timeline with features grouped under each release — v1.1
- ✓ User can compare releases side by side and reassign features via drag-and-drop with undo — v1.1

### Active

- (No active v1.x implementation requirements — milestone complete)

### Deferred

- [ ] Multiple active releases (MREL-01) — deferred 2026-06-06 per user decision
- [ ] Impediment dashboard alerts (IMP-04) — deferred to future milestone
- [ ] Impediment exports to CSV/Excel (IMP-05) — deferred to future milestone
- [ ] Timeline filters by year, quarter, or feature status (TL-04) — deferred to future milestone

### Out of Scope

- Multi-user authentication - the first version is a local single-user planning aid.
- Advanced permissions - no role-based access control is needed without multi-user auth.
- Jira, Azure DevOps, Trello, or GitHub integration - the app complements those tools instead of replacing or synchronizing with them in v1.
- Automatic velocity calculation from story points - capacity is based on estimated business days, not point conversion.
- Mandatory automatic planning - AI can suggest redistribution, but the user remains in control.
- WIP limits - useful later, but not central to release capacity planning.
- Story assignee ownership - v1 plans squad capacity, not individual allocation.
- Blocking dependency management - dependencies can be discussed manually, but are not a formal model in v1.
- Real-time collaborative editing - local-first scope keeps implementation and operations simple.
- Remote database or corporate server deployment - SQLite and localhost are the intended v1 operating model.
- Jira, Azure DevOps, Trello, or GitHub integration - the app complements those tools instead of replacing or synchronizing with them.

## Context

The source context is captured in `spec.md` and `telas.md`. The product is meant to support release planning for a squad that already thinks in releases, sprints, features, and stories, but needs a lightweight local tool to visualize capacity, overflow, leakage, delivery risk, impediments, and portfolio-level timeline.

**Current state (after v1.1):** 8 phases, 22 plans, 70 shipped requirements (v1.0: 64, v1.1: 7). Two milestones shipped across ~5 development days. The app supports end-to-end squad management: members, absences, releases, sprints, features, stories, capacity planning, sprint boards, dashboards, reports, CSV/Excel exports, MCP integration, impediment tracking with timeline markers, an annual timeline with cross-release comparison, and drag-and-drop feature reassignment.

The stack is Next.js 15, TypeScript, Prisma 7 + SQLite (better-sqlite3), Tailwind CSS, dnd-kit, next-intl for i18n, XLSX/CSV export, and a local Node.js MCP server. The UI feels like a modern management tool: quiet, information-dense, desktop-first, with side navigation, global release context, tables, badges, progress bars, alerts, and horizontal timelines.

The app is simple to run: `npm install` and `npm run dev`, with `npm run db:sync` for schema setup and `npm run mcp:start` for the MCP server. Offline operation is required for core planning features; AI quality depends on the connected agent/tool, but the MCP data surface works locally.

Expected scale is one squad, one active release, up to 20 sprints per release, up to 100 features, up to 1000 stories, and up to 30 members.

**Known tech debt:** None significant. The one-active-release constraint remains by user decision. Deferred items include multiple active releases, impediment dashboard alerts, impediment exports, and timeline filters — tracked in `### Deferred` above.

## Constraints

- **Execution**: Runs locally on localhost - the app must not expose APIs or MCP externally by default.
- **Persistence**: Uses SQLite at `./data/squad-planner.db` - data should be easy to back up or move.
- **Stack**: Next.js, TypeScript, Prisma, Tailwind CSS, dnd-kit, and Node.js MCP - chosen for a simple full-stack local web app with a polished UI.
- **Capacity model**: Capacity is calculated in hours from members, working days, absences, holidays, meetings, and support, then normalized to 8-hour days.
- **Planning model**: Story points and estimated business days are independent; only estimated days consume sprint capacity.
- **Release model**: One release can be IN_PROGRESS at a time. The release context selector allows viewing any release regardless of status.
- **Safety**: AI and MCP writes must be explicit; sensitive actions such as closing sprints or canceling items require confirmation or dangerous-operation marking.
- **UX priority**: Desktop is the priority; smaller screens may stack boards and use horizontal scrolling.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build as a local web app | Keeps installation simple and avoids SaaS/security scope for v1. | ✓ Good — shipped |
| Use SQLite for local persistence | Portable, easy to back up, and enough for the expected data volume. | ✓ Good — shipped |
| Track capacity by estimated business days, not story points | Story points remain relative effort while days support capacity comparison. | ✓ Good — shipped |
| Permit over-capacity planning with visible warnings | Teams sometimes choose to overplan deliberately; the tool should expose risk, not block judgment. | ✓ Good — shipped |
| Move unfinished stories to the next sprint on close | Captures sprint leakage and preserves historical truth. | ✓ Good — shipped |
| Include MCP and AI in v1 | AI assistance is part of the product value, but must stay controlled and local. | ✓ Good — shipped |
| Use coarse MVP phases | User selected coarse planning; phases should deliver broad vertical slices. | ✓ Good — shipped |
| Use Prisma 7 with better-sqlite3 adapter | The local machine runs Node 24, and Prisma 7 is the supported line for that runtime. | ✓ Good — shipped |
| Prepare SQLite with a local sync script | Prisma schema validation and SQL generation worked, but schema-engine apply failed on this Windows/Node 24 host. | ✓ Good — shipped |
| Keep sprint assignment behind backlog planning preview | Direct story edits should not bypass capacity-impact context. | ✓ Good — shipped |
| Keep capacity placeholders pending in Phase 3 | Planned effort can use assigned story estimates now, while gross/net capacity remains Phase 4 scope. | ✓ Good — shipped |
| Calculate capacity on demand from local planning data | Derived sprint capacity should stay consistent with squad, calendar, release, and story edits without a separate summary table. | ✓ Good — shipped |
| Keep leakage history append-only | Closing and reopening sprints must preserve historical truth for Phase 5 reports and dashboards. | ✓ Good — shipped |
| Share dashboard/report/MCP query logic | Release intelligence must stay consistent across UI, exports, and AI/tool surfaces. | ✓ Good — shipped |
| Gate dangerous MCP and assistant actions with confirmation | Sensitive planning changes must remain explicit user actions. | ✓ Good — shipped |
| Treat release switching as view context | The header selector should let users inspect any release without changing the one-active-release status rule. | ✓ Good — shipped |
| Keep business-day sprint display cosmetic | Sprint period labels can show calendar dates plus business-day counts while capacity math remains unchanged. | ✓ Good — shipped |
| Keep annual timeline independent from release selector | Portfolio planning needs cross-release context and must not inherit active release filtering. | ✓ Good — shipped |
| Reassigning a feature detaches its stories to backlog | Moving a feature across releases should avoid invalid sprint assignments instead of guessing sprint remaps. | ✓ Good — shipped |
| Retain one-active-release constraint | User chose not to allow multiple IN_PROGRESS releases simultaneously. MREL-01 deferred. | ⚠️ Revisit if needed |
| Impediments remain story-linked and release-scoped | Validation rejects mixed-release story selections and infers scope through story features. | ✓ Good — shipped |
| Impediment resolution is final | Closed impediments do not mutate affected story statuses; only delivery impact is recorded. | ✓ Good — shipped |
| Calculate delivery impact on-demand | Derived from affected stories and business-day blocked duration, not persisted as a separate summary. | ✓ Good — shipped |

## Evolution

PROJECT.md is a living project context document.

After each phase transition:
1. Move requirements that shipped and proved useful to Validated.
2. Move invalidated requirements to Out of Scope with the reason.
3. Add newly discovered active requirements when scope changes.
4. Record significant implementation or product decisions.
5. Check that What This Is and Core Value still describe the project.

After each milestone:
1. Review all sections.
2. Confirm the Core Value is still the right priority.
3. Audit Out of Scope items and keep the rationale current.
4. Update Context with the current state of the app, users, feedback, and risks.

---
*Last updated: 2026-06-08 after v1.1 milestone close*
