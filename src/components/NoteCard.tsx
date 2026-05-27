import { Bell, CheckCircle2, Circle, Trash2, Calendar } from 'lucide-react'
import { PrivacyText } from './PrivacyText'
import type { Group } from '../types/group'
import type { Note, NotePriority } from '../types/note'

type NoteCardProps = {
  note: Note
  groupsById: Map<number, Group>
  selected?: boolean
  hasReminder?: boolean
  onEdit: (note: Note) => void
  onToggleComplete: (note: Note) => void
  onDelete: (note: Note) => void
}

const priorityAccent: Record<NotePriority, { color: string; label: string }> = {
  low:    { color: '#10b981', label: 'baja' },
  medium: { color: '#3b82f6', label: 'media' },
  high:   { color: '#f59e0b', label: 'alta' },
  urgent: { color: '#ef4444', label: 'urgente' },
}

function formatDate(value?: string | null) {
  if (!value) return null
  return new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function isPast(value?: string | null) {
  return value ? new Date(value) < new Date() : false
}

export function NoteCard({ note, groupsById, selected = false, hasReminder = false, onEdit, onToggleComplete, onDelete }: NoteCardProps) {
  const completed = Boolean(note.completedAt)
  const group = note.groupId ? groupsById.get(note.groupId) : null
  const dueDate = formatDate(note.dueAt)
  const overdue = isPast(note.dueAt) && !completed
  const accent = priorityAccent[note.priority]

  return (
    <article
      data-note-card="true"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={() => onEdit(note)}
      className={`group/card relative cursor-pointer overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition-all duration-200 ${
        selected
          ? 'border-blue-300 bg-blue-50/80 shadow-md shadow-blue-100/70 ring-2 ring-blue-100'
          : completed
            ? 'border-slate-200/80 hover:border-slate-300 hover:shadow-md'
            : 'border-slate-200/80 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/70'
      } ${completed ? 'opacity-60' : ''}`}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[3px] rounded-l-2xl transition-all duration-200"
        style={{ backgroundColor: completed ? '#94a3b8' : accent.color }}
      />

      <div className="flex items-start gap-3 pl-1.5">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleComplete(note) }}
          aria-label={completed ? 'Marcar pendiente' : 'Marcar hecha'}
          className={`mt-0.5 shrink-0 transition duration-150 ${
            completed
              ? 'text-slate-400 hover:text-slate-500'
              : 'text-slate-300 hover:text-blue-500'
          }`}
        >
          {completed ? (
            <CheckCircle2 size={18} className="fill-slate-400 text-white" />
          ) : (
            <Circle size={18} />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <h3
            className={`text-sm font-semibold leading-5 ${
              completed ? 'line-through text-slate-400' : selected ? 'text-blue-900' : 'text-slate-900'
            }`}
          >
            <PrivacyText fallback="Nota privada">{note.title}</PrivacyText>
          </h3>

          {note.content && (
            <p
              className={`mt-1.5 line-clamp-3 text-sm leading-6 ${
                completed ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              <PrivacyText fallback="Contenido oculto">{note.content}</PrivacyText>
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {hasReminder && (
            <Bell size={13} className="text-amber-400" />
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(note) }}
            aria-label="Eliminar nota"
            className="rounded-lg p-1.5 text-slate-300 opacity-100 transition-all duration-150 hover:bg-rose-50 hover:text-rose-500 sm:opacity-0 sm:group-hover/card:opacity-100"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 pl-7">
        <span
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold tracking-wide"
          style={{ backgroundColor: `${accent.color}14`, color: accent.color }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: accent.color }}
          />
          {accent.label}
        </span>

        {group && (
          <span
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
            style={{ backgroundColor: `${group.color ?? '#94a3b8'}18`, color: group.color ?? '#64748b' }}
          >
            <PrivacyText fallback="•••">{group.name}</PrivacyText>
          </span>
        )}

        {dueDate && (
          <span
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium ${
              overdue
                ? 'bg-rose-50 text-rose-600'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            <Calendar size={11} />
            {dueDate}
          </span>
        )}

        {note.tags && note.tags.length > 0 && (
          <>
            {note.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500"
              >
                {tag.name}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-400">
                +{note.tags.length - 3}
              </span>
            )}
          </>
        )}
      </div>
    </article>
  )
}
