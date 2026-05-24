import { Bell } from 'lucide-react'
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

const priorityBorderColor: Record<NotePriority, string> = {
  low: '#10b981',
  medium: '#0ea5e9',
  high: '#f59e0b',
  urgent: '#f43f5e',
}

const priorityLabel: Record<NotePriority, string> = {
  low: 'baja',
  medium: 'media',
  high: 'alta',
  urgent: 'urgente',
}

function formatDate(value?: string | null) {
  if (!value) return null
  return new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function isPast(value?: string | null) {
  return value ? new Date(value) < new Date() : false
}

function TrashIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

export function NoteCard({ note, groupsById, selected = false, hasReminder = false, onEdit, onToggleComplete, onDelete }: NoteCardProps) {
  const completed = Boolean(note.completedAt)
  const group = note.groupId ? groupsById.get(note.groupId) : null
  const dueDate = formatDate(note.dueAt)
  const overdue = isPast(note.dueAt) && !completed
  const groupColor = group?.color ?? '#94a3b8'

  return (
    <article
      data-note-card="true"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={() => onEdit(note)}
      className={`group/card cursor-pointer rounded-2xl border bg-white p-4 shadow-sm transition duration-150 ${
        selected
          ? 'border-blue-200 bg-blue-50/70 shadow-blue-100/70 ring-2 ring-blue-100'
          : 'border-slate-200/80 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/70'
      } ${completed ? 'opacity-55' : ''}`}
    >
      <div className="mb-3 flex items-start gap-3">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleComplete(note) }}
          aria-label={completed ? 'Marcar pendiente' : 'Marcar hecha'}
          className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
            completed
              ? 'border-slate-400 bg-slate-400'
              : selected
                ? 'border-blue-400 bg-white hover:border-blue-600'
                : 'border-slate-300 bg-white hover:border-blue-500'
          }`}
        >
          {completed && (
            <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <h3 className={`text-sm font-semibold leading-5 ${completed ? 'line-through text-slate-400' : selected ? 'text-blue-800' : 'text-slate-900'}`}>
            <PrivacyText fallback="Nota privada">{note.title}</PrivacyText>
          </h3>

          {note.content && (
            <p className={`mt-1 line-clamp-3 text-sm leading-6 text-slate-600 ${completed ? 'line-through' : ''}`}>
              <PrivacyText fallback="Contenido oculto">{note.content}</PrivacyText>
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {hasReminder && (
            <Bell size={12} className="text-amber-500" />
          )}
          <span
            className="h-2.5 w-2.5 rounded-full"
            title={`Prioridad ${priorityLabel[note.priority]}`}
            style={{ backgroundColor: priorityBorderColor[note.priority] }}
          />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(note) }}
            aria-label="Eliminar nota"
            className="rounded-lg p-1 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover/card:opacity-100"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pl-8">
        <span
          className="rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide"
          style={{ backgroundColor: `${priorityBorderColor[note.priority]}18`, color: priorityBorderColor[note.priority] }}
        >
          {priorityLabel[note.priority]}
        </span>

        {group && (
          <span
            className="rounded-full px-2 py-1 text-[10px] font-semibold"
            style={{ backgroundColor: `${groupColor}20`, color: groupColor }}
          >
            <PrivacyText fallback="•••">{group.name}</PrivacyText>
          </span>
        )}

        {dueDate && (
          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${overdue ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-500'}`}>
            {dueDate}
          </span>
        )}

        {note.tags && note.tags.length > 0 && (
          <>
            {note.tags.map((tag) => (
              <span key={tag.id} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">
                #{tag.name}
              </span>
            ))}
          </>
        )}
      </div>
    </article>
  )
}
