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

### Custom category colors

- [ ] Each category has a user-assignable color
- [ ] Color is reflected on all timeline bars belonging to that category
- [ ] Color can be set in the category editor (palette or color picker)
- [ ] Color persists with the roadmap data

### Hover tooltips on initiative bars

- [x] Hovering a bar shows a tooltip: title, date range, description snippet
- [x] No click required — tooltip replaces the need to open the modal for basic info
- [x] Tooltip dismisses on mouse-out
- [x] Works in both View and Edit modes

### User-adjustable date window

- [ ] Replace the fixed date window with user-adjustable controls on the page
- [ ] Controls support shifting the window (earlier/later) and zooming (wider/narrower range)
- [ ] Window adjusts per-session; no persistence required initially
- [ ] Initiatives outside the visible window are hidden or clipped

### General UI polish

- [ ] Improve typography, spacing, and color palette to suit a leadership-facing tool
- [ ] Improve the visual design of the Edit/View mode toggle
- [ ] Review overall layout for at-a-glance readability

## Later

### Initiative progress indicator

- [ ] Add a progress percentage field (0–100%) to the initiative form
- [ ] Visualize progress as a radial/pie fill inside or beside the timeline bar
- [ ] No full lifecycle state machine needed — just a numeric percentage
- [ ] Clarify how backlog items interact with progress (likely default to 0%)

### Backlog panel for unscheduled work

- [ ] Add a collapsible "Backlog" panel for initiatives not yet placed on the timeline
- [ ] Panel position: beside the timeline when wide, below when narrow
- [ ] Backlog items are not rendered on the timeline grid
- [ ] Edit mode: drag items from Backlog onto the timeline to schedule them (assigns start/end dates)
- [ ] View mode: Backlog is collapsed by default, expandable to browse
- [ ] Define how items enter the backlog (new items default there, or explicitly moved)

### Filtering in View mode

- [ ] Viewers can filter displayed initiatives by category and by visible date range
- [ ] Filters are shown as quick-toggle chips or checkboxes above the timeline
- [ ] Active filters are visually distinct and easy to clear
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
