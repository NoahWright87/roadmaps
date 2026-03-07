import React, { useEffect, useMemo, useRef, useState } from "react";

function ymToDate(ym) {
  const [y, m] = ym.split("-").map((x) => parseInt(x, 10));
  return new Date(y, m - 1, 1);
}

function dateToYm(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function monthsBetweenInclusive(startYm, endYm) {
  const start = ymToDate(startYm);
  const end = ymToDate(endYm);
  const out = [];
  const cur = new Date(start);
  cur.setDate(1);
  while (cur <= end) {
    out.push(new Date(cur));
    cur.setMonth(cur.getMonth() + 1);
  }
  return out;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && bStart <= aEnd;
}

function packIntoLanes(initiatives) {
  const sorted = [...initiatives].sort((a, b) => a.startIdx - b.startIdx || a.endIdx - b.endIdx);
  const lanes = [];
  for (const it of sorted) {
    let placed = false;
    for (const lane of lanes) {
      const last = lane.items[lane.items.length - 1];
      if (!last || !overlaps(it.startIdx, it.endIdx, last.startIdx, last.endIdx)) {
        lane.items.push(it);
        placed = true;
        break;
      }
    }
    if (!placed) lanes.push({ items: [it] });
  }
  return lanes;
}

function SimpleModal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center p-4 overflow-auto">
        <div className="w-full max-w-2xl rounded-2xl border bg-white shadow">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="text-lg font-semibold truncate">{title}</div>
            <button className="px-3 py-1 border rounded-xl" onClick={onClose}>
              Close
            </button>
          </div>
          <div className="p-4 space-y-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function BarTooltip({ it, x, y }) {
  if (!it) return null;
  const descSnippet =
    it.description && it.description.length > 0
      ? it.description.length > 120
        ? it.description.slice(0, 120) + "…"
        : it.description
      : null;

  return (
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{ left: x + 14, top: y + 14 }}
    >
      <div className="bg-white border rounded-xl shadow-lg p-3 max-w-xs space-y-1">
        <div className="font-semibold text-sm leading-snug">{it.title}</div>
        <div className="text-xs text-gray-500">{formatDateRange(it.startDate, it.endDate)}</div>
        {descSnippet ? (
          <div className="text-xs text-gray-700 leading-snug">{descSnippet}</div>
        ) : null}
      </div>
    </div>
  );
}

