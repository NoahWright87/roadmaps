# Roadmap Timeline Component Spec

## Purpose

Interactive timeline visualization for project roadmaps and initiatives. Displays multiple initiatives across configurable time windows, supports lane-packing to minimize vertical space, and provides drag-and-drop editing capabilities for timeline bars.

## Related

- [drag-interactions.spec.md](drag-interactions.spec.md) — detailed drag-and-drop system spec
- [spec.md](spec.md) — template reference

## Contract

### Inputs

**User interactions:**
- Window start/end month selection (month picker inputs)
- View/Edit mode toggle
- Initiative CRUD operations via modal dialogs
- Drag-and-drop gestures on timeline bars (move, resize left/right handles)
- Category selection via combobox with autocomplete

**State:**
- `windowStartYm` / `windowEndYm` — visible time window (YYYY-MM format)
- `isEditMode` — boolean controlling view vs edit behavior
- `initiatives` — array of initiative objects with:
  - `id` — unique identifier
  - `category` — grouping label
  - `title` — initiative name
  - `description` — optional details
  - `links` — array of `{label, url}` objects
  - `startDate` / `endDate` — ISO date strings (YYYY-MM-DD)

### Outputs

**Rendered UI:**
- Table-based timeline grid with month columns
- Category rows (optionally lane-packed in view mode)
- Colored initiative bars spanning their date ranges
- Modal dialogs for viewing/editing initiative details
- Form controls for window selection and mode switching

**Side effects:**
- Initiative state updates (add, edit, delete)
- Date range snapping to month boundaries
- Dynamic lane packing calculations
- Global mouse event handlers during drag operations

### Guarantees / Constraints

**Date handling:**
- All dates snap to month boundaries (first day to last day of month)
- Month calculations use local timezone to avoid UTC shift bugs
- Window start/end swapped automatically if reversed
- Invalid dates handled defensively (return null, skip rendering)

**Edit mode constraints:**
- Every initiative gets its own row (no lane packing)
- Drag handles enabled only in edit mode
- Modal is read-only when not in edit mode
- Title field is required for saving

**View mode behavior:**
- Lane packing within categories minimizes vertical space
- Non-overlapping initiatives share lanes
- Drag interactions disabled
- Click-to-view opens read-only modal
- Category filter chips displayed above the timeline; click to hide a category; "Show all" clears all filters

**Drag interactions:**
- Snaps to month boundaries during move/resize
- Maintains minimum span of one month
- Global mouse handling prevents event loss on short bars
- Visual preview shows new position before release
- Suppresses click handlers after successful drag

## Behavior

### View Modes

**View mode (default):**
- Initiatives packed into lanes by category
- Non-overlapping items within a category share rows
- Timeline bars are clickable (opens read-only modal)
- Drag handles hidden
- Single category row with multiple item lanes

**Edit mode:**
- One initiative per row (no lane packing)
- Initiative titles listed in dedicated column
- Click initiative title or bar to edit
- Drag handles visible on timeline bars
- "Add Initiative" button enabled

### CRUD Operations

**Create:**
1. Click "Add Initiative" (edit mode only)
2. Modal opens with blank form, dates default to window start/end
3. Category defaults to first existing category or empty
4. Links section starts empty
5. Save validates title (required) and date range
6. New initiative added to state

**Read:**
1. Click initiative bar or title (any mode)
2. Modal opens showing all details
3. In view mode: read-only, no edit/delete buttons
4. In edit mode: editable fields, delete button available
5. Links displayed as clickable list (view) or editable rows (edit)

**Update:**
1. Open initiative in edit mode
2. Modify fields (category, title, dates, description, links, progress, category color)
3. Dates auto-snap to month boundaries on save
4. Empty links filtered out on save
5. Link labels default to URL if blank
6. Category color saved to `categoryColors` map on save (affects all initiatives in that category)

**Delete:**
1. Open initiative in edit mode
2. Click "Delete" button
3. Initiative removed from state
4. Modal closes automatically

### Drag Interactions

Enabled only in edit mode. See [drag-interactions.spec.md](drag-interactions.spec.md) for detailed implementation.

**Move (drag bar center):**
- Maintains bar length while repositioning
- Snaps to month boundaries
- Visual preview during drag

**Resize (drag edge handles):**
- 2px-wide handles on left/right edges
- Resize-left adjusts start date, resize-right adjusts end date
- Cannot shrink below 1-month minimum

