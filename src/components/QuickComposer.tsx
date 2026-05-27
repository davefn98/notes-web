import { useEffect, useRef, useState } from 'react'
import { useUiStore } from '../store/uiStore'
import type { Group } from '../types/group'
import type { NotePayload, NotePriority } from '../types/note'

type QuickComposerProps = {
  groups: Group[]
  onSave: (payload: NotePayload) => Promise<void>
}

function flattenGroups(groups: Group[]): Group[] {
  return groups.flatMap((g) => [g, ...flattenGroups(g.children)])
}

const selectClass = 'h-7 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600 outline-none focus:border-blue-500'

export function QuickComposer({ groups, onSave }: QuickComposerProps) {
  const privacyMode = useUiStore((state) => state.privacyMode)
  const [expanded, setExpanded] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [priority, setPriority] = useState<NotePriority>('medium')
  const [groupId, setGroupId] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [saving, setSaving] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!expanded) return

    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setExpanded(false)
      }
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setExpanded(false)
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [expanded])

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    try {
      await onSave({
        title: title.trim(),
        content: content.trim(),
        priority,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        groupId: groupId ? Number(groupId) : null,
      })
      setTitle('')
      setContent('')
      setPriority('medium')
      setGroupId('')
      setDueAt('')
      setExpanded(false)
    } finally {
      setSaving(false)
    }
  }

  function handleComposerKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setExpanded(false)
      return
    }

    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      if (!saving) void handleSave()
    }
  }

  const groupSelectStyle = privacyMode
    ? { color: 'transparent', textShadow: '0 0 5px rgba(15,23,42,0.35)' }
    : undefined

  const hasFields = title.trim() || content.trim()

  return (
    <div ref={containerRef} data-interactive-surface="true" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-400 transition hover:bg-slate-50"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-xs leading-none text-slate-400">
            +
          </span>
          Tomar nota...
        </button>
      ) : (
        <div className="p-3" onKeyDown={handleComposerKeyDown}>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            className="w-full text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tomar nota..."
            rows={hasFields ? 3 : 2}
            className="mt-1.5 w-full resize-none text-sm leading-6 text-slate-600 outline-none placeholder:text-slate-400"
          />
          <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as NotePriority)}
              className={selectClass}
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className={`${selectClass} min-w-0 max-w-[140px] flex-1`}
              style={groupSelectStyle}
            >
              <option value="">Sin grupo</option>
              {flattenGroups(groups).map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className={selectClass}
            />
            <div className="ml-auto flex gap-1">
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="rounded-md px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={!title.trim() || saving}
                className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? '...' : 'Guardar · Ctrl+Enter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
