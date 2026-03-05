# Drag-and-Drop Timeline Editing Spec

## Purpose

Interactive drag-and-drop system for manipulating timeline initiative bars. Supports moving bars horizontally and resizing via edge handles, with month-boundary snapping and real-time visual preview.

## Related

- [roadmap-prototype.spec.md](roadmap-prototype.spec.md) — main roadmap component spec

## Contract

### Inputs

**Drag gestures:**
- Mouse down on bar center (move mode)
- Mouse down on left edge handle (resize-left mode)
- Mouse down on right edge handle (resize-right mode)
- Mouse move (updates preview position)
- Mouse up (commits change)

**State:**
- `dragRef.current` — object tracking active drag state:
  - `active` — boolean, drag in progress
  - `moved` — boolean, whether mouse moved since mousedown
  - `initiativeId` — ID of initiative being dragged
  - `mode` — 'move' | 'resize-left' | 'resize-right'
  - `initStartIdx` / `initEndIdx` — original month indices
  - `grabOffset` — month offset from bar start where user grabbed
  - `hoverIdx` — current mouse position as month index
  - `suppressClick` — prevents click handler after drag

**DOM measurements:**
- Month column boundary rectangles (left/right pixel positions)
- Mouse clientX position

### Outputs

**Visual feedback:**
- Preview styling on dragged bar (blue-300 background, blue-500 border)
- Bar position updates in real-time during drag
- Cursor changes (ew-resize on handles, pointer elsewhere)

**State updates:**
- Initiative `startDate` / `endDate` modified on mouse up
- Drag state reset after commit
- Force re-render during drag to update preview

### Guarantees / Constraints

**Month snapping:**
- All drag operations snap to month boundaries
- Bar position clamped to visible window (0 to maxIdx)
- Minimum span: 1 month (cannot resize to zero width)

