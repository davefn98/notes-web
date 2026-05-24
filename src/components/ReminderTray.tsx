import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, BellRing, Check, ChevronDown, Clock, RotateCcw } from 'lucide-react'
import { useRemindersStore } from '../store/remindersStore'
import { useUiStore } from '../store/uiStore'
import type { Reminder } from '../types/reminder'

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
  const reminders = useRemindersStore((state) => state.reminders)
  const completeReminder = useRemindersStore((state) => state.completeReminder)
  const uncompleteReminder = useRemindersStore((state) => state.uncompleteReminder)
  const saveReminder = useRemindersStore((state) => state.saveReminder)
  const openEditor = useUiStore((state) => state.openEditor)
  const trayRef = useRef<HTMLDivElement>(null)
  const [snoozingId, setSnoozingId] = useState<number | null>(null)
  const [recentlyCompleted, setRecentlyCompleted] = useState<Reminder | null>(null)
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const overdue = useMemo(() => reminders.filter((r) => new Date(r.remindAt) <= new Date()), [reminders])
  const upcoming = useMemo(() => reminders.filter((r) => new Date(r.remindAt) > new Date()), [reminders])

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

  async function handleComplete(reminder: Reminder) {
    await completeReminder(reminder.id)
    setRecentlyCompleted(reminder)
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
    undoTimeoutRef.current = setTimeout(() => setRecentlyCompleted(null), 5000)
  }

  async function handleUndoComplete() {
    if (!recentlyCompleted) return
    await uncompleteReminder(recentlyCompleted.id)
    setRecentlyCompleted(null)
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
  }

  async function handleSnooze(reminder: Reminder, minutes: number) {
    const newDate = new Date()
    newDate.setMinutes(newDate.getMinutes() + minutes)
    await saveReminder(
      { remindAt: newDate.toISOString(), noteId: reminder.noteId, message: reminder.message ?? null },
      reminder.id,
    )
    setSnoozingId(null)
  }

  return (
    <div ref={trayRef} className="relative">
      <button
        type="button"
        onClick={handleBellClick}
        className="relative rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        aria-label="Recordatorios"
        title="Recordatorios"
      >
        {overdue.length > 0 ? <BellRing size={18} /> : <Bell size={18} />}
        {reminders.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white leading-none">
            {reminders.length > 99 ? '99+' : reminders.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 origin-top-right rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          <div className="border-b border-slate-100 px-3 py-2">
            <span className="text-xs font-semibold text-slate-800">Recordatorios</span>
          </div>

          <div className="max-h-80 overflow-y-auto overscroll-contain">
            {reminders.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <Bell size={24} className="text-slate-300" />
                <span className="text-xs text-slate-400">No tienes recordatorios pendientes.</span>
              </div>
            ) : (
              <>
                {overdue.length > 0 && (
                  <div className="px-2 pt-2">
                    <span className="px-1 text-[10px] font-semibold uppercase tracking-wider text-rose-500">Vencidos</span>
                    <div className="mt-1 space-y-0.5">
                      {overdue.map((reminder) => (
                        <ReminderItem
                          key={reminder.id}
                          reminder={reminder}
                          snoozingId={snoozingId}
                          onComplete={handleComplete}
                          onSnooze={handleSnooze}
                          onOpenNote={(r) => {
                            if (r.note) { openEditor(r.note); setOpen(false) }
                          }}
                          onToggleSnooze={() => setSnoozingId(snoozingId === reminder.id ? null : reminder.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {upcoming.length > 0 && (
                  <div className="px-2 pt-2">
                    <span className="px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Próximos</span>
                    <div className="mt-1 space-y-0.5">
                      {upcoming.map((reminder) => (
                        <ReminderItem
                          key={reminder.id}
                          reminder={reminder}
                          snoozingId={snoozingId}
                          onComplete={handleComplete}
                          onSnooze={handleSnooze}
                          onOpenNote={(r) => {
                            if (r.note) { openEditor(r.note); setOpen(false) }
                          }}
                          onToggleSnooze={() => setSnoozingId(snoozingId === reminder.id ? null : reminder.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="h-2" />
              </>
            )}
          </div>

          {recentlyCompleted && (
            <div className="border-t border-slate-100 px-3 py-2">
              <button
                type="button"
                onClick={handleUndoComplete}
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

type ReminderItemProps = {
  reminder: Reminder
  snoozingId: number | null
  onComplete: (reminder: Reminder) => void
  onSnooze: (reminder: Reminder, minutes: number) => void
  onOpenNote: (reminder: Reminder) => void
  onToggleSnooze: () => void
}

function ReminderItem({ reminder, snoozingId, onComplete, onSnooze, onOpenNote, onToggleSnooze }: ReminderItemProps) {
  const { label, overdue } = formatRelativeTime(reminder.remindAt)
  const isSnoozing = snoozingId === reminder.id

  return (
    <div className={`group/item rounded-lg px-2 py-1.5 transition ${overdue ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-slate-50'}`}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onOpenNote(reminder)}
            className="w-full text-left text-xs font-medium leading-5 text-slate-800 hover:text-blue-600"
          >
            {reminder.note?.title || `Nota #${reminder.noteId}`}
          </button>
          {reminder.message && (
            <p className="mt-0.5 truncate text-[11px] text-slate-500">{reminder.message}</p>
          )}
          <div className={`mt-0.5 flex items-center gap-1 text-[10px] ${overdue ? 'text-rose-500' : 'text-slate-400'}`}>
            <Clock size={10} />
            {label}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => onComplete(reminder)}
            className="rounded p-1 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
            aria-label="Marcar completado"
            title="Completado"
          >
            <Check size={14} />
          </button>

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
                    onClick={() => onSnooze(reminder, option.minutes)}
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