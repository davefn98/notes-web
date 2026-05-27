import { useState } from 'react'
import { X, Clock, Tag as TagIcon, Bell } from 'lucide-react'
import type { Group } from '../types/group'
import type { Note, NotePayload, NotePriority, NoteRecurrence } from '../types/note'
import type { Tag } from '../types/tag'
import type { Reminder, ReminderPayload, ReminderRule, ReminderRulePayload } from '../types/reminder'

type NoteEditorProps = {
  open: boolean
  note: Note | null
  groups: Group[]
  tags?: Tag[]
  saving: boolean
  reminder?: Reminder | null
  reminderRule?: ReminderRule | null
  inline?: boolean
  onClose: () => void
  onSave: (payload: NotePayload, id?: number) => Promise<Note>
  onSaveReminder?: (payload: ReminderPayload, id?: number) => Promise<void>
  onSaveReminderRule?: (payload: ReminderRulePayload, id?: number) => Promise<void>
  onDeleteReminder?: (id: number) => Promise<void>
}

function flattenGroups(groups: Group[]): Group[] {
  return groups.flatMap((group) => [group, ...flattenGroups(group.children)])
}

// Convert an ISO string to a local YYYY-MM-DDTHH:MM string for datetime inputs
function toInputDate(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

// Get local YYYY-MM-DD and HH:MM parts from a Date
function toLocalParts(date: Date): { date: string; time: string } {
  const y = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return { date: `${y}-${mo}-${d}`, time: `${h}:${mi}` }
}

// Build a Date from separate YYYY-MM-DD + HH:MM local strings
function fromParts(datePart: string, timePart: string): Date {
  const [y, mo, d] = datePart.split('-').map(Number)
  const [h, mi] = timePart.split(':').map(Number)
  return new Date(y, mo - 1, d, h, mi)
}

export function NoteEditor({ open, note, groups, tags = [], saving, reminder = null, reminderRule = null, inline = false, onClose, onSave, onSaveReminder, onSaveReminderRule, onDeleteReminder }: NoteEditorProps) {
  if (!open) return null

  return (
    <NoteEditorForm
      key={note?.id ?? 'new'}
      note={note}
      groups={groups}
      tags={tags}
      saving={saving}
      reminder={reminder}
      reminderRule={reminderRule}
      inline={inline}
      onClose={onClose}
      onSave={onSave}
      onSaveReminder={onSaveReminder}
      onSaveReminderRule={onSaveReminderRule}
      onDeleteReminder={onDeleteReminder}
    />
  )
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid min-w-0 max-w-full gap-1.5 overflow-hidden text-xs font-semibold text-slate-500">
      <span className="px-0.5">{label}</span>
      {children}
    </label>
  )
}

const inputClass = 'block min-w-0 max-w-full w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-50'
const selectClass = `${inputClass} text-slate-700`

