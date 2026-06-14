import { Bell, CheckCircle2, Circle, Trash2, Calendar } from 'lucide-react'
import { PrivacyText } from './PrivacyText'
import type { Group } from '../types/group'
import type { Note, NotePriority } from '../types/note'

type NoteCardProps = {
  note: Note
  groupsById: Map<number, Group>
  selected?: boolean
  reminderAt?: string | null
  onEdit: (note: Note) => void
  onToggleComplete: (note: Note) => void
  onDelete: (note: Note) => void
}

const priorityAccent: Record<NotePriority, { color: string; label: string }> = {
  low:    { color: '#00f0ff', label: 'baja' },
  medium: { color: '#00bcd4', label: 'media' },
  high:   { color: '#ebb2ff', label: 'alta' },
  urgent: { color: '#ffba20', label: 'urgente' },
}

const priorityGlow: Record<NotePriority, string> = {
  low:    'dark:hover:shadow-[0_0_20px_rgba(0,240,255,0.12)] dark:hover:border-cyan-400/30',
  medium: 'dark:hover:shadow-[0_0_20px_rgba(0,188,212,0.12)] dark:hover:border-cyan-500/30',
  high:   'dark:hover:shadow-[0_0_20px_rgba(235,178,255,0.12)] dark:hover:border-purple-400/30',
  urgent: 'dark:hover:shadow-[0_0_20px_rgba(255,186,32,0.12)] dark:hover:border-amber-400/30',
}

function formatDate(value?: string | null) {
  if (!value) return null
  return new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function isPast(value?: string | null) {
  return value ? new Date(value) < new Date() : false
}

function formatReminderStatus(value?: string | null) {
  if (!value) return null

  const target = new Date(value).getTime()
  const diff = target - new Date().getTime()
  const absDiff = Math.abs(diff)

  if (absDiff < 60000) return { label: 'Ahora', due: diff <= 0 }
  if (absDiff < 3600000) return { label: diff < 0 ? `Hace ${Math.ceil(absDiff / 60000)} min` : `En ${Math.ceil(diff / 60000)} min`, due: diff < 0 }
  if (absDiff < 86400000 && diff > 0) return { label: new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(target), due: false }
  if (absDiff < 86400000) return { label: `Hace ${Math.ceil(absDiff / 3600000)}h`, due: true }

  return { label: new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' }).format(target), due: diff < 0 }
}

export function NoteCard({ note, groupsById, selected = false, reminderAt = null, onEdit, onToggleComplete, onDelete }: NoteCardProps) {
  const completed = Boolean(note.completedAt)
  const group = note.groupId ? groupsById.get(note.groupId) : null
  const dueDate = formatDate(note.dueAt)
  const overdue = isPast(note.dueAt) && !completed
  const accent = priorityAccent[note.priority]
  const glow = priorityGlow[note.priority]
  const reminderStatus = formatReminderStatus(reminderAt)

  return (
    <article
      data-note-card="true"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={() => onEdit(note)}
      className={`group/card relative cursor-pointer overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition-all duration-200 dark:bg-obsidian/40 dark:backdrop-blur-md ${
        selected
          ? 'border-blue-300 bg-blue-50/80 shadow-md shadow-blue-100/70 ring-2 ring-blue-100 dark:border-cyan-400 dark:bg-cyan-950/20 dark:shadow-[0_0_15px_rgba(0,240,255,0.2)] dark:ring-cyan-500/20'
          : completed
            ? 'border-slate-200/80 hover:border-slate-300 hover:shadow-md dark:border-white/[0.03] dark:hover:border-white/10 dark:hover:bg-white/5'
            : `border-slate-200/80 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/70 dark:border-white/[0.05] ${glow}`
      } ${completed ? 'opacity-60' : ''}`}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[4px] rounded-l-2xl transition-all duration-200"
        style={{ backgroundColor: completed ? '#94a3b8' : accent.color }}
      />

      <div className="flex items-start gap-3 pl-1.5">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleComplete(note) }}
          aria-label={completed ? 'Marcar pendiente' : 'Marcar hecha'}
          className={`mt-0.5 shrink-0 transition duration-150 ${
            completed
              ? 'text-slate-400 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-500'
              : 'text-slate-300 hover:text-blue-500 dark:text-slate-600 dark:hover:text-cyan-400'
          }`}
        >
          {completed ? (
            <CheckCircle2 size={18} className="fill-slate-400 text-white dark:fill-slate-600 dark:text-obsidian" />
          ) : (
            <Circle size={18} />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <h3
            className={`text-sm font-semibold leading-5 ${
              completed
                ? 'line-through text-slate-400 dark:text-slate-600'
                : selected
                  ? 'text-blue-900 dark:text-cyan-300'
                  : 'text-slate-900 dark:text-white'
            }`}
          >
            <PrivacyText fallback="Nota privada">{note.title}</PrivacyText>
          </h3>

          {note.content && (
            <p
              className={`mt-1.5 line-clamp-3 text-sm leading-6 ${
                completed ? 'text-slate-400 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <PrivacyText fallback="Contenido oculto">{note.content}</PrivacyText>
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {reminderStatus && (
            <span
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold ${
                reminderStatus.due
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                  : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
              }`}
              title={`Recordatorio: ${formatDate(reminderAt) ?? reminderStatus.label}`}
            >
              <Bell size={11} />
              {reminderStatus.label}
            </span>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(note) }}
            aria-label="Eliminar nota"
            className="rounded-lg p-1.5 text-slate-300 dark:text-slate-600 opacity-100 transition-all duration-150 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 sm:opacity-0 sm:group-hover/card:opacity-100"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 pl-7 font-mono text-[10px]">
        <span
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-semibold tracking-wide"
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
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium"
            style={{ backgroundColor: `${group.color ?? '#94a3b8'}18`, color: group.color ?? '#64748b' }}
          >
            <PrivacyText fallback="•••">{group.name}</PrivacyText>
          </span>
        )}

        {dueDate && (
          <span
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium ${
              overdue
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'
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
                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 font-medium text-slate-500 dark:bg-white/5 dark:text-slate-400"
              >
                #{tag.name}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="rounded-lg bg-slate-100 px-2 py-1 font-medium text-slate-400 dark:bg-white/5 dark:text-slate-500">
                +{note.tags.length - 3}
              </span>
            )}
          </>
        )}
      </div>
    </article>
  )
}
