import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Plus, Tag as TagIcon } from 'lucide-react'
import { useUiStore } from '../store/uiStore'
import { useSchedulingForm } from '../hooks/useSchedulingForm'
import { flattenGroups, TIMEZONE_OPTIONS } from '../utils/scheduling'
import type { Group } from '../types/group'
import type { Note, NotePayload, NotePriority, NoteRecurrence } from '../types/note'
import type { Tag } from '../types/tag'
import type { ReminderPayload, ReminderRulePayload } from '../types/reminder'

type QuickComposerProps = {
  groups: Group[]
  tags: Tag[]
  onSave: (payload: NotePayload) => Promise<Note>
  onSaveReminder?: (payload: ReminderPayload, id?: number) => Promise<void>
  onSaveReminderRule?: (payload: ReminderRulePayload, id?: number) => Promise<void>
}

// ─── TagPicker ────────────────────────────────────────────────────────────────

type TagPickerProps = {
  tags: Tag[]
  selectedIds: number[]
  onChange: (ids: number[]) => void
  dark: boolean
  chipClass: string
}

function TagPicker({ tags, selectedIds, onChange, dark, chipClass }: TagPickerProps) {
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) setDropPos({ top: rect.bottom + 4, left: rect.left })

    function close() { setOpen(false) }

    function onDown(e: MouseEvent) {
      if (
        !dropRef.current?.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      )
        close()
    }

    document.addEventListener('mousedown', onDown)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  function toggle(id: number) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])
  }

  const label =
    selectedIds.length === 0
      ? 'Sin tags'
      : selectedIds.length === 1
        ? (tags.find((t) => t.id === selectedIds[0])?.name ?? '1 tag')
        : `${selectedIds.length} tags`

  const panelClass = dark
    ? 'min-w-[160px] overflow-hidden rounded-lg border border-white/10 bg-slate-950 py-1 shadow-2xl shadow-black/40'
    : 'min-w-[160px] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10'

  const itemBase = dark
    ? 'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium transition'
    : 'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium transition'

  const itemNormal = dark ? `${itemBase} text-slate-300 hover:bg-slate-800` : `${itemBase} text-slate-600 hover:bg-slate-50`
  const itemActive = dark ? `${itemBase} font-semibold text-blue-300 bg-blue-500/10` : `${itemBase} font-semibold text-blue-600 bg-blue-50`

  const emptyClass = dark ? 'px-3 py-2 text-xs text-slate-500' : 'px-3 py-2 text-xs text-slate-400'

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${chipClass} flex items-center gap-1`}
        title="Etiquetas"
      >
        <TagIcon size={11} className="shrink-0" />
        <span className="max-w-[72px] truncate">{label}</span>
        <svg width="8" height="5" viewBox="0 0 8 5" className="shrink-0 opacity-50">
          <path d="M0.5 0.5L4 4L7.5 0.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open
        ? createPortal(
            <div
              ref={dropRef}
              className={panelClass}
              style={{ position: 'fixed', top: dropPos?.top ?? 0, left: dropPos?.left ?? 0, zIndex: 9999 }}
            >
              {tags.length === 0 ? (
                <p className={emptyClass}>No hay etiquetas creadas</p>
              ) : (
                tags.map((tag) => {
                  const active = selectedIds.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggle(tag.id)}
                      className={active ? itemActive : itemNormal}
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: tag.color ?? (dark ? '#475569' : '#cbd5e1') }}
                      />
                      <span className="min-w-0 flex-1 truncate">{tag.name}</span>
                      {active ? <Check size={10} className="ml-auto shrink-0" /> : null}
                    </button>
                  )
                })
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function composerStyles(dark: boolean) {
  const chip = dark
    ? 'h-7 shrink-0 rounded-md border-0 bg-slate-800 px-2 text-xs text-slate-200 outline-none ring-1 ring-slate-700/60 transition focus:ring-2 focus:ring-blue-500/40'
    : 'h-7 shrink-0 rounded-md border-0 bg-slate-100 px-2 text-xs text-slate-700 outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-blue-400/40'

  return {
    shell: dark
      ? 'overflow-hidden rounded-xl border border-white/[0.08] bg-slate-900 shadow-md'
      : 'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm',
    trigger: dark
      ? 'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-500 transition hover:bg-white/[0.03]'
      : 'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-400 transition hover:bg-slate-50',
    triggerIcon: dark
      ? 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-slate-700 text-slate-500'
      : 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-slate-400',
    body: 'px-4 pt-2.5 pb-3',
    titleInput: dark
      ? 'w-full border-0 bg-transparent text-[15px] font-semibold text-slate-50 outline-none placeholder:text-slate-500 focus:ring-0'
      : 'w-full border-0 bg-transparent text-[15px] font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0',
    titleError: dark ? 'mt-0.5 text-xs font-medium text-rose-300' : 'mt-0.5 text-xs font-medium text-rose-600',
    row2: 'mt-2 flex flex-wrap items-center gap-1.5',
    chip,
    saveBtn:
      'h-7 shrink-0 rounded-md bg-blue-600 px-3 text-xs font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50',
    errorBanner: dark
      ? 'mb-2 rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-xs font-semibold text-rose-200 ring-1 ring-rose-300/15'
      : 'mb-2 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200',
    preview: dark ? 'mt-1 text-xs font-medium text-blue-300' : 'mt-1 text-xs font-medium text-blue-600',
    inlineError: dark ? 'mt-1 text-xs font-medium text-rose-300' : 'mt-1 text-xs font-medium text-rose-500',
    warning: dark ? 'mt-1 text-xs font-medium text-amber-300' : 'mt-1 text-xs font-medium text-amber-600',
  }
}

// ─── QuickComposer ────────────────────────────────────────────────────────────

export function QuickComposer({ groups, tags, onSave, onSaveReminder, onSaveReminderRule }: QuickComposerProps) {
  const theme = useUiStore((s) => s.theme)
  const privacyMode = useUiStore((s) => s.privacyMode)
  const dark = theme === 'dark'
  const s = composerStyles(dark)

  const [expanded, setExpanded] = useState(false)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<NotePriority>('medium')
  const [groupId, setGroupId] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [saveAttempted, setSaveAttempted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const scheduling = useSchedulingForm()
  const containerRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!expanded) return
    const t = setTimeout(() => titleRef.current?.focus(), 30)
    return () => clearTimeout(t)
  }, [expanded])

  useEffect(() => {
    if (!expanded) return
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) collapse()
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded])

  function collapse() {
    setExpanded(false)
    setTitle('')
    setPriority('medium')
    setGroupId('')
    setSelectedTagIds([])
    setSaveAttempted(false)
    setSubmitError(null)
    scheduling.reset()
  }

  async function handleSave() {
    setSaveAttempted(true)
    setSubmitError(null)

    if (!title.trim()) return
    if (scheduling.isDailyRule && !scheduling.timeOfDay) return
    if (
      !scheduling.isDailyRule &&
      (scheduling.dueDate || scheduling.dueTime) &&
      (!scheduling.dueDate || !scheduling.dueTime)
    )
      return
    if (!scheduling.isDailyRule && scheduling.remindAtDate && scheduling.remindAtDate <= new Date()) {
      setSubmitError('Aviso ya vencido — elige una hora futura.')
      return
    }

    setSaving(true)
    try {
      const note = await onSave({
        title: title.trim(),
        content: '',
        priority,
        dueAt: scheduling.dueDateTime ? scheduling.dueDateTime.toISOString() : null,
        groupId: groupId ? Number(groupId) : null,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      })
      const { reminderPayload, rulePayload } = scheduling.buildReminderPayloads(note.id)
      if (rulePayload && onSaveReminderRule) await onSaveReminderRule(rulePayload.payload)
      if (reminderPayload && onSaveReminder) await onSaveReminder(reminderPayload.payload)
      collapse()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      collapse()
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      if (!saving) void handleSave()
    }
  }

  const groupOptions = flattenGroups(groups)
  const groupSelectStyle = privacyMode
    ? { color: 'transparent', textShadow: '0 0 5px rgba(15,23,42,0.35)' }
    : undefined

  const dueIncomplete =
    saveAttempted &&
    !scheduling.isDailyRule &&
    Boolean(scheduling.dueDate || scheduling.dueTime) &&
    (!scheduling.dueDate || !scheduling.dueTime)
  const dailyMissing = saveAttempted && scheduling.isDailyRule && !scheduling.timeOfDay

  return (
    <div ref={containerRef} data-interactive-surface="true" className={s.shell}>
      {/* Collapsed trigger */}
      {!expanded ? (
        <button type="button" onClick={() => setExpanded(true)} className={s.trigger}>
          <span className={s.triggerIcon}>
            <Plus size={12} />
          </span>
          Tomar nota...
        </button>
      ) : null}

      {/* Expanded — grid-rows height animation */}
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className={s.body} onKeyDown={handleKeyDown}>
            {submitError ? <div className={s.errorBanner}>{submitError}</div> : null}

            {/* Row 1 — Title */}
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la nota"
              className={s.titleInput}
            />
            {saveAttempted && !title.trim() ? (
              <p className={s.titleError}>El título es obligatorio.</p>
            ) : null}

            {/* Row 2 — All metadata chips + save */}
            <div className={s.row2}>
              {/* Priority */}
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as NotePriority)}
                className={s.chip}
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>

              {/* Group */}
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className={`${s.chip} max-w-[120px]`}
                style={groupSelectStyle}
              >
                <option value="">Sin grupo</option>
                {groupOptions.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>

              {/* Tags — custom multi-select via portal dropdown */}
              <TagPicker
                tags={tags}
                selectedIds={selectedTagIds}
                onChange={setSelectedTagIds}
                dark={dark}
                chipClass={s.chip}
              />

              {/* Due date */}
              <input
                type="date"
                value={scheduling.dueDate}
                onChange={(e) => scheduling.setDueDate(e.target.value)}
                className={s.chip}
              />

              {/* Due time */}
              <input
                type="time"
                value={scheduling.dueTime}
                onChange={(e) => scheduling.setDueTime(e.target.value)}
                className={s.chip}
              />

              {/* Recurrence */}
              <select
                value={scheduling.recurrence}
                onChange={(e) => scheduling.setRecurrence(e.target.value as NoteRecurrence | '')}
                className={s.chip}
              >
                <option value="">No repetir</option>
                <option value="daily">Diario</option>
              </select>

              {/* Conditional: remind-before OR daily time + timezone */}
              {!scheduling.isDailyRule ? (
                <select
                  value={scheduling.remindBefore}
                  onChange={(e) => scheduling.setRemindBefore(e.target.value)}
                  className={s.chip}
                >
                  <option value="0">Momento exacto</option>
                  <option value="5">5 min antes</option>
                  <option value="15">15 min antes</option>
                  <option value="30">30 min antes</option>
                  <option value="60">1 hora antes</option>
                  <option value="1440">1 día antes</option>
                </select>
              ) : (
                <>
                  <input
                    type="time"
                    value={scheduling.timeOfDay}
                    onChange={(e) => scheduling.setTimeOfDay(e.target.value)}
                    className={s.chip}
                    title="Hora diaria"
                  />
                  <select
                    value={scheduling.timezone}
                    onChange={(e) => scheduling.setTimezone(e.target.value)}
                    className={`${s.chip} max-w-[110px]`}
                  >
                    {TIMEZONE_OPTIONS.map(({ group, zones }) => (
                      <optgroup key={group} label={group}>
                        {zones.map(({ value, label }) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </>
              )}

              {/* Spacer pushes save to the right */}
              <span className="flex-1" />

              {/* Save */}
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={!title.trim() || saving}
                className={s.saveBtn}
              >
                {saving ? '...' : 'Guardar'}
              </button>
            </div>

            {/* Inline feedback */}
            {scheduling.punctualPreview ? (
              <p className={s.preview}>🔔 {scheduling.punctualPreview}</p>
            ) : scheduling.isDailyRule && scheduling.dailyPreview ? (
              <p className={s.preview}>🔔 {scheduling.dailyPreview}</p>
            ) : null}

            {dueIncomplete ? (
              <p className={s.inlineError}>Completa fecha y hora juntos.</p>
            ) : scheduling.dueAtPast ? (
              <p className={s.warning}>Fecha límite en el pasado.</p>
            ) : null}

            {!scheduling.isDailyRule && scheduling.punctualPast && !dueIncomplete ? (
              <p className={s.warning}>Aviso vencido — elige otra hora.</p>
            ) : null}

            {dailyMissing ? <p className={s.inlineError}>Selecciona la hora diaria.</p> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
