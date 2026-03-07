# Capacity Planning — TODOs

## Summary

Long-term feature: visualize and plan team capacity allocation across initiatives on the timeline.
Supports fractional headcount (e.g., 0.5 FTE for an engineer split across two projects).
Expected to be implemented after the roadmap prototype is mature and integrated into Engineering Control Center.

## Later

### FTE allocation per initiative

- [ ] Add an "Allocated FTEs" numeric field to each initiative (supports decimals, e.g., 0.5)
- [ ] Shown in the initiative form and detail view
- [ ] FTE allocation is distinct from progress percentage

### Team capacity visualization

- [ ] Display total team headcount and how it's allocated across active initiatives per time period
- [ ] Visualization: stacked bar or area chart alongside the timeline, broken down by month
- [ ] Highlight over-allocation (sum of FTEs across active initiatives exceeds team headcount)
- [ ] Team headcount is a configurable value per team (feeds from multi-team team metadata)

## Ideas (Uncommitted)

- Multi-team capacity stacking: show multiple teams' allocations side by side or stacked for org-wide view
- Scenario planning: allow "what-if" adjustments to see capacity impact before committing
