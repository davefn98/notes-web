import { useState } from 'react'
import type { Group } from '../types/group'
import type { Note, NotePayload, NotePriority, NoteRecurrence } from '../types/note'
import type { Tag } from '../types/tag'
import type { Reminder, ReminderPayload } from '../types/reminder'

type NoteEditorProps = {
  open: boolean
  note: Note | null
  groups: Group[]
  tags?: Tag[]
  saving: boolean
  reminder?: Reminder | null
  inline?: boolean
  onClose: () => void
  onSave: (payload: NotePayload, id?: number) => Promise<void>
  onSaveReminder?: (payload: ReminderPayload, id?: number) => Promise<void>
  onDeleteReminder?: (id: number) => Promise<void>
}

function flattenGroups(groups: Group[]): Group[] {
  return groups.flatMap((group) => [group, ...flattenGroups(group.children)])
}

function toInputDate(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

export function NoteEditor({ open, note, groups, tags = [], saving, reminder = null, inline = false, onClose, onSave, onSaveReminder, onDeleteReminder }: NoteEditorProps) {
  if (!open) return null

  return (
    <NoteEditorForm
      key={note?.id ?? 'new'}
      note={note}
      groups={groups}
      tags={tags}
      saving={saving}
      reminder={reminder}
      inline={inline}
      onClose={onClose}
      onSave={onSave}
      onSaveReminder={onSaveReminder}
      onDeleteReminder={onDeleteReminder}
    />
  )
}

function NoteEditorForm({ note, groups, tags = [], saving, reminder = null, inline = false, onClose, onSave, onSaveReminder, onDeleteReminder }: Omit<NoteEditorProps, 'open'>) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.content ?? '')
  const [priority, setPriority] = useState<NotePriority>(note?.priority ?? 'medium')
  const [dueAt, setDueAt] = useState(toInputDate(note?.dueAt))
  const [groupId, setGroupId] = useState(note?.groupId ? String(note.groupId) : '')
  const [recurrence, setRecurrence] = useState<NoteRecurrence | ''>((note?.recurrence as NoteRecurrence) ?? '')
  const [recurrenceEndAt, setRecurrenceEndAt] = useState(toInputDate(note?.recurrenceEndAt))
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(note?.tags?.map((t) => t.id) ?? [])
  const [reminderEnabled, setReminderEnabled] = useState(Boolean(reminder))
  const [remindAt, setRemindAt] = useState(toInputDate(reminder?.remindAt))
  const [reminderMessage, setReminderMessage] = useState(reminder?.message ?? '')
  const [error, setError] = useState<string | null>(null)
  const groupOptions = flattenGroups(groups)

  async function saveCurrentNote() {
    if (!title.trim() || !content.trim()) {
      setError('Titulo y contenido son obligatorios.')
      return
    }

    await onSave(
      {
        title: title.trim(),
        content: content.trim(),
        priority,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        recurrence: recurrence || null,
        recurrenceEndAt: recurrence && recurrenceEndAt ? new Date(recurrenceEndAt).toISOString() : null,
        groupId: groupId ? Number(groupId) : null,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      },
      note?.id,
    )

    if (note?.id && onSaveReminder) {
      if (reminderEnabled && remindAt) {
        await onSaveReminder(
          {
            noteId: note.id,
            remindAt: new Date(remindAt).toISOString(),
            message: reminderMessage.trim() || null,
          },
          reminder?.id,
        )
      } else if (!reminderEnabled && reminder?.id && onDeleteReminder) {
        await onDeleteReminder(reminder.id)
      }
    }

    onClose()
  }

  function setReminderBeforeDueAt(minutes: number) {
    if (!dueAt) return

    const date = new Date(dueAt)
    date.setMinutes(date.getMinutes() - minutes - date.getTimezoneOffset())
    setReminderEnabled(true)
    setRemindAt(date.toISOString().slice(0, 16))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await saveCurrentNote()
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }

    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      if (!saving) void saveCurrentNote()
    }
  }

  const header = (
    <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
      <span className="text-sm font-semibold text-slate-700">{note ? 'Editar nota' : 'Nueva nota'}</span>
      <button type="button" onClick={onClose} aria-label="Cerrar editor" className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )

  const formContent = (
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 py-3">
      {error ? <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</div> : null}

      <label className="grid shrink-0 gap-1 text-xs font-semibold text-slate-500">
        Título
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Título de la nota" className="rounded-xl border border-transparent bg-slate-50 px-3 py-2.5 text-base font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-50" />
      </label>

      <label className="flex min-h-0 flex-1 flex-col gap-1 text-xs font-semibold text-slate-500">
        Contenido
        <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Desarrolla la idea..." className="min-h-0 flex-1 resize-none rounded-xl border border-transparent bg-slate-50 px-3 py-3 text-sm font-normal leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-50" />
      </label>

      <div className="shrink-0 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Detalles</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-xs font-semibold text-slate-500">
            Prioridad
            <select value={priority} onChange={(event) => setPriority(event.target.value as NotePriority)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </label>

          <label className="grid gap-1.5 text-xs font-semibold text-slate-500">
            Fecha límite
            <input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </label>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-xs font-semibold text-slate-500">
            Repetir
            <select value={recurrence} onChange={(event) => setRecurrence(event.target.value as NoteRecurrence | '')} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
              <option value="">No repetir</option>
              <option value="daily">Diario</option>
              <option value="weekdays">Lunes a viernes</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </select>
          </label>

          {recurrence && (
            <label className="grid gap-1.5 text-xs font-semibold text-slate-500">
              Hasta
              <input type="datetime-local" value={recurrenceEndAt} onChange={(event) => setRecurrenceEndAt(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </label>
          )}
        </div>

      <label className="mt-3 grid gap-1.5 text-xs font-semibold text-slate-500">
        Grupo
        <select value={groupId} onChange={(event) => setGroupId(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
          <option value="">Sin grupo</option>
          {groupOptions.map((group) => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>
      </label>

      {tags.length > 0 && (
        <div className="mt-3">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Etiquetas</span>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => {
              const active = selectedTagIds.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setSelectedTagIds((prev) => active ? prev.filter((id) => id !== tag.id) : [...prev, tag.id])}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                    active
                      ? 'text-white'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                  style={active ? { backgroundColor: tag.color ?? '#3b82f6', color: '#fff' } : undefined}
                >
                  {tag.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {note?.id && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <input
              type="checkbox"
              checked={reminderEnabled}
              onChange={(event) => setReminderEnabled(event.target.checked)}
              className="h-3.5 w-3.5 accent-blue-600"
            />
            Recordatorio
          </label>

          {reminderEnabled && (
            <div className="mt-3 grid gap-2">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  type="datetime-local"
                  value={remindAt}
                  onChange={(event) => setRemindAt(event.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setReminderBeforeDueAt(15)}
                  disabled={!dueAt}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  15 min antes
                </button>
              </div>
              <input
                value={reminderMessage}
                onChange={(event) => setReminderMessage(event.target.value)}
                placeholder="Mensaje opcional"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          )}
        </div>
      )}
      </div>

      <button type="submit" disabled={saving} className="shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
        {saving ? 'Guardando...' : 'Guardar nota · Ctrl+Enter'}
      </button>
    </form>
  )

  if (inline) {
    return (
      <>
        {header}
        {formContent}
      </>
    )
  }

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="ml-auto flex h-full w-full flex-col bg-white shadow-2xl lg:w-[420px] lg:border-l lg:border-slate-200" onMouseDown={(event) => event.stopPropagation()}>
        {header}
        {formContent}
      </div>
    </div>
  )
}