**Global mouse tracking:**
- Maps mouse position to month index across entire window
- Ensures drag works on short bars (1-2 months)
- Prevents event loss when cursor leaves cells

### Date Range Handling

**Month snapping:**
- User enters dates via date picker (any day of month)
- `snapDateRangeToMonthBounds` normalizes to month boundaries
- Start becomes first day of start month (YYYY-MM-01)
- End becomes last day of end month (YYYY-MM-DD where DD = last day)
- Reversed ranges automatically swapped

**Window controls:**
- **View selector** (`Yearly` / `Quarterly`) sets the window granularity
  - Yearly: window spans 12 months (Jan–Dec of a year)
  - Quarterly: window spans 3 months, snapped to quarter boundaries (Q1 = Jan–Mar, Q2 = Apr–Jun, Q3 = Jul–Sep, Q4 = Oct–Dec)
  - Switching modes snaps to the nearest valid boundary using `snapToQuarter` / `snapToYear`
- **← / → navigation buttons** shift by 3 months (quarterly) or 12 months (yearly)
- A read-only label shows the current period (`2026` or `Q1 2026`)
- Default: Yearly, current calendar year
- Initiatives outside the visible window are not rendered (filtered by month index)

### Category Management

**Auto-suggestions:**
- Category combobox extracts unique categories from all initiatives
- Sorted alphabetically
- Filters as user types
- Free-text entry allowed (creates new category)
- Defaults to "Uncategorized" if blank on save

**Grouping:**
- Initiatives grouped by category for rendering
- Categories sorted alphabetically
- Each category gets alternating background color (white/gray-50)
- Lane packing occurs within each category independently

### Lane Packing Algorithm

Applies only in view mode. Groups initiatives by category, then:

1. Sort initiatives by startIdx, then by endIdx
2. Create empty lane array
3. For each initiative:
   - Try to place in first lane where it doesn't overlap with last item
   - If no fit, create new lane
4. Return lanes array with `{items: [...]}` structure

Overlap detection: `aStart <= bEnd && bStart <= aEnd`

### UI Scaling

**Timeline bar labels:**
- Font size scales with bar width (spanLen):
  - 6+ months: 16px
  - 4-5 months: 15px
  - 3 months: 14px
  - 2 months: 12px
  - 1 month: 10px
- Labels truncate only at 1-month span
- Longer spans use word wrap

**Bar styling:**
- Color driven by `categoryColors` map (category name → hex). Falls back to `#3b82f6` (blue-500) if unset.
- Preview (during drag): same color at 55% opacity
- 2px borders (same color as background), rounded corners
- White text, center-aligned
- Progress ring (SVG donut) shown in top-right corner when `progress > 0`

**Category colors:**
- `categoryColors` state: `{ [categoryName]: hexColor }` — shared across all initiatives in a category
- Set via `<input type="color">` in the initiative edit modal
- Persists for the session; resets on page reload (no external storage yet)
- "Reset to default" button clears the category's color entry

**Progress indicator:**
- `progress` field on initiative: integer 0–100, defaults to 0
- Slider input (step 5) in the edit modal; read-only bar in view modal
- `ProgressRing` SVG component: donut ring in top-right corner of bar, `currentColor` (white on colored bars)
- Ring hidden when `progress === 0`

**Mode toggle:**
- Single toggle button: shows "Edit mode" in View mode, "View mode" in Edit mode
- Click toggles `isEditMode` boolean
- Positioned in the top-right toolbar alongside the window controls

**Category filter chips (View mode only):**
- One chip per category present in the visible window
- Each chip shows a colored dot (using `categoryColors`) and the category name
- Default: all chips active (all categories visible); no filtering applied
- Click chip to hide that category; chip becomes dimmed (`opacity-40`) with strikethrough
- "Show all" text button appears when any categories are hidden; clears all filters
- `hiddenCategories` state: `Set<string>`; empty = no filtering; filtered via `visiblePackedByCategory` useMemo

**Today highlight:**
- Current month column header is highlighted with `bg-blue-50 text-blue-600`
- All other month headers use `text-gray-500` on `bg-gray-100`

**Typography & layout:**
- Page title: `text-2xl font-bold tracking-tight text-gray-900`
- Table header row: `bg-gray-100`; Category and Initiative column headers: `font-semibold text-gray-600`
- Month column headers: `font-semibold uppercase tracking-wide`
- Category label cells: `font-semibold text-sm text-gray-700`

## User Experience (UX)

### Initial State