function UnstyledLabel({ label, children }) {
  return (
    <label className="grid grid-cols-1 gap-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function CategoryCombobox({ value, options, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  const filtered = useMemo(() => {
    const q = (query || value || "").toLowerCase();
    const base = options || [];
    if (!q) return base;
    return base.filter((o) => o.toLowerCase().includes(q));
  }, [options, query, value]);

  useEffect(() => {
    function onDocDown(e) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex">
        <input
          className="px-3 py-2 border rounded-xl w-full"
          value={value}
          disabled={disabled}
          onChange={(e) => {
            onChange(e.target.value);
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => !disabled && setOpen(true)}
          placeholder="e.g., Reliability"
        />
        <button
          type="button"
          className="ml-2 px-3 py-2 border rounded-xl"
          onClick={() => !disabled && setOpen((v) => !v)}
          disabled={disabled}
          title="Show categories"
        >
          ▾
        </button>
      </div>

      {open && !disabled ? (
        <div className="absolute z-10 mt-2 w-full border rounded-xl bg-white shadow max-h-48 overflow-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-600">No matches</div>
          ) : (
            filtered.map((opt) => (
              <button
                type="button"
                key={opt}
                className="w-full text-left px-3 py-2 hover:bg-gray-50"
                onClick={() => {
                  onChange(opt);
                  setQuery("");
                  setOpen(false);
                }}
              >
                {opt}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfMonthISO(ym) {
  return `${ym}-01`;
}

function endOfMonthISO(ym) {
  const d = ymToDate(ym);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return toISODate(d);
}

function snapToQuarter(ym) {
  const [y, m] = ym.split("-").map(Number);
  const qStart = Math.floor((m - 1) / 3) * 3 + 1; // 1, 4, 7, or 10
  return {
    startYm: `${y}-${String(qStart).padStart(2, "0")}`,
    endYm: `${y}-${String(qStart + 2).padStart(2, "0")}`,
  };
}

function snapToYear(ym) {
  const [y] = ym.split("-").map(Number);
  return { startYm: `${y}-01`, endYm: `${y}-12` };
}

function formatDateRange(startDate, endDate) {
  const fmt = (iso) => {
    const d = parseISODateLocal(iso);
    if (!d) return iso;
    return d.toLocaleString(undefined, { month: "short", year: "numeric" });
  };
  return `${fmt(startDate)} – ${fmt(endDate)}`;
}

function parseISODateLocal(iso) {
  // Avoid the built-in Date(YYYY-MM-DD) UTC parsing footgun.
  // We want month math in *local* time so month boundaries don't shift.
  const parts = (iso || "").split("-").map((x) => parseInt(x, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

function snapDateRangeToMonthBounds(startDate, endDate) {
  const s = parseISODateLocal(startDate);
  const e = parseISODateLocal(endDate);

  // Normalize invalid dates defensively
  if (!s || !e || Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
    return null;
  }

  const sYm = dateToYm(s);
  const eYm = dateToYm(e);

  // If user entered reversed, swap months.
  const sD = ymToDate(sYm);
  const eD = ymToDate(eYm);
  const startYm = sD <= eD ? sYm : eYm;
  const endYm = sD <= eD ? eYm : sYm;

  return {
    startYm,
    endYm,
    startDate: startOfMonthISO(startYm),
    endDate: endOfMonthISO(endYm),
  };
}

function labelFontSizePx(spanLen) {
  // Bigger overall, shrink with shorter spans.
  // Only truncate as a last resort (spanLen === 1).
  if (spanLen >= 6) return 16;
  if (spanLen >= 4) return 15;
  if (spanLen >= 3) return 14;
  if (spanLen === 2) return 12;
  return 10;
}

const DEFAULT_BAR_COLOR = "#3b82f6"; // Tailwind blue-500

function ProgressRing({ pct }) {
  if (!pct) return null;
  const r = 7;
  const circ = 2 * Math.PI * r;
  const dash = (clamp(pct, 0, 100) / 100) * circ;
  return (
    <svg width="18" height="18" className="shrink-0" aria-label={`${pct}% complete`}>
      <circle cx="9" cy="9" r={r} fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" />
      <circle
        cx="9" cy="9" r={r}
        fill="none" stroke="currentColor" strokeWidth="2"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 9 9)"
      />
    </svg>
  );
}

export default function RoadmapTimelineMock() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const defaultStartYm = `${currentYear}-01`;
  const defaultEndYm = `${currentYear}-12`;
  const todayYm = dateToYm(today);

  const [windowStartYm, setWindowStartYm] = useState(defaultStartYm);
  const [windowEndYm, setWindowEndYm] = useState(defaultEndYm);
  const [windowMode, setWindowMode] = useState("year"); // "year" | "quarter"

  function handleModeChange(newMode) {
    setWindowMode(newMode);
    if (newMode === "quarter") {
      const { startYm, endYm } = snapToQuarter(windowStartYm);
      setWindowStartYm(startYm);
      setWindowEndYm(endYm);
    } else {
      const { startYm, endYm } = snapToYear(windowStartYm);
      setWindowStartYm(startYm);
      setWindowEndYm(endYm);
    }
  }

  // View vs Edit mode
  // - View: initiatives may be lane-packed within categories (non-overlapping share a row)
  // - Edit: every initiative gets its own row (no packing) for unambiguous manipulation
  const [isEditMode, setIsEditMode] = useState(false);

  const [initiatives, setInitiatives] = useState(() => [
    {
      id: "gh-policy",
      category: "Platform",
      title: "GitHub Policy Enforcement",
      description: "Add standard checks & enforcement to reduce manual chasing.",
      links: [{ label: "Tracking", url: "https://jira.example/browse/ABC-123" }],
      startDate: `${currentYear}-03-10`,
      endDate: `${currentYear}-06-20`,
    },
    {
      id: "spec-pilot",
      category: "Platform",
      title: "Spec-Driven Pilot",
      description: "Pilot spec-driven changes in a couple repos.",
      links: [{ label: "Spec", url: "https://github.example/specs/spec-driven" }],
      startDate: `${currentYear}-07-01`,
      endDate: `${currentYear}-09-30`,
    },
    {
      id: "ci-stability",
      category: "Reliability",
      title: "CI Stability Improvements",
      description: "Reduce flake rate, add guardrails, improve signal.",
      links: [],
      startDate: `${currentYear}-01-05`,
      endDate: `${currentYear}-04-25`,
    },
    {
      id: "medic",
      category: "Reliability",
      title: "Prod Incident Tooling",
      description: "Lightweight incident helper workflow + docs.",
      links: [{ label: "Notes", url: "https://docs.example/medic" }],
      startDate: `${currentYear}-05-01`,
      endDate: `${currentYear}-10-31`,
    },
  ]);

  const months = useMemo(() => {
    const a = ymToDate(windowStartYm);
    const b = ymToDate(windowEndYm);
    if (a > b) return monthsBetweenInclusive(windowEndYm, windowStartYm);
    return monthsBetweenInclusive(windowStartYm, windowEndYm);
  }, [windowStartYm, windowEndYm]);

  const monthYms = useMemo(() => months.map(dateToYm), [months]);

  const withIdx = useMemo(() => {
    const idx = new Map(monthYms.map((ym, i) => [ym, i]));

    return initiatives
      .map((it) => {
        const snapped = snapDateRangeToMonthBounds(it.startDate, it.endDate);
        if (!snapped) return null;

        const startIdx = idx.get(snapped.startYm);
        const endIdx = idx.get(snapped.endYm);
        if (startIdx == null || endIdx == null) return null;

        return {
          ...it,
          startYm: snapped.startYm,
          endYm: snapped.endYm,
          startIdx,
          endIdx,
        };
      })
      .filter(Boolean);
  }, [initiatives, monthYms]);

  const categorySuggestions = useMemo(() => {
    const set = new Set(initiatives.map((i) => (i.category || "").trim()).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [initiatives]);

  const packedByCategory = useMemo(() => {
    const groups = new Map();
    for (const it of withIdx) {
      const cat = (it.category || "Uncategorized").trim() || "Uncategorized";
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat).push(it);
    }

    return Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([category, items]) => {
        if (isEditMode) return { category, lanes: items.map((it) => ({ items: [it] })) };
        return { category, lanes: packIntoLanes(items) };
      });
  }, [withIdx, isEditMode]);

  const visiblePackedByCategory = useMemo(() => {
    if (isEditMode || hiddenCategories.size === 0) return packedByCategory;
    return packedByCategory.filter((g) => !hiddenCategories.has(g.category));
  }, [packedByCategory, hiddenCategories, isEditMode]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const editing = useMemo(
    () => initiatives.find((i) => i.id === editingId) || null,
    [initiatives, editingId]
  );

  const isModalReadOnly = !isEditMode;

  const [draft, setDraft] = useState(null);

  useEffect(() => {
    if (!modalOpen) {
      setDraft(null);
      return;
    }

    const base =
      editing ||
      (() => {
        const startYm = monthYms[0] || defaultStartYm;
        const endYm = monthYms[Math.max(0, monthYms.length - 1)] || defaultEndYm;
        return {
          id: genId(),
          category: categorySuggestions[0] || "",
          title: "",
          description: "",
          links: [],
          startDate: startOfMonthISO(startYm),
          endDate: endOfMonthISO(endYm),
          progress: 0,
        };
      })();

    setDraft(JSON.parse(JSON.stringify({
      ...base,
      categoryColor: categoryColors[(base.category || "").trim() || "Uncategorized"] || "",
    })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, editingId]);

  function openCreate() {
    setEditingId(null);
    setModalOpen(true);
  }

  function openEdit(id) {
    setEditingId(id);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
  }

  function saveDraft() {
    if (!draft) return;
    if (!draft.title.trim()) return;

    const snapped = snapDateRangeToMonthBounds(draft.startDate, draft.endDate);
    if (!snapped) return;

    // Strip UI-only draft fields before persisting to initiatives
    const { categoryColor, ...draftData } = draft;

    const cleaned = {
      ...draftData,
      category: (draft.category || "Uncategorized").trim() || "Uncategorized",
      title: draft.title.trim(),
      description: (draft.description || "").trim(),
      links: (draft.links || [])
        .filter((l) => (l.url || "").trim())
        .map((l) => ({
          label: (l.label || "").trim() || (l.url || "").trim(),
          url: (l.url || "").trim(),
        })),
      startDate: snapped.startDate,
      endDate: snapped.endDate,
      progress: clamp(Math.round(draft.progress || 0), 0, 100),
    };

    setInitiatives((prev) => {
      const exists = prev.some((p) => p.id === cleaned.id);
      if (!exists) return [...prev, cleaned];
      return prev.map((p) => (p.id === cleaned.id ? cleaned : p));
    });

    if (categoryColor) {
      setCategoryColors((prev) => ({ ...prev, [cleaned.category]: categoryColor }));
    }

    closeModal();
  }

  function deleteEditing() {
    if (!editing) return;
    setInitiatives((prev) => prev.filter((p) => p.id !== editing.id));
    closeModal();
  }

  // --- Drag interactions (move + resize with handles). Snaps to month bounds. ---
  const dragRef = useRef({
    active: false,
    moved: false,
    initiativeId: null,
    mode: null, // 'move' | 'resize-left' | 'resize-right'
    initStartIdx: 0,
    initEndIdx: 0,
    grabOffset: 0,
    hoverIdx: 0,
    suppressClick: false,
  });

  const [, forceRerender] = useState(0);
  const [tooltipState, setTooltipState] = useState({ it: null, x: 0, y: 0 });
  const [categoryColors, setCategoryColors] = useState({});
  const [hiddenCategories, setHiddenCategories] = useState(new Set());

  function toggleCategory(cat) {
    setHiddenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function shiftWindow(months) {
    const shift = (ym) => {
      const d = ymToDate(ym);
      d.setMonth(d.getMonth() + months);
      return dateToYm(d);
    };
    setWindowStartYm((prev) => shift(prev));
    setWindowEndYm((prev) => shift(prev));
  }

  function beginDrag(initiativeId, mode, cellIdx, startIdx, endIdx) {
    const len = endIdx - startIdx;
    dragRef.current = {
      active: true,
      moved: false,
      initiativeId,
      mode,
      initStartIdx: startIdx,
      initEndIdx: endIdx,
      grabOffset: mode === "move" ? clamp(cellIdx - startIdx, 0, Math.max(0, len)) : 0,
      hoverIdx: cellIdx,
      suppressClick: false,
    };
    forceRerender((x) => x + 1);
  }

  function updateDrag(cellIdx) {
    if (!dragRef.current.active) return;
    if (dragRef.current.hoverIdx !== cellIdx) dragRef.current.moved = true;
    dragRef.current.hoverIdx = cellIdx;
    forceRerender((x) => x + 1);
  }

  function getPreviewRangeFor(initiativeId, startIdx, endIdx) {
    const d = dragRef.current;
    if (!d.active || d.initiativeId !== initiativeId || !d.mode) {
      return { startIdx, endIdx, isPreview: false };
    }

    const maxIdx = monthYms.length - 1;

    if (d.mode === "move") {
      const len = d.initEndIdx - d.initStartIdx;
      let newStart = d.hoverIdx - d.grabOffset;
      newStart = clamp(newStart, 0, Math.max(0, maxIdx - len));
      const newEnd = newStart + len;
      return { startIdx: newStart, endIdx: newEnd, isPreview: true };
    }

    if (d.mode === "resize-left") {
      const newStart = clamp(Math.min(d.hoverIdx, d.initEndIdx), 0, maxIdx);
      return { startIdx: newStart, endIdx: d.initEndIdx, isPreview: true };
    }

    if (d.mode === "resize-right") {
      const newEnd = clamp(Math.max(d.hoverIdx, d.initStartIdx), 0, maxIdx);
      return { startIdx: d.initStartIdx, endIdx: newEnd, isPreview: true };
    }

    return { startIdx, endIdx, isPreview: false };
  }

  function endDrag() {
    const d = dragRef.current;
    if (!d.active || !d.initiativeId || !d.mode) return;

    const it = withIdx.find((x) => x.id === d.initiativeId);
    if (!it) {
      dragRef.current.active = false;
      forceRerender((x) => x + 1);
      return;
    }

    const preview = getPreviewRangeFor(it.id, it.startIdx, it.endIdx);
    const startYm = monthYms[clamp(preview.startIdx, 0, monthYms.length - 1)];
    const endYm = monthYms[clamp(preview.endIdx, 0, monthYms.length - 1)];

    setInitiatives((prev) =>
      prev.map((p) =>
        p.id === it.id
          ? {
              ...p,
              startDate: startOfMonthISO(startYm),
              endDate: endOfMonthISO(endYm),
            }
          : p
      )
    );

    dragRef.current = {
      ...dragRef.current,
      active: false,
      mode: null,
      suppressClick: d.moved,
    };
    forceRerender((x) => x + 1);

    setTimeout(() => {
      dragRef.current.suppressClick = false;
    }, 0);
  }

  // Drag mousemove/mouseup handled by global listeners (see below).

  function cellStateFor(initiativeId, cellIdx, startIdx, endIdx) {
    const preview = getPreviewRangeFor(initiativeId, startIdx, endIdx);
    const active = cellIdx >= preview.startIdx && cellIdx <= preview.endIdx;
    return {
      active,
      isPreview: preview.isPreview,
      spanStartIdx: preview.startIdx,
      spanEndIdx: preview.endIdx,
    };
  }

  const windowLabel = useMemo(() => {
    const [y, m] = windowStartYm.split("-").map(Number);
    if (windowMode === "year") return `${y}`;
    const q = Math.floor((m - 1) / 3) + 1;
    return `Q${q} ${y}`;
  }, [windowStartYm, windowMode]);

  const headerMonths = useMemo(() => {
    return months.map((d) => ({
      label: d.toLocaleString(undefined, { month: "short" }),
      ym: dateToYm(d),
    }));
  }, [months]);

  // --- Global pointer -> month index mapping ---
  // With colSpan bars, mouse events stop once the pointer leaves the cell.
  // For short spans (1-2 months), that breaks resize/move. So we map clientX -> month idx globally.
  const tableRef = useRef(null);
  const monthRectsRef = useRef([]);

  useEffect(() => {
    if (!tableRef.current) return;
    const ths = tableRef.current.querySelectorAll("thead [data-month-idx]");
    monthRectsRef.current = Array.from(ths).map((th) => {
      const r = th.getBoundingClientRect();
      return { left: r.left, right: r.right };
    });
  }, [windowStartYm, windowEndYm, headerMonths.length, isEditMode]);

  useEffect(() => {
    function idxFromClientX(clientX) {
      const rects = monthRectsRef.current;
      if (!rects || rects.length === 0) return 0;

      if (clientX <= rects[0].left) return 0;
      if (clientX >= rects[rects.length - 1].right) return rects.length - 1;

      for (let i = 0; i < rects.length; i += 1) {
        const r = rects[i];
        if (clientX >= r.left && clientX <= r.right) return i;
      }

      let nearest = 0;
      let best = Infinity;
      for (let i = 0; i < rects.length; i += 1) {
        const r = rects[i];
        const mid = (r.left + r.right) / 2;
        const dist = Math.abs(clientX - mid);
        if (dist < best) {
          best = dist;
          nearest = i;
        }
      }
      return nearest;
    }

    function onMove(e) {
      if (!dragRef.current.active) return;
      updateDrag(idxFromClientX(e.clientX));
    }

    function onUp() {
      if (dragRef.current.active) endDrag();
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mouseleave", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mouseleave", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthYms.length, withIdx.length]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Roadmap Timeline</h1>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <select
            className="px-3 py-2 border rounded-xl"
            value={windowMode}
            onChange={(e) => handleModeChange(e.target.value)}
          >
            <option value="year">Yearly</option>
            <option value="quarter">Quarterly</option>
          </select>

          <div className="flex items-center gap-1">
            <button
              className="px-2 py-2 border rounded-xl text-sm"
              onClick={() => shiftWindow(windowMode === "quarter" ? -3 : -12)}
              title={windowMode === "quarter" ? "Previous quarter" : "Previous year"}
            >
              ←
            </button>
            <div className="px-3 py-2 border rounded-xl text-sm font-medium min-w-[80px] text-center select-none">
              {windowLabel}
            </div>
            <button
              className="px-2 py-2 border rounded-xl text-sm"
              onClick={() => shiftWindow(windowMode === "quarter" ? 3 : 12)}
              title={windowMode === "quarter" ? "Next quarter" : "Next year"}
            >
              →
            </button>
          </div>

          <button
            className="px-4 py-2 border rounded-xl text-sm"
            onClick={() => setIsEditMode((v) => !v)}
            title={isEditMode ? "Switch to view mode" : "Switch to edit mode"}
          >
            {isEditMode ? "View mode" : "Edit mode"}
          </button>
        </div>
      </div>

      {!isEditMode && packedByCategory.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {packedByCategory.map((g) => {
            const hidden = hiddenCategories.has(g.category);
            const color = categoryColors[g.category] || DEFAULT_BAR_COLOR;
            return (
              <button
                key={g.category}
                onClick={() => toggleCategory(g.category)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm transition-opacity ${
                  hidden ? "opacity-40 line-through" : "opacity-100"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                {g.category}
              </button>
            );
          })}
          {hiddenCategories.size > 0 ? (
            <button
              className="text-sm text-blue-600 hover:text-blue-800 underline"
              onClick={() => setHiddenCategories(new Set())}
            >
              Show all
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="border rounded-2xl overflow-hidden">
        <table ref={tableRef} className="w-full table-fixed border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="w-[180px] text-left p-2 border-b border-r text-sm font-semibold text-gray-600">Category</th>
              {isEditMode ? (
                <th className="w-[240px] text-left p-2 border-b border-r text-sm font-semibold text-gray-600">Initiative</th>
              ) : null}
              {headerMonths.map((m, idx) => (
                <th
                  key={m.ym}
                  data-month-idx={idx}
                  className={`p-2 border-b border-r text-center text-xs font-semibold uppercase tracking-wide ${
                    m.ym === todayYm ? "bg-blue-50 text-blue-600" : "text-gray-500"
                  }`}
                >
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {visiblePackedByCategory.length === 0 ? (
              <tr>
                <td className="p-4 text-sm text-gray-500" colSpan={(isEditMode ? 2 : 1) + headerMonths.length}>
                  {packedByCategory.length > 0 ? "All categories hidden. " : "No initiatives yet. "}
                  {packedByCategory.length > 0 && hiddenCategories.size > 0 ? (
                    <button className="text-blue-600 underline" onClick={() => setHiddenCategories(new Set())}>Show all</button>
                  ) : null}
                </td>
              </tr>
            ) : (
              visiblePackedByCategory.map((group, groupIdx) => {
                const groupBg = groupIdx % 2 === 0 ? "bg-white" : "bg-gray-50";

                return group.lanes.map((lane, laneIdx) => (
                  <tr key={`${group.category}-lane-${laneIdx}`} className={groupBg}>
                    {laneIdx === 0 ? (
                      <td
                        className="p-2 border-b border-r align-middle"
                        rowSpan={group.lanes.length}
                      >
                        <span className="text-sm font-semibold text-gray-700">{group.category}</span>
                      </td>
                    ) : null}

                    {isEditMode ? (
                      <td className="p-2 border-b border-r">
                        <div className="space-y-1">
                          {lane.items.map((it) => (
                            <button
                              key={it.id}
                              className="text-left w-full px-2 py-1 border rounded-xl truncate"
                              onClick={() => openEdit(it.id)}
                              title={it.title}
                            >
                              {it.title}
                            </button>
                          ))}
                        </div>
                      </td>
                    ) : null}

                    {(() => {
                      const cells = [];

                      // Precompute each initiative's (possibly previewed) month-range within this lane.
                      const ranges = lane.items
                        .map((it) => {
                          const pr = getPreviewRangeFor(it.id, it.startIdx, it.endIdx);
                          return { it, startIdx: pr.startIdx, endIdx: pr.endIdx, isPreview: pr.isPreview };
                        })
                        .sort((a, b) => a.startIdx - b.startIdx);

                      const findOccupant = (idx) => ranges.find((r) => idx >= r.startIdx && idx <= r.endIdx) || null;

                      const idxFromMouse = (e, startIdx, spanLen) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = clamp(e.clientX - rect.left, 0, rect.width);
                        const frac = rect.width === 0 ? 0 : x / rect.width;
                        const offset = clamp(Math.floor(frac * spanLen), 0, spanLen - 1);
                        return startIdx + offset;
                      };

                      let idx = 0;
                      while (idx < headerMonths.length) {
                        const occ = findOccupant(idx);

                        // Empty month cell
                        if (!occ) {
                          const m = headerMonths[idx];
                          cells.push(
                            <td key={m.ym} className="h-12 border-b border-r">
                              <div className="h-full w-full" onMouseEnter={() => updateDrag(idx)} />
                            </td>
                          );
                          idx += 1;
                          continue;
                        }

                        // Only render the bar once at its start; the rest of the span is covered by colSpan.
                        if (idx !== occ.startIdx) {
                          idx += 1;
                          continue;
                        }

                        const spanLen = occ.endIdx - occ.startIdx + 1;
                        const fontPx = labelFontSizePx(spanLen);
                        const shouldTruncate = spanLen <= 1;
                        const catColor = categoryColors[occ.it.category] || DEFAULT_BAR_COLOR;
                        const barStyle = {
                          backgroundColor: catColor,
                          borderColor: catColor,
                          ...(occ.isPreview ? { opacity: 0.55 } : {}),
                        };

                        cells.push(
                          <td
                            key={`bar-${occ.it.id}-${headerMonths[occ.startIdx]?.ym || occ.startIdx}`}
                            colSpan={spanLen}
                            className="h-12 border-b border-r p-0 text-white border-y-2 border-x-2 rounded-md"
                            style={barStyle}
                          >
                            <div
                              className="h-full w-full flex items-center justify-center select-none relative cursor-pointer"
                              onMouseEnter={(e) => {
                                updateDrag(occ.startIdx);
                                if (!dragRef.current.active) {
                                  setTooltipState({ it: occ.it, x: e.clientX, y: e.clientY });
                                }
                              }}
                              onMouseMove={(e) => {
                                // Keep hoverIdx accurate while moving across a spanning bar
                                updateDrag(idxFromMouse(e, occ.startIdx, spanLen));
                                if (!dragRef.current.active) {
                                  setTooltipState((s) =>
                                    s.it ? { ...s, x: e.clientX, y: e.clientY } : s
                                  );
                                }
                              }}
                              onMouseLeave={() => {
                                setTooltipState({ it: null, x: 0, y: 0 });
                              }}
                              onMouseDown={(e) => {
                                setTooltipState({ it: null, x: 0, y: 0 });
                                if (!isEditMode) return;
                                if (e.defaultPrevented) return;
                                const grabbedIdx = idxFromMouse(e, occ.startIdx, spanLen);
                                beginDrag(occ.it.id, "move", grabbedIdx, occ.startIdx, occ.endIdx);
                              }}
                              onClick={() => {
                                if (dragRef.current.suppressClick) return;
                                openEdit(occ.it.id);
                              }}
                            >
                              {/* Handles (edit mode only) */}
                              {isEditMode ? (
                                <>
                                  <div
                                    className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      beginDrag(occ.it.id, "resize-left", occ.startIdx, occ.startIdx, occ.endIdx);
                                    }}
                                    title="Resize start"
                                  />
                                  <div
                                    className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      beginDrag(occ.it.id, "resize-right", occ.endIdx, occ.startIdx, occ.endIdx);
                                    }}
                                    title="Resize end"
                                  />
                                </>
                              ) : null}

                              {(occ.it.progress || 0) > 0 ? (
                                <div className="absolute top-1 right-3 pointer-events-none">
                                  <ProgressRing pct={occ.it.progress} />
                                </div>
                              ) : null}

                              <span
                                className={`${shouldTruncate ? "truncate" : "whitespace-normal break-words"} w-full px-2 text-center leading-tight pointer-events-none`}
                                style={{ fontSize: `${fontPx}px` }}
                              >
                                {occ.it.title}
                              </span>
                            </div>
                          </td>
                        );

                        idx += spanLen;
                      }

                      return cells;
                    })()}
                  </tr>
                ));
              })
            )}
          </tbody>
        </table>
      </div>

      {isEditMode ? (
        <div className="flex justify-center">
          <button className="px-4 py-2 border rounded-xl text-sm" onClick={openCreate}>
            Add Initiative
          </button>
        </div>
      ) : null}

      <BarTooltip it={tooltipState.it} x={tooltipState.x} y={tooltipState.y} />

      <SimpleModal
        open={modalOpen}
        title={editing ? `${isModalReadOnly ? "View" : "Edit"} initiative: ${editing.title}` : "Add initiative"}
        onClose={closeModal}
      >
        {!draft ? null : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UnstyledLabel label="Category">
                <CategoryCombobox
                  value={draft.category}
                  options={categorySuggestions}
                  onChange={(v) => setDraft((d) => ({
                    ...d,
                    category: v,
                    // Load saved color for the new category, or keep the current draft color
                    categoryColor: categoryColors[(v || "").trim() || "Uncategorized"] ?? d.categoryColor,
                  }))}
                  disabled={isModalReadOnly}
                />
              </UnstyledLabel>

              <UnstyledLabel label="Title">
                <input
                  className="px-3 py-2 border rounded-xl"
                  value={draft.title}
                  disabled={isModalReadOnly}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  placeholder="Initiative name"
                />
              </UnstyledLabel>

              <UnstyledLabel label={`Color — ${draft.category || "Uncategorized"}`}>
                {isModalReadOnly ? (
                  <div className="flex items-center gap-2 py-2">
                    <div
                      className="w-6 h-6 rounded-md border"
                      style={{ backgroundColor: draft.categoryColor || DEFAULT_BAR_COLOR }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 py-1">
                    <input
                      type="color"
                      className="h-9 w-9 rounded-lg border cursor-pointer p-0.5"
                      value={draft.categoryColor || DEFAULT_BAR_COLOR}
                      onChange={(e) => setDraft((d) => ({ ...d, categoryColor: e.target.value }))}
                    />
                    {draft.categoryColor ? (
                      <button
                        type="button"
                        className="text-xs text-gray-500 hover:text-gray-700 underline"
                        onClick={() => setDraft((d) => ({ ...d, categoryColor: "" }))}
                      >
                        Reset to default
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">default blue</span>
                    )}
                  </div>
                )}
              </UnstyledLabel>

              <UnstyledLabel label="Progress">
                {isModalReadOnly ? (
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${draft.progress || 0}%`, backgroundColor: draft.categoryColor || DEFAULT_BAR_COLOR }}
                      />
                    </div>
                    <span className="text-sm tabular-nums w-10 text-right">{draft.progress || 0}%</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 py-1">
                    <input
                      type="range"
                      min="0" max="100" step="5"
                      className="flex-1"
                      value={draft.progress || 0}
                      onChange={(e) => setDraft((d) => ({ ...d, progress: parseInt(e.target.value, 10) }))}
                    />
                    <span className="text-sm tabular-nums w-10 text-right">{draft.progress || 0}%</span>
                  </div>
                )}
              </UnstyledLabel>

              <UnstyledLabel label="Start date">
                <input
                  className="px-3 py-2 border rounded-xl"
                  type="date"
                  value={draft.startDate}
                  disabled={isModalReadOnly}
                  onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
                />
              </UnstyledLabel>

              <UnstyledLabel label="End date">
                <input
                  className="px-3 py-2 border rounded-xl"
                  type="date"
                  value={draft.endDate}
                  disabled={isModalReadOnly}
                  onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))}
                />
              </UnstyledLabel>
            </div>

            <UnstyledLabel label="Description">
              <textarea
                className="px-3 py-2 border rounded-xl min-h-[88px]"
                value={draft.description}
                disabled={isModalReadOnly}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="Optional"
              />
            </UnstyledLabel>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Links</div>
                {!isModalReadOnly ? (
                  <button
                    className="px-3 py-1 border rounded-xl"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        links: [...(d.links || []), { label: "", url: "" }],
                      }))
                    }
                  >
                    Add link
                  </button>
                ) : null}
              </div>

              {(draft.links || []).length === 0 ? (
                <div className="text-sm text-gray-500">No links.</div>
              ) : isModalReadOnly ? (
                <ul className="list-disc pl-6 space-y-1">
                  {(draft.links || [])
                    .filter((l) => (l.url || "").trim())
                    .map((l, idx) => (
                      <li key={idx}>
                        <a className="underline" href={l.url} target="_blank" rel="noreferrer">
                          {(l.label || "").trim() || l.url}
                        </a>
                      </li>
                    ))}
                </ul>
              ) : (
                <div className="space-y-2">
                  {(draft.links || []).map((l, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-end">
                      <UnstyledLabel label="Label">
                        <input
                          className="px-3 py-2 border rounded-xl"
                          value={l.label || ""}
                          disabled={isModalReadOnly}
                          onChange={(e) =>
                            setDraft((d) => {
                              const next = [...(d.links || [])];
                              next[idx] = { ...next[idx], label: e.target.value };
                              return { ...d, links: next };
                            })
                          }
                          placeholder="e.g., Spec"
                        />
                      </UnstyledLabel>

                      <UnstyledLabel label="URL">
                        <input
                          className="px-3 py-2 border rounded-xl"
                          value={l.url || ""}
                          disabled={isModalReadOnly}
                          onChange={(e) =>
                            setDraft((d) => {
                              const next = [...(d.links || [])];
                              next[idx] = { ...next[idx], url: e.target.value };
                              return { ...d, links: next };
                            })
                          }
                          placeholder="https://…"
                        />
                      </UnstyledLabel>

                      <button
                        className="px-3 py-2 border rounded-xl"
                        onClick={() =>
                          setDraft((d) => {
                            const next = [...(d.links || [])];
                            next.splice(idx, 1);
                            return { ...d, links: next };
                          })
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t">
              <div>
                {editing && !isModalReadOnly ? (
                  <button className="px-4 py-2 border rounded-xl" onClick={deleteEditing}>
                    Delete
                  </button>
                ) : null}
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 border rounded-xl" onClick={closeModal}>
                  {isModalReadOnly ? "Close" : "Cancel"}
                </button>
                {!isModalReadOnly ? (
                  <button
                    className="px-4 py-2 border rounded-xl"
                    onClick={saveDraft}
                    disabled={!draft.title.trim()}
                    title={!draft.title.trim() ? "Title is required" : ""}
                  >
                    Save
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </SimpleModal>
    </div>
  );
}