**Move constraints:**
- Bar length preserved during move
- Cannot move beyond window edges (start clamped to 0, end clamped to maxIdx)
- Grab offset maintained (bar doesn't jump under cursor)

**Resize constraints:**
- Resize-left: cannot move past original endIdx
- Resize-right: cannot move before original startIdx
- Both: clamped to window boundaries

**Event handling:**
- Global mouse listeners ensure drag completes even if cursor leaves table
- Click suppressed if mouse moved during drag
- Drag only enabled in edit mode

## Behavior

### Drag Lifecycle

**Initiation (mouse down):**
1. User presses mouse on bar or handle
2. `beginDrag(initiativeId, mode, cellIdx, startIdx, endIdx)` called
3. Drag state initialized:
   - `active = true`
   - `moved = false`
   - Mode set based on click target (move, resize-left, resize-right)
   - Grab offset calculated (for move mode)
   - Initial hover index set to clicked cell
4. Force re-render to apply preview styling

**Tracking (mouse move):**
1. Global mousemove listener fires
2. Mouse clientX mapped to month index via `idxFromClientX()`
3. If hover index changed: `moved = true`
4. `updateDrag(cellIdx)` updates hover index
5. Force re-render shows new preview position
6. `getPreviewRangeFor()` calculates new start/end indices based on mode

**Commit (mouse up):**
1. Global mouseup listener fires (or window mouseleave)
2. `endDrag()` retrieves preview range
3. Month indices converted to ISO date strings:
   - Start: `${monthYms[startIdx]}-01`
   - End: `${monthYms[endIdx]}-DD` (last day of month)
4. Initiative state updated with new dates
5. Drag state reset (`active = false`, `mode = null`)
6. If drag moved: `suppressClick = true` (prevents modal opening)
7. Click suppression cleared after 0ms timeout

### Mode-Specific Behavior

**Move mode:**
- Triggered by mouse down on bar body (excluding handles)
- Grab offset = clicked month index - bar start index
- New position = hover index - grab offset
- Clamped so bar fits within window (0 to maxIdx - barLength)
- Bar length (endIdx - startIdx) preserved

**Resize-left mode:**
- Triggered by mouse down on 2px-wide left edge
- New start = hover index (clamped to not pass endIdx)
- End index remains fixed
- Start clamped to [0, initEndIdx]

**Resize-right mode:**
- Triggered by mouse down on 2px-wide right edge  
- New end = hover index (clamped to not precede startIdx)
- Start index remains fixed
- End clamped to [initStartIdx, maxIdx]

### Global Mouse → Month Index Mapping

**Problem:**
- Short timeline bars (1-2 months) lose mouse events when cursor leaves cell
- ColSpan means mouse events stop at cell boundaries
- Breaks resize/move interactions on narrow bars

**Solution:**
1. On mount and window changes: measure all month column header cells
2. Store array of `{left, right}` pixel boundaries per month
3. On every mousemove: convert clientX to month index:
   - If before first column: return 0
   - If after last column: return maxIdx
   - If within column bounds: return that index
   - Otherwise: return nearest column by distance to midpoint

**Update triggers:**
- Window start/end change
- Header month count changes
- Edit mode toggle (affects column layout)

### Visual Preview System

**getPreviewRangeFor(initiativeId, startIdx, endIdx):**
- If no active drag or different initiative: returns original range, `isPreview = false`
- If dragging this initiative: calculates new range based on mode
- Returns `{startIdx, endIdx, isPreview}` object

**Cell rendering:**
- Each month cell calls `cellStateFor(initiativeId, cellIdx, startIdx, endIdx)`
- Returns `{active, isPreview, spanStartIdx, spanEndIdx}`
- Preview bars use lighter blue colors
- Active cells rendered as colSpan bars

**Bar styling:**
- Default: `bg-blue-500 border-blue-700`
- Preview: `bg-blue-300 border-blue-500`
- 2px borders, rounded corners
- Same styling transitioning smoothly

### Click Suppression

**Issue:**
- Mouse up after drag should not open modal
- Click event fires after mouseup

**Solution:**
1. On drag end: if `moved === true`, set `suppressClick = true`
2. Bar's onClick handler checks `suppressClick` flag
3. If true: return early, prevent modal
4. setTimeout 0ms to clear flag after event loop
5. Ensures next independent click works normally

### Handle Interaction

**Visual cues:**
- Left handle: 2px-wide div, absolute positioned left edge
- Right handle: 2px-wide div, absolute positioned right edge
- Both have `cursor: ew-resize`
- Only visible in edit mode

**Event handling:**
- Handle mousedown calls `e.preventDefault()` and `e.stopPropagation()`
- Prevents triggering parent bar's move handler
- Starts drag with appropriate mode (resize-left or resize-right)

### Edge Cases

**Very short bars (1 month):**
- Global mouse tracking ensures resize works
- Font size scales to 10px
- Text may appear cramped but remains readable

**Window boundaries:**
- Moving bar near edge: clamps to fit fully within window
- Resizing beyond edge: clamps to maxIdx
- No bars extend beyond visible columns

**Invalid date ranges:**
- `snapDateRangeToMonthBounds()` returns null on invalid dates
- Initiative filtered out of rendering
- Drag operations impossible on unrendered bars

## User Experience (UX)

### Discoverability

**Edit mode:**
- User sees initiative bars with subtle hover effects
- Cursor changes to ew-resize on handles
- Visual affordance that bar is interactive

**Move affordance:**
- Entire bar body is draggable (except handles)
- Pointer cursor in center area
- No special visual until drag starts

### Drag Feedback

1. User presses mouse on bar
2. Bar immediately shows preview styling (lighter blue)
3. As mouse moves, bar stretches/moves in real-time
4. Month-snapped positions (not pixel-perfect following)
5. Clear visual distinction between preview and committed state
6. Release commits with instant style change back to solid blue

### Responsiveness

- Drag operations feel smooth and immediate
- No lag between mouse movement and preview update
- Force re-render on every hover index change ensures visual consistency

### Error Prevention

- Cannot drag bar outside visible window
- Cannot shrink bar to zero width
- Date range always remains valid (month boundaries)
- Click suppression prevents accidental modal after drag

## Acceptance

> **TODO:** Fill from tests. What behaviors are asserted and where?

Test coverage should verify:

**Mode detection:**
- Click on bar center triggers move mode
- Click on left 2px triggers resize-left mode
- Click on right 2px triggers resize-right mode

**Move behavior:**
- Grab offset calculated correctly
- Bar maintains length during move
- Position clamped to window boundaries
- Dates updated correctly on commit

**Resize-left behavior:**
- Start index updated, end index fixed
- Cannot move past end index
- Clamped to [0, endIdx]

**Resize-right behavior:**
- End index updated, start index fixed
- Cannot move before start index
- Clamped to [startIdx, maxIdx]

**Global mouse tracking:**
- clientX → month index mapping accurate
- Works when cursor leaves table
- Handles window edges correctly
- Updates when window changes

**Preview system:**
- Preview styling applied during drag
- Reverts to default on commit
- Multiple bars don't interfere with each other

**Click suppression:**
- Click suppressed after successful drag
- Click works normally after suppression cleared
- Non-dragged clicks open modal normally

**Constraint enforcement:**
- Minimum 1-month span maintained
- Bars stay within window boundaries
- Invalid date ranges handled gracefully
