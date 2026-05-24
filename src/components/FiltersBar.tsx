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

const inputClass = 'h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

export function FiltersBar({ filters, onChange }: FiltersBarProps) {
  const privacyMode = useUiStore((state) => state.privacyMode)
  const sortValue = `${filters.sortBy}_${filters.sortOrder}`

  function handleSortChange(value: string) {
    const option = sortOptions.find((o) => `${o.sortBy}_${o.sortOrder}` === value)
    if (option) onChange({ sortBy: option.sortBy, sortOrder: option.sortOrder, page: 1 })
  }

  return (
    <div data-toolbar="true" className="grid gap-1.5 rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm md:grid-cols-[1fr_auto_auto_auto]">
      <input
        value={filters.search}
        onChange={(event) => onChange({ search: event.target.value, page: 1 })}
        placeholder="Buscar..."
        className={inputClass}
        style={privacyMode ? { color: 'transparent', textShadow: '0 0 6px rgba(15,23,42,0.4)', caretColor: '#0f172a' } : undefined}
      />
      <select
        value={sortValue}
        onChange={(event) => handleSortChange(event.target.value)}
        className={inputClass}
      >
        {sortOptions.map((o) => (
          <option key={`${o.sortBy}_${o.sortOrder}`} value={`${o.sortBy}_${o.sortOrder}`}>{o.label}</option>
        ))}
      </select>
      <select
        value={filters.priority}
        onChange={(event) => onChange({ priority: event.target.value as NotePriority | '', page: 1 })}
        className={inputClass}
      >
        {priorities.map((priority) => (
          <option key={priority.value || 'all'} value={priority.value}>{priority.label}</option>
        ))}
      </select>
      <label className={`${inputClass} flex cursor-pointer items-center gap-2 font-medium text-slate-600`}>
        <input
          type="checkbox"
          checked={filters.hideCompleted}
          onChange={(event) => onChange({ hideCompleted: event.target.checked, page: 1 })}
          className="h-3.5 w-3.5 accent-blue-600"
        />
        Ocultar hechas
      </label>
    </div>
  )
}
