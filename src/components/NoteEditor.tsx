import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Folder, Tag as TagIcon, X } from 'lucide-react'
import { useUiStore } from '../store/uiStore'
import { useSchedulingForm } from '../hooks/useSchedulingForm'
import { SchedulingFields, type SchedulingStyles } from './SchedulingFields'
import { flattenGroups } from '../utils/scheduling'
import type { Group } from '../types/group'
import type { Note, NotePayload, NotePriority } from '../types/note'
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
  onClose: () => void
  onSave: (payload: NotePayload, id?: number) => Promise<Note>
  onSaveReminder?: (payload: ReminderPayload, id?: number) => Promise<void>
  onSaveReminderRule?: (payload: ReminderRulePayload, id?: number) => Promise<void>
  onDeleteReminder?: (id: number) => Promise<void>
}

type Theme = 'light' | 'dark'

function noteEditorStyles(theme: Theme) {
  const dark = theme === 'dark'
  const metaInput = dark
    ? 'w-full rounded-xl border-0 bg-slate-800/70 px-3 py-2.5 text-sm text-slate-100 outline-none ring-1 ring-slate-700/60 transition placeholder:text-slate-500 focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/40'
    : 'w-full rounded-xl border-0 bg-slate-100/80 px-3 py-2.5 text-sm text-slate-800 outline-none ring-1 ring-slate-200 transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-300'

  return {
    backdrop: dark
      ? 'fixed inset-0 z-40 bg-slate-950/78 p-0 backdrop-blur-md sm:p-5'
      : 'fixed inset-0 z-40 bg-slate-950/25 p-0 backdrop-blur-md sm:p-5',
    shell: dark
      ? 'mx-auto flex h-full w-full max-w-[900px] flex-col overflow-hidden bg-[#0f172a] shadow-2xl shadow-black/50 sm:h-[min(90vh,920px)] sm:rounded-[28px] sm:ring-1 sm:ring-white/10'
      : 'mx-auto flex h-full w-full max-w-[900px] flex-col overflow-hidden bg-white shadow-2xl shadow-slate-950/20 sm:h-[min(90vh,920px)] sm:rounded-[28px] sm:ring-1 sm:ring-slate-200',
    header: dark
      ? 'flex shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[#0f172a]/95 px-5 py-4 sm:px-6'
      : 'flex shrink-0 items-center gap-3 border-b border-slate-100 bg-white px-5 py-4 sm:px-6',
    headerKicker: dark
      ? 'text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500'
      : 'text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400',
    headerTitle: dark ? 'text-sm font-bold text-slate-100' : 'text-sm font-bold text-slate-900',
    headerHint: dark ? 'hidden text-xs text-slate-500 sm:block' : 'hidden text-xs text-slate-400 sm:block',
    closeButton: dark
      ? 'rounded-xl p-2 text-slate-400 transition hover:bg-white/5 hover:text-slate-100'
      : 'rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700',
    form: dark ? 'flex min-h-0 flex-1 flex-col bg-[#0f172a]' : 'flex min-h-0 flex-1 flex-col bg-white',
    body: 'min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6',
    bodyGrid: 'grid gap-7 lg:grid-cols-[minmax(0,1fr)_290px]',
    editorColumn: 'min-w-0 space-y-4',
    sidebar: dark
      ? 'space-y-5 border-t border-white/[0.06] pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0'
      : 'space-y-5 border-t border-slate-100 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0',
    titleInput: dark
      ? 'w-full border-0 bg-transparent px-0 py-2 text-3xl font-black leading-tight text-slate-50 outline-none placeholder:text-slate-600 focus:ring-0'
      : 'w-full border-0 bg-transparent px-0 py-2 text-3xl font-black leading-tight text-slate-950 outline-none placeholder:text-slate-300 focus:ring-0',
    textarea: dark
      ? 'min-h-[300px] w-full resize-y rounded-2xl border-0 bg-slate-950/35 px-5 py-4 text-[15px] leading-8 text-slate-200 outline-none ring-1 ring-white/[0.06] transition placeholder:text-slate-600 focus:bg-slate-950/45 focus:ring-2 focus:ring-blue-500/25'
      : 'min-h-[300px] w-full resize-y rounded-2xl border-0 bg-slate-50 px-5 py-4 text-[15px] leading-8 text-slate-700 outline-none ring-1 ring-slate-100 transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-100',
    fieldError: dark ? 'mt-1 text-xs font-medium text-rose-300' : 'mt-1 text-xs font-medium text-rose-600',
    metaGroup: 'space-y-3',
    metaHeader: dark
      ? 'flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500'
      : 'flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400',
    label: dark
      ? 'grid gap-1.5 text-xs font-semibold text-slate-400'
      : 'grid gap-1.5 text-xs font-semibold text-slate-500',
    labelText: 'px-0.5',
    metaInput,
    helper: dark ? 'text-xs leading-5 text-slate-500' : 'text-xs leading-5 text-slate-500',
    divider: dark ? 'h-px bg-white/[0.06]' : 'h-px bg-slate-100',
    tagChip: dark
      ? 'rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-white/20 hover:text-slate-100'
      : 'rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900',
    compactRow: 'grid grid-cols-2 gap-2',
    warning: dark
      ? 'rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-semibold leading-5 text-amber-200 ring-1 ring-amber-300/15'
      : 'rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-700 ring-1 ring-amber-200',
    inlineError: dark
      ? 'rounded-xl bg-rose-500/10 px-3 py-2 text-xs font-semibold leading-5 text-rose-200 ring-1 ring-rose-300/15'
      : 'rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold leading-5 text-rose-700 ring-1 ring-rose-200',
    preview: dark
      ? 'rounded-xl bg-slate-950/35 px-3 py-2 text-xs font-medium leading-5 text-blue-200 ring-1 ring-white/[0.06]'
      : 'rounded-xl bg-white px-3 py-2 text-xs font-medium leading-5 text-blue-700 ring-1 ring-blue-100',
    mutedNote: dark ? 'text-[11px] leading-4 text-slate-500' : 'text-[11px] leading-4 text-slate-500',
    footer: dark
      ? 'flex shrink-0 flex-col gap-2 border-t border-white/[0.06] bg-[#0f172a]/95 px-5 py-4 sm:flex-row-reverse sm:px-6'
      : 'flex shrink-0 flex-col gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row-reverse sm:px-6',
    save: 'flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto',
    cancel: dark
      ? 'flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-slate-400 transition hover:bg-white/[0.05] hover:text-slate-100 sm:w-auto'
      : 'flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 sm:w-auto',
  }
}

