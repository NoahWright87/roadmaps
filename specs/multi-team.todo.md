# Multi-Team Roadmap — TODOs

## Summary

Support multiple teams' roadmaps within the same tool, with a side drawer for navigation.
Each engineering support team maintains its own roadmap; stakeholders can view all teams together or filter to specific ones.
This is the primary mechanism for scaling the tool from a single-team prototype to an org-level planning surface.

## Sooner

### Side drawer navigation

- [ ] Collapsible side drawer for switching between teams' roadmaps
- [ ] Collapsed state: icon/avatar per team, stacked vertically
- [ ] Expanded state: team name + icon per team
- [ ] Accessible toggle button to expand/collapse the drawer
- [ ] Drawer state persists per session (or defaults to collapsed)

### Team visibility in View mode

- [ ] Clicking a team in the drawer toggles that team's initiatives on/off in the timeline
- [ ] Shift-clicking a team isolates just that team (hides all others)
- [ ] Tooltip on the drawer explains the interaction: "Click to toggle · Shift+Click to isolate"
- [ ] All teams are visible by default on first load

### Edit mode team isolation

- [ ] In Edit mode, only one team's roadmap is active and editable at a time
- [ ] Selecting a different team in the drawer switches the active team
- [ ] Prompt user to confirm if there are unsaved changes before switching teams

## Later

### Permit.io permission gating

- [ ] Design team data model to support per-team permission scopes
- [ ] View access remains open to all users
- [ ] Edit access per team is gated via Permit.io (once integrated into Engineering Control Center)
- [ ] UI reflects whether the current user has edit permission for the active team

### Multi-team timeline overlay design

- [ ] Resolve color-coding tension: category colors vs. team colors — which takes precedence on bars?
- [ ] Lane packing should account for cross-team initiative placement when multiple teams are shown
- [ ] Consider a visual team separator or label when overlaying multiple teams

## Ideas (Uncommitted)

- Team management UI (create, rename, archive teams) — depends on data persistence integration
- Team-level metadata (team lead, headcount) — feeds into capacity planning feature
