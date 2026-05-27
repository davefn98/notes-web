import { useEffect, useMemo, useRef, useState } from 'react'
import { AppLayout } from '../components/AppLayout'
import { FiltersBar } from '../components/FiltersBar'
import { NoteEditor } from '../components/NoteEditor'
import { NotesPanel } from '../components/NotesPanel'
import { QuickComposer } from '../components/QuickComposer'
import { useNotesStore } from '../store/notesStore'
import { useRemindersStore } from '../store/remindersStore'
import { useTagsStore } from '../store/tagsStore'
import { useUiStore } from '../store/uiStore'
import { getVisibleNotesForGroup } from '../utils/groupNotes'
import type { Group } from '../types/group'
import type { Note, NotePayload } from '../types/note'

function collectGroups(groups: Group[], map = new Map<number, Group>()) {
  groups.forEach((group) => {
    map.set(group.id, group)
    collectGroups(group.children, map)
  })
  return map
}

export function NotesPage() {
  const notes = useNotesStore((state) => state.notes)
  const groups = useNotesStore((state) => state.groups)
  const ungroupedNotes = useNotesStore((state) => state.ungroupedNotes)
  const filters = useNotesStore((state) => state.filters)
  const pagination = useNotesStore((state) => state.pagination)
  const loading = useNotesStore((state) => state.loading)
  const error = useNotesStore((state) => state.error)
  const loadGroups = useNotesStore((state) => state.loadGroups)
  const loadNotes = useNotesStore((state) => state.loadNotes)
  const setFilters = useNotesStore((state) => state.setFilters)
  const saveNote = useNotesStore((state) => state.saveNote)
  const toggleComplete = useNotesStore((state) => state.toggleComplete)
  const removeNote = useNotesStore((state) => state.removeNote)
  const reminders = useRemindersStore((state) => state.reminders)
  const reminderRules = useRemindersStore((state) => state.rules)
  const loadReminders = useRemindersStore((state) => state.loadReminders)
  const loadReminderRules = useRemindersStore((state) => state.loadReminderRules)
  const saveReminder = useRemindersStore((state) => state.saveReminder)
  const saveReminderRule = useRemindersStore((state) => state.saveReminderRule)
  const removeReminder = useRemindersStore((state) => state.removeReminder)
  const tags = useTagsStore((state) => state.tags)
  const editorOpen = useUiStore((state) => state.editorOpen)
  const editingNote = useUiStore((state) => state.editingNote)
  const openEditor = useUiStore((state) => state.openEditor)
  const closeEditor = useUiStore((state) => state.closeEditor)
  const [saving, setSaving] = useState(false)
  const editorPanelRef = useRef<HTMLDivElement>(null)

  const groupsById = useMemo(() => collectGroups(groups), [groups])
  const remindersByNoteId = useMemo(() => new Map(reminders.map((reminder) => [reminder.noteId, reminder])), [reminders])
  const reminderRulesByNoteId = useMemo(() => new Map(reminderRules.filter((rule) => rule.active).map((rule) => [rule.noteId, rule])), [reminderRules])
  const groupedNotes = useMemo(() => getVisibleNotesForGroup(groups, filters, ungroupedNotes), [groups, filters, ungroupedNotes])
  const visibleNotes = groupedNotes?.notes ?? notes
  const visiblePagination = groupedNotes?.pagination ?? pagination

  useEffect(() => {
    void loadGroups()
    void loadReminders()
    void loadReminderRules()
  }, [loadGroups, loadReminderRules, loadReminders])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadNotes()
    }, filters.search ? 300 : 0)
    return () => window.clearTimeout(timeout)
  }, [filters, loadNotes])

  useEffect(() => {
    if (!editorOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeEditor()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeEditor, editorOpen])

  async function handleSave(payload: NotePayload, id?: number) {
    setSaving(true)
    try {
      return await saveNote(payload, id)
    } finally {
      setSaving(false)
    }
  }

  async function handleQuickSave(payload: NotePayload) {
    await saveNote(payload)
  }

  async function handleDelete(note: Note) {
    if (!window.confirm(`Eliminar "${note.title}"?`)) return
    await removeNote(note.id)
  }

  function handleSelectNote(note: Note) {
    if (editorOpen && editingNote?.id === note.id) {
      closeEditor()
      return
    }

    openEditor(note)
  }

  function handleCanvasMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    if (!editorOpen) return

    const target = event.target as HTMLElement
    if (editorPanelRef.current?.contains(target)) return
    if (target.closest('[data-editor-panel]')) return
    if (target.closest('[data-note-card]')) return
    if (target.closest('[data-toolbar]')) return
    if (target.closest('[data-interactive-surface]')) return
    if (target.closest('[data-sidebar]')) return

    closeEditor()
  }

  return (
    <AppLayout>
      <div className="relative flex h-full overflow-hidden" onMouseDown={handleCanvasMouseDown}>

        {/* List column */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div data-toolbar="true" className="shrink-0 border-b border-slate-100 bg-slate-50 px-3 py-1.5">
            <FiltersBar filters={filters} onChange={setFilters} />
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-2 px-3 py-2.5">
              <QuickComposer groups={groups} onSave={handleQuickSave} />
              {error ? (
                <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>
              ) : null}
              <NotesPanel
                notes={visibleNotes}
                groupsById={groupsById}
                pagination={visiblePagination}
                loading={loading}
                selectedNoteId={editorOpen ? (editingNote?.id ?? null) : null}
                remindersByNoteId={remindersByNoteId}
                onEdit={handleSelectNote}
                onToggleComplete={toggleComplete}
                onDelete={handleDelete}
                onPageChange={(page) => setFilters({ page })}
              />
            </div>
          </div>
        </div>

        {/* Desktop slideover editor */}
        <div
          className={`pointer-events-none absolute inset-y-0 right-0 z-20 hidden w-[min(420px,calc(100vw-96px))] transform-gpu transition-transform duration-200 ease-out lg:block ${
            editorOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div ref={editorPanelRef} data-editor-panel="true" className="pointer-events-auto flex h-full flex-col border-l border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
            <NoteEditor
              open={editorOpen}
              note={editingNote}
              groups={groups}
              tags={tags}
              saving={saving}
              reminder={editingNote ? (remindersByNoteId.get(editingNote.id) ?? null) : null}
              reminderRule={editingNote ? (reminderRulesByNoteId.get(editingNote.id) ?? null) : null}
              inline
              onClose={closeEditor}
              onSave={handleSave}
              onSaveReminder={saveReminder}
              onSaveReminderRule={saveReminderRule}
              onDeleteReminder={removeReminder}
            />
          </div>
        </div>

      </div>

      {/* Mobile modal editor */}
      <div className="lg:hidden">
        <NoteEditor
          open={editorOpen}
          note={editingNote}
          groups={groups}
          tags={tags}
          saving={saving}
          reminder={editingNote ? (remindersByNoteId.get(editingNote.id) ?? null) : null}
          reminderRule={editingNote ? (reminderRulesByNoteId.get(editingNote.id) ?? null) : null}
          onClose={closeEditor}
          onSave={handleSave}
          onSaveReminder={saveReminder}
          onSaveReminderRule={saveReminderRule}
          onDeleteReminder={removeReminder}
        />
      </div>
    </AppLayout>
  )
}