const TIMEZONE_OPTIONS = [
  {
    group: 'América',
    zones: [
      { value: 'America/Lima', label: 'Lima (PET)' },
      { value: 'America/Bogota', label: 'Bogotá (COT)' },
      { value: 'America/Santiago', label: 'Santiago (CLT)' },
      { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (ART)' },
      { value: 'America/Caracas', label: 'Caracas (VET)' },
      { value: 'America/Mexico_City', label: 'Ciudad de México (CST)' },
      { value: 'America/New_York', label: 'Nueva York (EST)' },
      { value: 'America/Chicago', label: 'Chicago (CST)' },
      { value: 'America/Denver', label: 'Denver (MST)' },
      { value: 'America/Los_Angeles', label: 'Los Ángeles (PST)' },
      { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },
    ],
  },
  {
    group: 'Europa',
    zones: [
      { value: 'Europe/Madrid', label: 'Madrid (CET)' },
      { value: 'Europe/London', label: 'Londres (GMT)' },
      { value: 'Europe/Paris', label: 'París (CET)' },
      { value: 'Europe/Berlin', label: 'Berlín (CET)' },
      { value: 'Europe/Rome', label: 'Roma (CET)' },
      { value: 'Europe/Lisbon', label: 'Lisboa (WET)' },
      { value: 'Europe/Moscow', label: 'Moscú (MSK)' },
    ],
  },
  {
    group: 'Asia / Pacífico',
    zones: [
      { value: 'Asia/Tokyo', label: 'Tokio (JST)' },
      { value: 'Asia/Shanghai', label: 'Shanghái (CST)' },
      { value: 'Asia/Kolkata', label: 'Calcuta (IST)' },
      { value: 'Asia/Dubai', label: 'Dubái (GST)' },
      { value: 'Asia/Singapore', label: 'Singapur (SGT)' },
      { value: 'Australia/Sydney', label: 'Sídney (AEDT)' },
      { value: 'Pacific/Auckland', label: 'Auckland (NZST)' },
    ],
  },
  {
    group: 'Otras',
    zones: [
      { value: 'UTC', label: 'UTC' },
      { value: 'Africa/Cairo', label: 'El Cairo (EET)' },
      { value: 'Africa/Lagos', label: 'Lagos (WAT)' },
    ],
  },
]

const DAILY_QUICK_TIMES = ['08:00', '12:00', '18:00', '21:00']

function NoteEditorForm({ note, groups, tags = [], saving, reminder = null, reminderRule = null, inline = false, onClose, onSave, onSaveReminder, onSaveReminderRule, onDeleteReminder }: Omit<NoteEditorProps, 'open'>) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.content ?? '')
  const [priority, setPriority] = useState<NotePriority>(note?.priority ?? 'medium')
  const [dueAt, setDueAt] = useState(toInputDate(note?.dueAt))
  const [groupId, setGroupId] = useState(note?.groupId ? String(note.groupId) : '')
  const [recurrence, setRecurrence] = useState<NoteRecurrence | ''>(reminderRule?.active ? 'daily' : '')
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(note?.tags?.map((t) => t.id) ?? [])
  const [reminderEnabled, setReminderEnabled] = useState(Boolean(reminder || reminderRule?.active))

  // One-time reminder: separate date and time
  const initRemindAt = toInputDate(reminder?.remindAt)
  const [remindDate, setRemindDate] = useState(initRemindAt.slice(0, 10))
  const [remindTime, setRemindTime] = useState(initRemindAt.length >= 16 ? initRemindAt.slice(11, 16) : '')

  // Daily reminder
  const [timeOfDay, setTimeOfDay] = useState(reminderRule?.timeOfDay?.slice(0, 5) ?? '')
  const [timezone, setTimezone] = useState(
    reminderRule?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  )
  const [reminderMessage, setReminderMessage] = useState(reminder?.message ?? reminderRule?.message ?? '')
  const [error, setError] = useState<string | null>(null)
  const groupOptions = flattenGroups(groups)

  // ── Quick preset helpers ──────────────────────────────────────────────────

  function applyPreset(type: '30m' | '1h' | 'afternoon' | 'tomorrow') {
    const now = new Date()
    let target: Date
    switch (type) {
      case '30m':    target = new Date(now.getTime() + 30 * 60_000); break
      case '1h':     target = new Date(now.getTime() + 60 * 60_000); break
      case 'afternoon':
        target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0)
        if (target <= now) target.setDate(target.getDate() + 1)
        break
      default:
        target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0)
    }
    const { date, time } = toLocalParts(target)
    setReminderEnabled(true)
    setRemindDate(date)
    setRemindTime(time)
  }

  function setReminderBeforeDueAt(minutes: number) {
    if (!dueAt) return
    const [datePart, timePart] = dueAt.split('T')
    const [y, mo, d] = datePart.split('-').map(Number)
    const [h, mi] = timePart.split(':').map(Number)
    const target = new Date(y, mo - 1, d, h, mi - minutes)
    const { date, time } = toLocalParts(target)
    setReminderEnabled(true)
    setRemindDate(date)
    setRemindTime(time)
  }

  // ── Preview ───────────────────────────────────────────────────────────────

  function getReminderPreview(): string | null {
    if (recurrence === 'daily') {
      if (!timeOfDay) return null
      const tzLabel = TIMEZONE_OPTIONS.flatMap((g) => g.zones).find((z) => z.value === timezone)?.label ?? timezone
      return `Todos los días a las ${timeOfDay} · ${tzLabel}`
    }
    if (!remindDate || !remindTime) return null
    const date = fromParts(remindDate, remindTime)
    if (isNaN(date.getTime())) return null
    return new Intl.DateTimeFormat('es', {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    }).format(date)
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  async function saveCurrentNote() {
    setError(null)

    if (!title.trim() || !content.trim()) {
      setError('Título y contenido son obligatorios.')
      return
    }

    if (reminderEnabled) {
      if (recurrence === 'daily') {
        if (!timeOfDay) { setError('Selecciona la hora para el recordatorio diario.'); return }
      } else {
        if (!remindDate || !remindTime) { setError('Selecciona fecha y hora para el recordatorio.'); return }
        if (fromParts(remindDate, remindTime) <= new Date()) {
          setError('La fecha del recordatorio debe ser futura.')
          return
        }
      }
    }

    const savedNote = await onSave(
      {
        title: title.trim(),
        content: content.trim(),
        priority,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        groupId: groupId ? Number(groupId) : null,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      },
      note?.id,
    )

    if (onSaveReminder || onSaveReminderRule) {
      if (reminderEnabled && timeOfDay && recurrence === 'daily' && onSaveReminderRule) {
        await onSaveReminderRule(
          {
            noteId: savedNote.id,
            timeOfDay,
            timezone,
            recurrenceType: 'daily',
            active: true,
            message: reminderMessage.trim() || null,
          },
          reminderRule?.id,
        )
        if (reminder?.id && onDeleteReminder) await onDeleteReminder(reminder.id)

      } else if (reminderEnabled && remindDate && remindTime && onSaveReminder) {
        await onSaveReminder(
          {
            noteId: savedNote.id,
            remindAt: fromParts(remindDate, remindTime).toISOString(),
            message: reminderMessage.trim() || null,
          },
          reminder?.id,
        )
        if (reminderRule?.id && reminderRule.active && onSaveReminderRule) {
          await onSaveReminderRule({
            noteId: savedNote.id,
            timeOfDay: reminderRule.timeOfDay,
            timezone: reminderRule.timezone,
            recurrenceType: 'daily',
            active: false,
            message: reminderRule.message ?? null,
          }, reminderRule.id)
        }

      } else if (!reminderEnabled && reminder?.id && onDeleteReminder) {
        await onDeleteReminder(reminder.id)
      }

      if (!reminderEnabled && reminderRule?.id && reminderRule.active && onSaveReminderRule) {
        await onSaveReminderRule({
          noteId: savedNote.id,
          timeOfDay: reminderRule.timeOfDay,
          timezone: reminderRule.timezone,
          recurrenceType: 'daily',
          active: false,
          message: reminderRule.message ?? null,
        }, reminderRule.id)
      }
    }

    onClose()
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await saveCurrentNote()
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      if (!saving) void saveCurrentNote()
    }
  }

  const preview = getReminderPreview()

  function updateDueDate(value: string) {
    const time = dueAt.length >= 16 ? dueAt.slice(11, 16) : '09:00'
    setDueAt(value ? `${value}T${time}` : '')
  }

  function updateDueTime(value: string) {
    const date = dueAt.slice(0, 10)
    setDueAt(date && value ? `${date}T${value}` : '')
  }

  const header = (
    <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] lg:pt-4">
      <span className="text-sm font-semibold text-slate-700">{note ? 'Editar nota' : 'Nueva nota'}</span>
      <div className="flex-1" />
      <button type="button" onClick={onClose} aria-label="Cerrar editor" className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
        <X size={18} />
      </button>
    </div>
  )

  const formContent = (
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">

        {error && (
          <div className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700">{error}</div>
        )}

        <label className="grid gap-1.5 text-xs font-semibold text-slate-500">
          <span className="px-0.5">Título</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título de la nota"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-lg font-bold text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
          />
        </label>

        <label className="flex min-h-[180px] flex-1 flex-col gap-1.5 text-xs font-semibold text-slate-500">
          <span className="px-0.5">Contenido</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Desarrolla la idea..."
            className="min-h-[160px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-normal leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
          />
        </label>

        {/* ── Detalles ──────────────────────────────────────────────────────── */}
        <div className="max-w-full space-y-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <Clock size={12} />
            Detalles
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <FieldLabel label="Prioridad">
              <select value={priority} onChange={(e) => setPriority(e.target.value as NotePriority)} className={selectClass}>
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </FieldLabel>
            <FieldLabel label="Fecha límite">
              <div className="grid min-w-0 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
                <input type="date" value={dueAt.slice(0, 10)} onChange={(e) => updateDueDate(e.target.value)} className={inputClass} />
                <input type="time" value={dueAt.length >= 16 ? dueAt.slice(11, 16) : ''} onChange={(e) => updateDueTime(e.target.value)} className={inputClass} />
              </div>
            </FieldLabel>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <FieldLabel label="Repetir">
              <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as NoteRecurrence | '')} className={selectClass}>
                <option value="">No repetir</option>
                <option value="daily">Diario</option>
              </select>
            </FieldLabel>
          </div>

          <FieldLabel label="Grupo">
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className={selectClass}>
              <option value="">Sin grupo</option>
              {groupOptions.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </FieldLabel>
        </div>

        {/* ── Etiquetas ─────────────────────────────────────────────────────── */}
        {tags.length > 0 && (
          <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <TagIcon size={12} />
              Etiquetas
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const active = selectedTagIds.includes(tag.id)
                return (
                  <button
                    key={tag.id} type="button"
                    onClick={() => setSelectedTagIds((prev) => active ? prev.filter((id) => id !== tag.id) : [...prev, tag.id])}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${active ? 'text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}
                    style={active ? { backgroundColor: tag.color ?? '#3b82f6' } : undefined}
                  >
                    {tag.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Recordatorio ──────────────────────────────────────────────────── */}
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <label className="flex cursor-pointer items-center gap-3 text-xs font-bold text-slate-600">
            <input
              type="checkbox"
              checked={reminderEnabled}
              onChange={(e) => setReminderEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-blue-300"
            />
            Recordatorio
          </label>

          {reminderEnabled && (
            <div className="space-y-3 md:pl-7">

              {recurrence !== 'daily' ? (
                /* ── Recordatorio único ──────────────────────────────────── */
                <>
                  {/* Accesos rápidos */}
                  <div className="flex flex-wrap gap-1.5">
                    {([
                      { type: '30m', label: 'En 30 min' },
                      { type: '1h', label: 'En 1 hora' },
                      { type: 'afternoon', label: 'Esta tarde' },
                      { type: 'tomorrow', label: 'Mañana 9:00' },
                    ] as const).map(({ type, label }) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => applyPreset(type)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Fecha + Hora */}
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400">Fecha</span>
                      <input
                        type="date"
                        value={remindDate}
                        onChange={(e) => setRemindDate(e.target.value)}
                        className={`w-full ${inputClass}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400">Hora</span>
                      <div className="flex gap-1.5">
                        <input
                          type="time"
                          value={remindTime}
                          onChange={(e) => setRemindTime(e.target.value)}
                          className={`min-w-0 flex-1 ${inputClass}`}
                        />
                        <button
                          type="button"
                          onClick={() => setReminderBeforeDueAt(15)}
                          disabled={!dueAt}
                          title="15 min antes del vencimiento"
                          className="shrink-0 rounded-xl border border-slate-200 bg-white px-2 py-2 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          -15m
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* ── Recordatorio diario ─────────────────────────────────── */
                <>
                  {/* Accesos rápidos de hora */}
                  <div className="flex gap-1.5">
                    {DAILY_QUICK_TIMES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTimeOfDay(t)}
                        className={`flex-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${
                          timeOfDay === t
                            ? 'border-blue-400 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Hora + Zona horaria */}
                  <div className="grid gap-2 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400">Hora</span>
                      <input
                        type="time"
                        value={timeOfDay}
                        onChange={(e) => setTimeOfDay(e.target.value)}
                        className={`w-full ${inputClass}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400">Zona horaria</span>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className={`w-full ${selectClass}`}
                      >
                        {TIMEZONE_OPTIONS.map(({ group, zones }) => (
                          <optgroup key={group} label={group}>
                            {zones.map(({ value, label }) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Mensaje */}
              <input
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                placeholder="Mensaje opcional"
                className={`w-full ${inputClass} placeholder:text-slate-400`}
              />

              {/* Preview */}
              {preview && (
                <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-[11px] font-medium text-blue-700">
                  <Bell size={11} className="shrink-0" />
                  {preview}
                </div>
              )}

            </div>
          )}
        </div>

      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white px-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar nota'}
          <kbd className="rounded-md bg-blue-500/30 px-1.5 py-0.5 text-[10px] font-medium text-blue-100">Ctrl+Enter</kbd>
        </button>
      </div>
    </form>
  )

  if (inline) {
    return <>{header}{formContent}</>
  }

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ml-auto flex h-dvh w-full flex-col bg-white shadow-2xl lg:h-full lg:w-[440px]" onMouseDown={(e) => e.stopPropagation()}>
        {header}
        {formContent}
      </div>
    </div>
  )
}