User sees:
- Table with current year (Jan–Dec) displayed
- Any pre-populated initiatives rendered in view mode
- Clean lane-packed layout minimizing vertical space
- "View mode" / "Edit mode" toggle button
- Month pickers for adjusting time window

### Viewing Initiatives

1. User sees colored bars across timeline
2. Categories grouped vertically with labels
3. Bars show initiative titles (scaled to fit)
4. Hovering a bar shows a tooltip (see Hover Tooltips below)
5. Click any bar to open details modal
6. Modal shows category, title, dates, description, links
7. Links are clickable, open in new tab
8. "Close" button dismisses modal

### Hover Tooltips

A lightweight tooltip appears on bar hover to surface key info without requiring a modal click.

**Trigger:** `mouseenter` on a timeline bar in either View or Edit mode.

**Content:**
- Initiative title (bold)
- Date range formatted as `Mon YYYY – Mon YYYY`
- Description snippet (first 120 chars, truncated with `…` if longer; omitted if blank)
- Progress percentage — reserved for when the progress field is added

**Positioning:** Fixed, offset 14px right and 14px below the cursor. Follows the cursor while hovering (`mousemove`).

**Dismissal:** Clears on `mouseleave` or `mousedown` (drag start). Suppressed while a drag is active.

**Styling:** White background, rounded corners, drop shadow, `pointer-events-none` (never blocks interaction).

**Implementation:** `BarTooltip` component renders via `tooltipState` (`{ it, x, y }`) in the main component. `formatDateRange(startDate, endDate)` formats the date range using locale-aware month names.

### Editing Workflow

1. User clicks "Edit mode" button
2. UI transitions:
   - Lane packing removed (one initiative per row)
   - Initiative column appears showing all titles
   - Drag handles become visible
   - "Add Initiative" button appears
3. User can:
   - Click "Add Initiative" to create new
   - Click initiative title/bar to edit existing
   - Drag bars to move or resize
4. Modals in edit mode:
   - All fields editable
   - "Delete" button available
   - "Save" validates and commits changes
   - "Cancel" discards draft

### Drag-and-Drop Interaction

See [drag-interactions.spec.md](drag-interactions.spec.md) for complete behavior specification.

In edit mode, users can:
- **Move bars:** Click and drag center of bar to reposition (maintains length)
- **Resize start:** Drag left edge handle (2px wide, ew-resize cursor)  
- **Resize end:** Drag right edge handle (2px wide, ew-resize cursor)

Visual feedback:
- Preview styling (lighter blue) during drag
- Snaps to month boundaries
- Click suppressed after successful drag to prevent accidental modal open

### Category Autocomplete

1. User types in category field
2. Dropdown shows matching existing categories
3. User can:
   - Select from list
   - Type new category name
   - Clear field
4. Empty category becomes "Uncategorized" on save
5. New categories automatically appear in suggestions for future initiatives

### Form Validation

**Required fields:**
- Title (enforced on save button disable)

**Date validation:**
- Invalid dates normalized defensively
- Reversed ranges auto-swapped
- Always snapped to month boundaries
- Date pickers use standard HTML5 controls

**Link handling:**
- Empty URL → link removed on save
- Blank label → defaults to URL on save
- "Add link" button appends empty row
- "Remove" button deletes link row immediately

## Acceptance

> **TODO:** Fill from tests. What behaviors are asserted and where?

Test coverage should verify:

**Date utilities:**
- Month boundary snapping with various input dates
- Reversed range auto-swapping
- Invalid date handling
- Local timezone vs UTC consistency

**Lane packing:**
- Non-overlapping items share lanes
- Overlapping items get separate lanes
- Empty initiatives array handled
- Single initiative renders correctly

**View vs Edit mode:**
- Lane packing enabled only in view mode
- Drag handles visible only in edit mode
- Modal read-only state tied to mode
- Initiative column visibility

**CRUD operations:**
- Create with valid data succeeds
- Create without title prevented
- Update modifies existing initiative
- Delete removes initiative
- Empty links filtered on save

**Drag interactions:**
- See [drag-interactions.spec.md](drag-interactions.spec.md) for detailed acceptance criteria
- Move/resize operations work correctly
- Preview styling and click suppression function as expected

**Category management:**
- Autocomplete filters correctly
- New categories accepted
- Blank category becomes "Uncategorized"
- Categories sorted alphabetically in UI

**Window controls:**
- Start/end month updates re-render timeline
- Initiatives outside window hidden
- Reversed window handled gracefully
