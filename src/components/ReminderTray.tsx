import { useEffect, useRef, useState } from 'react'
import { Bell, BellRing, Check, ChevronDown, Clock, RotateCcw, SkipForward } from 'lucide-react'
import { useNotesStore } from '../store/notesStore'
import { useRemindersStore } from '../store/remindersStore'
import { useUiStore } from '../store/uiStore'
import type { DueReminderItem } from '../types/reminder'

function formatRelativeTime(remindAt: string): { label: string; overdue: boolean } {
  const now = Date.now()
  const target = new Date(remindAt).getTime()
  const diff = target - now
  const absDiff = Math.abs(diff)

  if (absDiff < 60000) return { label: 'Ahora', overdue: diff <= 0 }
  if (absDiff < 3600000) return { label: diff < 0 ? `Hace ${Math.ceil(absDiff / 60000)} min` : `En ${Math.ceil(diff / 60000)} min`, overdue: diff < 0 }
  if (absDiff < 86400000) return { label: diff < 0 ? `Hace ${Math.ceil(absDiff / 3600000)}h` : `En ${Math.ceil(diff / 3600000)}h`, overdue: diff < 0 }
  return {
    label: new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' }).format(target),
    overdue: diff < 0,
  }
}

function getMinutesUntilTomorrow(): number {
  const now = new Date()
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 8, 0, 0)
  return Math.max(1, Math.ceil((tomorrow.getTime() - now.getTime()) / 60000))
}

function snoozeOptions() {
  return [
    { label: '10 min', minutes: 10 },
    { label: '30 min', minutes: 30 },
    { label: '1 hora', minutes: 60 },
    { label: 'Mañana', minutes: getMinutesUntilTomorrow() },
  ]
}

