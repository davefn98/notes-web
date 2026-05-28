import { NoteCard } from './NoteCard'
import type { Group } from '../types/group'
import type { Note } from '../types/note'
import type { Reminder, ReminderOccurrence } from '../types/reminder'
import type { Pagination } from '../types/api'

type NotesPanelProps = {
  notes: Note[]
  groupsById: Map<number, Group>
  pagination: Pagination | null
  loading: boolean
  selectedNoteId?: number | null
  remindersByNoteId?: Map<number, Reminder>
  occurrencesByNoteId?: Map<number, ReminderOccurrence>
  onEdit: (note: Note) => void
  onToggleComplete: (note: Note) => void
  onDelete: (note: Note) => void
  onPageChange: (page: number) => void
}

export function NotesPanel({
  notes,
  groupsById,
  pagination,
  loading,
  selectedNoteId,
  remindersByNoteId,
  occurrencesByNoteId,
  onEdit,
  onToggleComplete,
  onDelete,
  onPageChange,
}: NotesPanelProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400">
        Cargando notas...
      </div>
    )
  }

  if (!notes.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400">
        No hay notas para estos filtros.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="columns-1 gap-3 sm:columns-2 lg:columns-3 xl:columns-4 [&>*]:mb-3 [&>*]:break-inside-avoid">
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            groupsById={groupsById}
            selected={note.id === selectedNoteId}
            reminderAt={occurrencesByNoteId?.get(note.id)?.currentRemindAt ?? remindersByNoteId?.get(note.id)?.remindAt ?? null}
            onEdit={onEdit}
            onToggleComplete={onToggleComplete}
            onDelete={onDelete}
          />
        ))}
      </div>

      {pagination ? (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-500 shadow-sm">
          <button
            type="button"
            disabled={!pagination.hasPreviousPage}
            onClick={() => onPageChange(pagination.page - 1)}
            className="rounded-md px-2.5 py-1 font-medium transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="text-[11px] text-slate-400">{pagination.page} / {pagination.totalPages || 1}</span>
          <button
            type="button"
            disabled={!pagination.hasNextPage}
            onClick={() => onPageChange(pagination.page + 1)}
            className="rounded-md px-2.5 py-1 font-medium transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Siguiente →
          </button>
        </div>
      ) : null}
    </div>
  )
}
