import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { useUiStore } from '../store/uiStore'
import type { NoteFilters, NotePriority, NoteSortBy, NoteSortOrder } from '../types/note'

type FiltersBarProps = {
  filters: NoteFilters
  onChange: (filters: Partial<NoteFilters>) => void
}

type SortOption = { label: string; sortBy: NoteSortBy; sortOrder: NoteSortOrder }

const sortOptions: SortOption[] = [
  { label: 'Fecha límite ↑', sortBy: 'dueAt', sortOrder: 'asc' },
  { label: 'Fecha límite ↓', sortBy: 'dueAt', sortOrder: 'desc' },
  { label: 'Registro ↑', sortBy: 'createdAt', sortOrder: 'asc' },
  { label: 'Registro ↓', sortBy: 'createdAt', sortOrder: 'desc' },
  { label: 'Prioridad ↑', sortBy: 'priority', sortOrder: 'asc' },
  { label: 'Prioridad ↓', sortBy: 'priority', sortOrder: 'desc' },
  { label: 'Título A→Z', sortBy: 'title', sortOrder: 'asc' },
  { label: 'Título Z→A', sortBy: 'title', sortOrder: 'desc' },
]

const priorities: Array<{ value: NotePriority | ''; label: string }> = [
  { value: '', label: 'Todas' },
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

function barStyles(dark: boolean) {
  const pillBase = `flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition`

  return {
    bar: `flex items-center gap-1.5 border-b px-3 py-1.5 ${
      dark ? 'border-white/[0.06] bg-[#0b1120]' : 'border-slate-100 bg-slate-50'
    }`,

    // Normal pill (select or button)
    pill: `${pillBase} ${
      dark
        ? 'bg-slate-800/70 text-slate-400 ring-1 ring-slate-700/50 hover:bg-slate-800 hover:text-slate-200'
        : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-700'
    }`,

    // Active/selected pill
    pillOn: `${pillBase} ${
      dark
        ? 'bg-blue-500/15 font-semibold text-blue-300 ring-1 ring-blue-400/30 hover:bg-blue-500/20'
        : 'bg-blue-50 font-semibold text-blue-600 ring-1 ring-blue-200 hover:bg-blue-100/80'
    }`,

    // Icon-only search button (collapsed state)
    iconBtn: `flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition ${
      dark ? 'text-slate-500 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
    }`,

    // Search input wrapper
    searchWrap: `flex h-7 w-44 shrink-0 items-center gap-1 rounded-md px-2 transition ring-1 ${
      dark
        ? 'bg-slate-800/80 ring-slate-700/60 focus-within:ring-2 focus-within:ring-blue-500/40'
        : 'bg-white ring-slate-200 focus-within:ring-2 focus-within:ring-blue-300/60'
    }`,

    searchInput: `min-w-0 flex-1 bg-transparent text-xs outline-none ${
      dark ? 'text-slate-100 placeholder:text-slate-600' : 'text-slate-800 placeholder:text-slate-400'
    }`,

    searchIcon: dark ? 'shrink-0 text-slate-500' : 'shrink-0 text-slate-400',

    searchClear: `flex items-center rounded p-0.5 transition ${
      dark ? 'text-slate-600 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
    }`,

    // Chevron inside select wrapper
    chevron: `pointer-events-none absolute right-2 shrink-0 ${dark ? 'text-slate-600' : 'text-slate-400'}`,

    // Clear-all button
    clearBtn: `flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-xs transition ${
      dark ? 'text-slate-500 hover:bg-slate-800 hover:text-slate-300' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
    }`,
  }
}

export function FiltersBar({ filters, onChange }: FiltersBarProps) {
  const theme = useUiStore((s) => s.theme)
  const privacyMode = useUiStore((s) => s.privacyMode)
  const dark = theme === 'dark'
  const s = barStyles(dark)

  // Keep search open if there's an active query on mount
  const [searchOpen, setSearchOpen] = useState(!!filters.search)
  const searchRef = useRef<HTMLInputElement>(null)

  // Ctrl+F / Cmd+F → prevent browser find, open internal search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        setSearchOpen(true)
        requestAnimationFrame(() => {
          searchRef.current?.focus()
          searchRef.current?.select()
        })
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      // Stop event here so document-level ESC handlers (e.g. editor modal) don't fire
      e.stopPropagation()
      if (filters.search) {
        onChange({ search: '', page: 1 })
      } else {
        setSearchOpen(false)
      }
    }
  }

  function handleSortChange(value: string) {
    const opt = sortOptions.find((o) => `${o.sortBy}_${o.sortOrder}` === value)
    if (opt) onChange({ sortBy: opt.sortBy, sortOrder: opt.sortOrder, page: 1 })
  }

  function openSearch() {
    setSearchOpen(true)
    // autoFocus on the input handles focus, but also ensure select() after render
    requestAnimationFrame(() => searchRef.current?.select())
  }

  function dismissSearch() {
    if (filters.search) {
      onChange({ search: '', page: 1 })
    } else {
      setSearchOpen(false)
    }
  }

  // Active filter detection
  const sortActive = filters.sortBy !== 'dueAt' || filters.sortOrder !== 'asc'
  const priorityActive = !!filters.priority
  const hasFilters = !!(filters.search || priorityActive || filters.hideCompleted || sortActive)

  function clearAll() {
    onChange({ search: '', priority: '', hideCompleted: false, sortBy: 'dueAt', sortOrder: 'asc', page: 1 })
    setSearchOpen(false)
  }

  // Privacy style for search input
  const searchPrivacyStyle = privacyMode
    ? { color: 'transparent', textShadow: '0 0 6px rgba(15,23,42,0.4)', caretColor: dark ? '#f1f5f9' : '#0f172a' }
    : undefined

  return (
    <div className={s.bar}>
      {/* ── Search ────────────────────────────────────────────────────── */}
      {searchOpen ? (
        <div className={s.searchWrap}>
          <Search size={12} className={s.searchIcon} />
          <input
            ref={searchRef}
            autoFocus
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value, page: 1 })}
            onKeyDown={handleSearchKeyDown}
            placeholder="Buscar notas..."
            className={s.searchInput}
            style={searchPrivacyStyle}
          />
          <button type="button" onClick={dismissSearch} className={s.searchClear} tabIndex={-1}>
            <X size={11} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={openSearch}
          title="Buscar  Ctrl+F"
          className={filters.search ? s.pillOn : s.iconBtn}
        >
          <Search size={14} />
          {filters.search ? (
            <span className="max-w-[90px] truncate">{filters.search}</span>
          ) : null}
        </button>
      )}

      {/* ── Sort ──────────────────────────────────────────────────────── */}
      <div className="relative flex shrink-0 items-center">
        <select
          value={`${filters.sortBy}_${filters.sortOrder}`}
          onChange={(e) => handleSortChange(e.target.value)}
          className={`${sortActive ? s.pillOn : s.pill} cursor-pointer appearance-none pr-6`}
        >
          {sortOptions.map((o) => (
            <option key={`${o.sortBy}_${o.sortOrder}`} value={`${o.sortBy}_${o.sortOrder}`}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={11} className={s.chevron} />
      </div>

      {/* ── Priority ──────────────────────────────────────────────────── */}
      <div className="relative flex shrink-0 items-center">
        <select
          value={filters.priority}
          onChange={(e) => onChange({ priority: e.target.value as NotePriority | '', page: 1 })}
          className={`${priorityActive ? s.pillOn : s.pill} cursor-pointer appearance-none pr-6`}
        >
          {priorities.map((p) => (
            <option key={p.value || 'all'} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <ChevronDown size={11} className={s.chevron} />
      </div>

      {/* ── Hide completed ────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => onChange({ hideCompleted: !filters.hideCompleted, page: 1 })}
        className={filters.hideCompleted ? s.pillOn : s.pill}
      >
        {filters.hideCompleted ? <Check size={11} className="shrink-0" /> : null}
        Ocultar hechas
      </button>

      {/* ── Spacer ────────────────────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Clear all ─────────────────────────────────────────────────── */}
      {hasFilters ? (
        <button type="button" onClick={clearAll} className={s.clearBtn} title="Limpiar filtros">
          <X size={11} />
          Limpiar
        </button>
      ) : null}
    </div>
  )
}
