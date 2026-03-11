# Roadmap Prototype — TODOs

## Summary

The roadmap prototype is a functional but rough single-page timeline tool.
The immediate focus is on polish and core UX improvements to make it presentable to engineering leadership,
followed by richer features like a backlog panel and filtering.

## Sooner

### Screenshot tests

- [ ] Set up Playwright for visual regression / screenshot testing (natural fit with Vite)
- [ ] Seed a fixed set of sample initiatives (deterministic data, no randomness) for use across all tests
- [ ] Baseline screenshots for:
  - View mode — populated timeline, multi-category, multi-lane packing
  - Edit mode — same data, with drag handles and initiative title column visible
  - Initiative detail modal — open in View mode (read-only)
  - Initiative edit modal — open in Edit mode
  - Empty state — no initiatives, fresh load
- [ ] Tests should fail visibly on layout regressions before new work is merged

## Later

### Initiative progress indicator

- [ ] Clarify how backlog items interact with progress (likely default to 0%)

### Backlog panel for unscheduled work

- [ ] Add a collapsible "Backlog" panel for initiatives not yet placed on the timeline
- [ ] Panel position: beside the timeline when wide, below when narrow
- [ ] Backlog items are not rendered on the timeline grid
- [ ] Edit mode: drag items from Backlog onto the timeline to schedule them (assigns start/end dates)
- [ ] View mode: Backlog is collapsed by default, expandable to browse
- [ ] Define how items enter the backlog (new items default there, or explicitly moved)

### Filtering in View mode

- [ ] Filter by visible date range
- [ ] Team-based filtering is handled separately by the multi-team feature (see `multi-team.todo.md`)

## Ideas (Uncommitted)

### Edit vs. View mode as separate screens

- Could make Edit mode a separate screen/route rather than an inline toggle
- Pros: cleaner UX, natural permission gating via Permit.io, less visual clutter in View
- Cons: context switch, harder to compare view/edit state side by side
- Needs UX discussion before committing

### Feature request integration

- Short-term: a "Submit feedback" button that links to the GitHub Issues creation screen
- Long-term: in-app modal wrapping GH Issue creation so stakeholders don't need a GitHub login
- Long-term version depends on authentication and API integration decisions at work