export function NoteEditor({
  open,
  note,
  groups,
  tags = [],
  saving,
  reminder = null,
  reminderRule = null,
  onClose,
  onSave,
  onSaveReminder,
  onSaveReminderRule,
  onDeleteReminder,
}: NoteEditorProps) {
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
      onClose={onClose}
      onSave={onSave}
      onSaveReminder={onSaveReminder}
      onSaveReminderRule={onSaveReminderRule}
      onDeleteReminder={onDeleteReminder}
    />
  )
}

function NoteEditorForm({
  note,
  groups,
  tags = [],
  saving,
  reminder = null,
  reminderRule = null,
  onClose,
  onSave,
  onSaveReminder,
  onSaveReminderRule,
  onDeleteReminder,
}: Omit<NoteEditorProps, 'open'>) {
  const theme = useUiStore((state) => state.theme)
  const styles = noteEditorStyles(theme)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.content ?? '')
  const [priority, setPriority] = useState<NotePriority>(note?.priority ?? 'medium')
  const [groupId, setGroupId] = useState(note?.groupId ? String(note.groupId) : '')
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(note?.tags?.map((t) => t.id) ?? [])
  const [saveAttempted, setSaveAttempted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const scheduling = useSchedulingForm({ dueAt: note?.dueAt, reminder, reminderRule })
  const groupOptions = flattenGroups(groups)

  useEffect(() => {
    if (!note) titleInputRef.current?.focus()
  }, [note])

  // Close on Escape regardless of which element has focus
  useEffect(() => {
    function onDocKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onDocKey)
    return () => document.removeEventListener('keydown', onDocKey)
  }, [onClose])

  async function saveCurrentNote() {
    setSaveAttempted(true)
    setSubmitError(null)

    if (!title.trim() || !content.trim()) return

    if (scheduling.isDailyRule) {
      if (!scheduling.timeOfDay) return
    } else {
      if (
        (scheduling.dueDate || scheduling.dueTime) &&
        (!scheduling.dueDate || !scheduling.dueTime)
      )
        return
      if (scheduling.remindAtDate && scheduling.remindAtDate <= new Date()) {
        setSubmitError('Este aviso ya está vencido. Elige una hora futura.')
        return
      }
    }

    try {
      const savedNote = await onSave(
        {
          title: title.trim(),
          content: content.trim(),
          priority,
          dueAt: scheduling.dueDateTime ? scheduling.dueDateTime.toISOString() : null,
          groupId: groupId ? Number(groupId) : null,
          tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        },
        note?.id,
      )

      if (onSaveReminder || onSaveReminderRule || onDeleteReminder) {
        const { reminderPayload, rulePayload, deleteReminderId } = scheduling.buildReminderPayloads(
          savedNote.id,
          { reminder, reminderRule },
        )
        if (rulePayload && onSaveReminderRule)
          await onSaveReminderRule(rulePayload.payload, rulePayload.id)
        if (reminderPayload && onSaveReminder)
          await onSaveReminder(reminderPayload.payload, reminderPayload.id)
        if (deleteReminderId && onDeleteReminder) await onDeleteReminder(deleteReminderId)
      }

      onClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No se pudo guardar la nota.')
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await saveCurrentNote()
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      if (!saving) void saveCurrentNote()
    }
  }

  const titleError = saveAttempted && !title.trim() ? 'El título es obligatorio.' : null
  const contentError = saveAttempted && !content.trim() ? 'El contenido es obligatorio.' : null

  const schedulingStyles: SchedulingStyles = {
    label: styles.label,
    labelText: styles.labelText,
    input: styles.metaInput,
    compactRow: styles.compactRow,
    warning: styles.warning,
    inlineError: styles.inlineError,
    preview: styles.preview,
    mutedNote: styles.mutedNote,
    metaHeader: styles.metaHeader,
  }

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        data-editor-panel="true"
        className={styles.shell}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <div className={styles.headerKicker}>{note ? 'Editar nota' : 'Nueva nota'}</div>
            <div className={styles.headerTitle}>Editor</div>
          </div>
          <div className="flex-1" />
          <span className={styles.headerHint}>Ctrl+Enter para guardar · Esc para cerrar</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar editor"
            className={styles.closeButton}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className={styles.form}>
          <div className={styles.body}>
            <div className={styles.bodyGrid}>
              <main className={styles.editorColumn}>
                {submitError ? <div className={styles.inlineError}>{submitError}</div> : null}

                <div>
                  <input
                    ref={titleInputRef}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Título de la nota"
                    className={styles.titleInput}
                  />
                  {titleError ? <div className={styles.fieldError}>{titleError}</div> : null}
                </div>

                <div>
                  <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="Escribe la nota..."
                    className={styles.textarea}
                  />
                  {contentError ? <div className={styles.fieldError}>{contentError}</div> : null}
                </div>

                {tags.length > 0 ? (
                  <div className="space-y-3">
                    <div className={styles.metaHeader}>
                      <TagIcon size={13} />
                      Etiquetas
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => {
                        const active = selectedTagIds.includes(tag.id)
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() =>
                              setSelectedTagIds((prev) =>
                                active ? prev.filter((id) => id !== tag.id) : [...prev, tag.id],
                              )
                            }
                            className={`${styles.tagChip} ${active ? 'text-white shadow-sm' : ''}`}
                            style={
                              active
                                ? { backgroundColor: tag.color ?? '#3b82f6', borderColor: tag.color ?? '#3b82f6' }
                                : undefined
                            }
                          >
                            {tag.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
              </main>

              <aside className={styles.sidebar}>
                <section className={styles.metaGroup}>
                  <div className={styles.metaHeader}>
                    <Folder size={13} />
                    Organización
                  </div>
                  <label className={styles.label}>
                    <span className={styles.labelText}>Prioridad</span>
                    <select
                      value={priority}
                      onChange={(event) => setPriority(event.target.value as NotePriority)}
                      className={styles.metaInput}
                    >
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </label>
                  <label className={styles.label}>
                    <span className={styles.labelText}>Grupo</span>
                    <select
                      value={groupId}
                      onChange={(event) => setGroupId(event.target.value)}
                      className={styles.metaInput}
                    >
                      <option value="">Sin grupo</option>
                      {groupOptions.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </section>

                <div className={styles.divider} />

                <section className={styles.metaGroup}>
                  <div className={styles.metaHeader}>
                    <CalendarDays size={13} />
                    Programación
                  </div>
                  <SchedulingFields
                    scheduling={scheduling}
                    saveAttempted={saveAttempted}
                    styles={schedulingStyles}
                    showHeader={false}
                  />
                </section>
              </aside>
            </div>
          </div>

          <div className={styles.footer}>
            <button type="submit" disabled={saving} className={styles.save}>
              {saving ? 'Guardando...' : 'Guardar nota'}
              <kbd className="rounded-md bg-blue-500/30 px-1.5 py-0.5 text-[10px] font-medium text-blue-100">
                Ctrl+Enter
              </kbd>
            </button>
            <button type="button" onClick={onClose} className={styles.cancel}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