export function ReminderTray() {
  const [open, setOpen] = useState(false)
  const dueItems = useRemindersStore((state) => state.dueItems)
  const completeReminder = useRemindersStore((state) => state.completeReminder)
  const uncompleteReminder = useRemindersStore((state) => state.uncompleteReminder)
  const snoozeReminder = useRemindersStore((state) => state.snoozeReminder)
  const completeOccurrence = useRemindersStore((state) => state.completeOccurrence)
  const uncompleteOccurrence = useRemindersStore((state) => state.uncompleteOccurrence)
  const snoozeOccurrence = useRemindersStore((state) => state.snoozeOccurrence)
  const skipOccurrence = useRemindersStore((state) => state.skipOccurrence)
  const openEditor = useUiStore((state) => state.openEditor)
  const notes = useNotesStore((state) => state.notes)
  const trayRef = useRef<HTMLDivElement>(null)
  const [snoozingId, setSnoozingId] = useState<string | null>(null)
  const [recentlyCompleted, setRecentlyCompleted] = useState<DueReminderItem | null>(null)
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (trayRef.current && !trayRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function requestNotificationPermission() {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  function handleBellClick() {
    requestNotificationPermission()
    setOpen((prev) => !prev)
  }

  async function handleComplete(item: DueReminderItem) {
    if (item.source === 'reminder') {
      await completeReminder(item.id)
    } else {
      await completeOccurrence(item.id)
    }
    setRecentlyCompleted(item)
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
    undoTimeoutRef.current = setTimeout(() => setRecentlyCompleted(null), 5000)
  }

  async function handleUndoComplete() {
    if (!recentlyCompleted) return
    if (recentlyCompleted.source === 'reminder') {
      await uncompleteReminder(recentlyCompleted.id)
    } else {
      await uncompleteOccurrence(recentlyCompleted.id)
    }
    setRecentlyCompleted(null)
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
  }

  async function handleSnooze(item: DueReminderItem, minutes: number) {
    if (item.source === 'reminder') {
      await snoozeReminder(item.id, minutes)
    } else {
      await snoozeOccurrence(item.id, minutes)
    }
    setSnoozingId(null)
  }

  async function handleSkip(item: DueReminderItem) {
    if (item.source === 'occurrence') {
      await skipOccurrence(item.id)
    }
  }

  function handleOpenNote(item: DueReminderItem) {
    const note = notes.find((n) => n.id === item.noteId)
    if (note) {
      openEditor(note)
      setOpen(false)
    }
  }

  const itemKey = (item: DueReminderItem) => `${item.source}:${item.id}`

  return (
    <div ref={trayRef} className="relative">
      <button
        type="button"
        onClick={handleBellClick}
        className="relative rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        aria-label="Recordatorios"
        title="Recordatorios"
      >
        {dueItems.length > 0 ? <BellRing size={18} /> : <Bell size={18} />}
        {dueItems.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white leading-none">
            {dueItems.length > 99 ? '99+' : dueItems.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 origin-top-right rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          <div className="border-b border-slate-100 px-3 py-2">
            <span className="text-xs font-semibold text-slate-800">Recordatorios vencidos</span>
          </div>

          <div className="max-h-80 overflow-y-auto overscroll-contain">
            {dueItems.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <Bell size={24} className="text-slate-300" />
                <span className="text-xs text-slate-400">No tienes recordatorios vencidos.</span>
              </div>
            ) : (
              <>
                <div className="px-2 pt-2">
                  <span className="px-1 text-[10px] font-semibold uppercase tracking-wider text-rose-500">Vencidos</span>
                  <div className="mt-1 space-y-0.5">
                    {dueItems.map((item) => (
                      <DueReminderItemRow
                        key={itemKey(item)}
                        item={item}
                        snoozingKey={snoozingId}
                        itemKey={itemKey(item)}
                        onComplete={handleComplete}
                        onSnooze={handleSnooze}
                        onSkip={handleSkip}
                        onOpenNote={handleOpenNote}
                        onToggleSnooze={() => setSnoozingId(snoozingId === itemKey(item) ? null : itemKey(item))}
                      />
                    ))}
                  </div>
                </div>
                <div className="h-2" />
              </>
            )}
          </div>

          {recentlyCompleted && (
            <div className="border-t border-slate-100 px-3 py-2">
              <button
                type="button"
                onClick={() => void handleUndoComplete()}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
              >
                <RotateCcw size={12} />
                Recordatorio completado · Deshacer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

type DueReminderItemRowProps = {
  item: DueReminderItem
  snoozingKey: string | null
  itemKey: string
  onComplete: (item: DueReminderItem) => void
  onSnooze: (item: DueReminderItem, minutes: number) => void
  onSkip: (item: DueReminderItem) => void
  onOpenNote: (item: DueReminderItem) => void
  onToggleSnooze: () => void
}

function DueReminderItemRow({ item, snoozingKey, itemKey, onComplete, onSnooze, onSkip, onOpenNote, onToggleSnooze }: DueReminderItemRowProps) {
  const { label } = formatRelativeTime(item.currentRemindAt)
  const isSnoozing = snoozingKey === itemKey

  return (
    <div className="group/item rounded-lg bg-rose-50/50 px-2 py-1.5 transition hover:bg-rose-50">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onOpenNote(item)}
            className="w-full text-left text-xs font-medium leading-5 text-slate-800 hover:text-blue-600"
          >
            {item.title}
          </button>
          {item.message && (
            <p className="mt-0.5 truncate text-[11px] text-slate-500">{item.message}</p>
          )}
          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-rose-500">
            <Clock size={10} />
            {label}
            {item.source === 'occurrence' && (
              <span className="ml-1 rounded bg-violet-100 px-1 text-[9px] font-semibold text-violet-600">repetición</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => onComplete(item)}
            className="rounded p-1 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
            aria-label="Marcar completado"
            title="Completado"
          >
            <Check size={14} />
          </button>

          {item.source === 'occurrence' && (
            <button
              type="button"
              onClick={() => onSkip(item)}
              className="rounded p-1 text-slate-400 transition hover:bg-amber-50 hover:text-amber-600"
              aria-label="Saltar"
              title="Saltar esta ocurrencia"
            >
              <SkipForward size={14} />
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={onToggleSnooze}
              className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Posponer"
              title="Posponer"
            >
              <ChevronDown size={14} />
            </button>
            {isSnoozing && (
              <div className="absolute right-0 top-full z-50 mt-0.5 w-28 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {snoozeOptions().map((option) => (
                  <button
                    key={option.minutes}
                    type="button"
                    onClick={() => onSnooze(item, option.minutes)}
                    className="w-full px-2.5 py-1 text-left text-[11px] text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
