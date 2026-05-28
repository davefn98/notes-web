import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bell, BellRing, CalendarPlus, Check, Clock, MoreHorizontal, RotateCcw, SkipForward } from 'lucide-react'
import type { RefObject } from 'react'
import { useNotesStore } from '../store/notesStore'
import { useRemindersStore } from '../store/remindersStore'
import { useUiStore } from '../store/uiStore'
import type { DueReminderItem } from '../types/reminder'

type Theme = 'light' | 'dark'
type SnoozeAnchor = {
  key: string
  item: DueReminderItem
  position: { top: number; left: number; origin: 'top' | 'bottom' }
}

function reminderTrayStyles(theme: Theme) {
  const dark = theme === 'dark'

  return {
    trigger: dark
      ? 'relative rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100'
      : 'relative rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800',
    panel: dark
      ? 'absolute right-3 top-full z-50 mt-2 w-[21rem] max-w-[calc(100vw-24px)] origin-top-right overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.18)] bg-slate-900 shadow-2xl shadow-black/35 sm:right-0'
      : 'absolute right-3 top-full z-50 mt-2 w-[21rem] max-w-[calc(100vw-24px)] origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 sm:right-0',
    header: dark ? 'border-b border-slate-700/60 px-4 py-3' : 'border-b border-slate-100 px-4 py-3',
    title: dark ? 'text-sm font-semibold text-slate-100' : 'text-sm font-semibold text-slate-800',
    sectionLabel: dark
      ? 'px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-300'
      : 'px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-500',
    scroll: 'max-h-96 overflow-y-auto overscroll-contain p-2',
    emptyIcon: dark ? 'text-slate-600' : 'text-slate-300',
    emptyText: dark ? 'text-xs text-slate-500' : 'text-xs text-slate-400',
    undoWrap: dark ? 'border-t border-slate-700/60 px-3 py-2' : 'border-t border-slate-100 px-3 py-2',
    undoButton: dark
      ? 'flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-400 transition hover:bg-slate-800 hover:text-slate-100'
      : 'flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-700',
    feedback: dark
      ? 'border-t border-slate-700/60 px-3 py-2 text-xs font-semibold text-blue-200'
      : 'border-t border-slate-100 px-3 py-2 text-xs font-semibold text-blue-700',
  }
}

function reminderItemStyles(theme: Theme, overdue: boolean, selected: boolean) {
  const dark = theme === 'dark'

  return {
    card: dark
      ? `group/item rounded-2xl border border-l-4 px-3.5 py-3 transition ${selected ? 'border-slate-500/50 bg-slate-800/95 shadow-lg shadow-black/20' : 'border-[rgba(148,163,184,0.14)] bg-[#0f172a] hover:border-slate-500/30 hover:bg-[#172033]'} ${overdue ? 'border-l-rose-400/80' : 'border-l-blue-400/70'}`
      : `group/item rounded-2xl border border-l-4 px-3.5 py-3 transition ${selected ? 'border-slate-300 bg-slate-50 shadow-sm' : 'border-rose-100 bg-rose-50/45 hover:bg-rose-50'} ${overdue ? 'border-l-rose-400' : 'border-l-blue-300'}`,
    title: dark
      ? 'w-full truncate text-left text-[13px] font-semibold leading-5 text-slate-100 transition hover:text-blue-300'
      : 'w-full truncate text-left text-xs font-semibold leading-5 text-slate-800 transition hover:text-blue-600',
    message: dark ? 'mt-0.5 truncate text-[11px] text-slate-400' : 'mt-0.5 truncate text-[11px] text-slate-500',
    meta: dark
      ? `${overdue ? 'text-rose-200' : 'text-blue-300'} mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold`
      : `${overdue ? 'text-rose-500' : 'text-blue-500'} mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-medium`,
    badge: dark
      ? 'rounded-full border border-violet-300/20 bg-violet-400/10 px-2 py-0.5 text-[9px] font-bold leading-none tracking-wide text-violet-200'
      : 'rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold leading-none text-violet-700',
    completeButton: dark
      ? 'rounded-xl p-1.5 text-slate-400 transition hover:bg-emerald-500/12 hover:text-emerald-300'
      : 'rounded-lg p-1.5 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600',
    skipButton: dark
      ? 'rounded-xl p-1.5 text-slate-400 transition hover:bg-amber-500/12 hover:text-amber-300'
      : 'rounded-lg p-1.5 text-slate-400 transition hover:bg-amber-50 hover:text-amber-600',
    snoozeButton: dark
      ? `rounded-xl p-1.5 transition ${selected ? 'bg-blue-500/15 text-blue-200 ring-1 ring-blue-300/20' : 'text-slate-400 hover:bg-slate-700/70 hover:text-slate-100'}`
      : `rounded-lg p-1.5 transition ${selected ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`,
  }
}

function snoozeMenuStyles(theme: Theme, origin: 'top' | 'bottom') {
  const dark = theme === 'dark'

  return {
    shell: dark
      ? `fixed z-[9999] w-56 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/50 backdrop-blur-xl animate-[snooze-pop_170ms_ease-out] ${origin === 'top' ? 'origin-top' : 'origin-bottom'}`
      : `fixed z-[9999] w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl shadow-slate-900/15 backdrop-blur-xl animate-[snooze-pop_170ms_ease-out] ${origin === 'top' ? 'origin-top' : 'origin-bottom'}`,
    header: dark ? 'px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400' : 'px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500',
    divider: dark ? 'h-px bg-white/[0.07]' : 'h-px bg-slate-100',
    list: 'p-1.5',
    item: dark
      ? 'group flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2 text-left text-xs font-semibold text-slate-200 transition hover:bg-blue-500/12 hover:text-white focus:bg-blue-500/12 focus:text-white focus:outline-none'
      : 'group flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 focus:outline-none',
    hint: dark ? 'text-[10px] font-medium text-slate-500 group-hover:text-blue-200' : 'text-[10px] font-medium text-slate-400 group-hover:text-blue-500',
    icon: dark ? 'text-slate-500 transition group-hover:text-blue-200' : 'text-slate-400 transition group-hover:text-blue-500',
    secondaryWrap: dark ? 'border-t border-white/[0.07] p-1.5' : 'border-t border-slate-100 p-1.5',
    secondaryItem: dark
      ? 'group flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-left text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white focus:bg-slate-800 focus:text-white focus:outline-none'
      : 'group flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-left text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus:bg-slate-50 focus:text-slate-900 focus:outline-none',
  }
}

function customSnoozeStyles(theme: Theme) {
  const dark = theme === 'dark'

  return {
    backdrop: 'fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm animate-[snooze-fade_160ms_ease-out]',
    shell: dark
      ? 'w-full max-w-sm rounded-3xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl shadow-black/50 animate-[snooze-pop_180ms_ease-out]'
      : 'w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/20 animate-[snooze-pop_180ms_ease-out]',
    iconWrap: dark ? 'flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/12 text-blue-200 ring-1 ring-blue-300/15' : 'flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100',
    title: dark ? 'text-sm font-bold text-slate-100' : 'text-sm font-bold text-slate-900',
    hint: dark ? 'mt-1 text-xs leading-5 text-slate-400' : 'mt-1 text-xs leading-5 text-slate-500',
    label: dark ? 'mt-4 grid gap-2 text-xs font-semibold text-slate-400' : 'mt-4 grid gap-2 text-xs font-semibold text-slate-500',
    input: dark
      ? 'w-full rounded-2xl border-0 bg-slate-900 px-3.5 py-3 text-sm font-medium text-slate-100 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400/40'
      : 'w-full rounded-2xl border-0 bg-slate-50 px-3.5 py-3 text-sm font-medium text-slate-800 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-300',
    actions: 'mt-4 flex justify-end gap-2',
    cancel: dark ? 'rounded-xl px-4 py-2 text-xs font-bold text-slate-400 transition hover:bg-white/5 hover:text-slate-100' : 'rounded-xl px-4 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900',
    confirm: 'rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-45',
  }
}

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
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0)
  return Math.max(1, Math.ceil((tomorrow.getTime() - now.getTime()) / 60000))
}

function getMinutesUntilAfternoon(): number {
  const now = new Date()
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0)
  if (target <= now) target.setDate(target.getDate() + 1)
  return Math.max(1, Math.ceil((target.getTime() - now.getTime()) / 60000))
}

function formatSnoozeFeedback(label: string) {
  if (label === 'Mañana') return 'Reaparecerá mañana a las 09:00'
  if (label === 'Esta tarde') return 'Reaparecerá esta tarde a las 18:00'
  return `Pospuesto ${label}`
}

function getSnoozePosition(anchor: HTMLElement) {
  const rect = anchor.getBoundingClientRect()
  const width = 224
  const height = 270
  const gap = 10
  const margin = 12
  const spaceBelow = window.innerHeight - rect.bottom
  const openBelow = spaceBelow >= height + gap || rect.top < height + gap
  const top = openBelow ? rect.bottom + gap : rect.top - height - gap
  const left = Math.min(Math.max(rect.right - width, margin), window.innerWidth - width - margin)

  return {
    top: Math.min(Math.max(top, margin), window.innerHeight - height - margin),
    left,
    origin: openBelow ? 'top' as const : 'bottom' as const,
  }
}

function snoozeOptions() {
  return [
    { label: '10 min', minutes: 10, hint: 'rápido' },
    { label: '30 min', minutes: 30, hint: 'pausa corta' },
    { label: '1 hora', minutes: 60, hint: 'más tarde' },
    { label: 'Esta tarde', minutes: getMinutesUntilAfternoon(), hint: '18:00' },
    { label: 'Mañana', minutes: getMinutesUntilTomorrow(), hint: '09:00' },
  ]
}

export function ReminderTray() {
  const [open, setOpen] = useState(false)
  const theme = useUiStore((state) => state.theme)
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
  const snoozeMenuRef = useRef<HTMLDivElement>(null)
  const [snoozeAnchor, setSnoozeAnchor] = useState<SnoozeAnchor | null>(null)
  const [customSnoozeItem, setCustomSnoozeItem] = useState<DueReminderItem | null>(null)
  const [customSnoozeAt, setCustomSnoozeAt] = useState('')
  const [customSnoozeIsFuture, setCustomSnoozeIsFuture] = useState(false)
  const [snoozeFeedback, setSnoozeFeedback] = useState<string | null>(null)
  const [recentlyCompleted, setRecentlyCompleted] = useState<DueReminderItem | null>(null)
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (snoozeMenuRef.current?.contains(target)) return
      if (trayRef.current && !trayRef.current.contains(target)) {
        setOpen(false)
        setSnoozeAnchor(null)
        setCustomSnoozeItem(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    if (!snoozeAnchor) return

    function closeMenu() {
      setSnoozeAnchor(null)
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (snoozeMenuRef.current?.contains(target)) return
      if (trayRef.current?.contains(target)) return
      closeMenu()
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeMenu()
    }

    window.addEventListener('resize', closeMenu)
    window.addEventListener('scroll', closeMenu, true)
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('resize', closeMenu)
      window.removeEventListener('scroll', closeMenu, true)
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [snoozeAnchor])

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
    setSnoozeAnchor(null)
    setCustomSnoozeAt('')
    setCustomSnoozeIsFuture(false)
    if (item.source === 'reminder') {
      await snoozeReminder(item.id, minutes)
    } else {
      await snoozeOccurrence(item.id, minutes)
    }
  }

  async function handleSnoozeOption(item: DueReminderItem, minutes: number, label: string) {
    setSnoozeFeedback(formatSnoozeFeedback(label))
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
    feedbackTimeoutRef.current = setTimeout(() => setSnoozeFeedback(null), 3500)
    await handleSnooze(item, minutes)
  }

  async function handleCustomSnooze(item: DueReminderItem) {
    if (!customSnoozeAt) return
    const target = new Date(customSnoozeAt)
    const minutes = Math.ceil((target.getTime() - Date.now()) / 60000)
    if (!Number.isFinite(minutes) || minutes <= 0) return

    setSnoozeFeedback(`Reaparecerá ${new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' }).format(target)}`)
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
    feedbackTimeoutRef.current = setTimeout(() => setSnoozeFeedback(null), 3500)
    setCustomSnoozeItem(null)
    await handleSnooze(item, minutes)
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

  function handleToggleSnooze(item: DueReminderItem, anchor: HTMLElement) {
    const key = itemKey(item)
    if (snoozeAnchor?.key === key) {
      setSnoozeAnchor(null)
      return
    }

    setCustomSnoozeAt('')
    setCustomSnoozeIsFuture(false)
    setSnoozeAnchor({ key, item, position: getSnoozePosition(anchor) })
  }

  function handleCustomSnoozeAtChange(value: string) {
    setCustomSnoozeAt(value)
    setCustomSnoozeIsFuture(value ? new Date(value).getTime() > Date.now() : false)
  }

  function handleChooseCustomSnooze(item: DueReminderItem) {
    setSnoozeAnchor(null)
    setCustomSnoozeAt('')
    setCustomSnoozeIsFuture(false)
    setCustomSnoozeItem(item)
  }

  function handleCloseCustomSnooze() {
    setCustomSnoozeItem(null)
    setCustomSnoozeAt('')
    setCustomSnoozeIsFuture(false)
  }

  const itemKey = (item: DueReminderItem) => `${item.source}:${item.id}`
  const styles = reminderTrayStyles(theme)

  return (
    <div ref={trayRef} className="relative">
      <button
        type="button"
        onClick={handleBellClick}
        className={styles.trigger}
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
        <div className={styles.panel}>
          <div className={styles.header}>
            <span className={styles.title}>Recordatorios vencidos</span>
          </div>

          <div className={styles.scroll}>
            {dueItems.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <Bell size={24} className={styles.emptyIcon} />
                <span className={styles.emptyText}>No tienes recordatorios vencidos.</span>
              </div>
            ) : (
              <>
                <div>
                  <span className={styles.sectionLabel}>Vencidos</span>
                  <div className="mt-2 space-y-1.5">
                    {dueItems.map((item) => (
                      <DueReminderItemRow
                        key={itemKey(item)}
                        item={item}
                        snoozingKey={snoozeAnchor?.key ?? null}
                        itemKey={itemKey(item)}
                        theme={theme}
                        onComplete={handleComplete}
                        onSkip={handleSkip}
                        onOpenNote={handleOpenNote}
                        onToggleSnooze={handleToggleSnooze}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {recentlyCompleted && (
            <div className={styles.undoWrap}>
              <button
                type="button"
                onClick={() => void handleUndoComplete()}
                className={styles.undoButton}
              >
                <RotateCcw size={12} />
                Recordatorio completado · Deshacer
              </button>
            </div>
          )}

          {snoozeFeedback && (
            <div className={styles.feedback}>{snoozeFeedback}</div>
          )}
        </div>
      )}

      {snoozeAnchor && createPortal(
        <SnoozeMenu
          menuRef={snoozeMenuRef}
          theme={theme}
          anchor={snoozeAnchor}
          onSnooze={handleSnoozeOption}
          onChooseCustom={handleChooseCustomSnooze}
        />,
        document.body,
      )}

      {customSnoozeItem && createPortal(
        <CustomSnoozeDialog
          theme={theme}
          item={customSnoozeItem}
          customSnoozeAt={customSnoozeAt}
          customSnoozeIsFuture={customSnoozeIsFuture}
          onCustomSnoozeAtChange={handleCustomSnoozeAtChange}
          onClose={handleCloseCustomSnooze}
          onConfirm={handleCustomSnooze}
        />,
        document.body,
      )}
    </div>
  )
}

type DueReminderItemRowProps = {
  item: DueReminderItem
  snoozingKey: string | null
  itemKey: string
  theme: Theme
  onComplete: (item: DueReminderItem) => void
  onSkip: (item: DueReminderItem) => void
  onOpenNote: (item: DueReminderItem) => void
  onToggleSnooze: (item: DueReminderItem, anchor: HTMLElement) => void
}

function DueReminderItemRow({ item, snoozingKey, itemKey, theme, onComplete, onSkip, onOpenNote, onToggleSnooze }: DueReminderItemRowProps) {
  const { label, overdue } = formatRelativeTime(item.currentRemindAt)
  const isSnoozing = snoozingKey === itemKey
  const styles = reminderItemStyles(theme, overdue, isSnoozing)

  return (
    <div className={styles.card}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onOpenNote(item)}
            className={styles.title}
          >
            {item.title}
          </button>
          {item.message && (
            <p className={styles.message}>{item.message}</p>
          )}
          <div className={styles.meta}>
            <Clock size={11} className="shrink-0" />
            {label}
            {item.source === 'occurrence' && (
              <span className={styles.badge}>repetición</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onComplete(item)}
            className={styles.completeButton}
            aria-label="Marcar completado"
            title="Completado"
          >
            <Check size={14} />
          </button>

          {item.source === 'occurrence' && (
            <button
              type="button"
              onClick={() => onSkip(item)}
              className={styles.skipButton}
              aria-label="Saltar"
              title="Saltar esta ocurrencia"
            >
              <SkipForward size={14} />
            </button>
          )}

          <div>
            <button
              type="button"
              onClick={(event) => onToggleSnooze(item, event.currentTarget)}
              className={styles.snoozeButton}
              aria-label="Posponer"
              title="Posponer"
            >
              <MoreHorizontal size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

type SnoozeMenuProps = {
  menuRef: RefObject<HTMLDivElement | null>
  theme: Theme
  anchor: SnoozeAnchor
  onSnooze: (item: DueReminderItem, minutes: number, label: string) => void
  onChooseCustom: (item: DueReminderItem) => void
}

function SnoozeMenu({ menuRef, theme, anchor, onSnooze, onChooseCustom }: SnoozeMenuProps) {
  const styles = snoozeMenuStyles(theme, anchor.position.origin)

  return (
    <>
      <style>{'@keyframes snooze-pop{from{opacity:0;transform:translateY(6px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}'}</style>
      <div
        ref={menuRef}
        className={styles.shell}
        style={{ top: anchor.position.top, left: anchor.position.left }}
      >
        <div className={styles.header}>Posponer</div>
        <div className={styles.divider} />
        <div className={styles.list}>
          {snoozeOptions().map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => onSnooze(anchor.item, option.minutes, option.label)}
              className={styles.item}
            >
              <span className="flex items-center gap-2">
                <Clock size={12} className={styles.icon} />
                {option.label}
              </span>
              <span className={styles.hint}>{option.hint}</span>
            </button>
          ))}
        </div>
        <div className={styles.secondaryWrap}>
          <button
            type="button"
            onClick={() => onChooseCustom(anchor.item)}
            className={styles.secondaryItem}
          >
            <CalendarPlus size={13} className={styles.icon} />
            Elegir fecha...
          </button>
        </div>
      </div>
    </>
  )
}

type CustomSnoozeDialogProps = {
  theme: Theme
  item: DueReminderItem
  customSnoozeAt: string
  customSnoozeIsFuture: boolean
  onCustomSnoozeAtChange: (value: string) => void
  onClose: () => void
  onConfirm: (item: DueReminderItem) => void
}

function CustomSnoozeDialog({ theme, item, customSnoozeAt, customSnoozeIsFuture, onCustomSnoozeAtChange, onClose, onConfirm }: CustomSnoozeDialogProps) {
  const styles = customSnoozeStyles(theme)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <>
      <style>{'@keyframes snooze-fade{from{opacity:0}to{opacity:1}}@keyframes snooze-pop{from{opacity:0;transform:translateY(6px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}'}</style>
      <div className={styles.backdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
        <div className={styles.shell} role="dialog" aria-modal="true" aria-label="Elegir fecha para posponer">
          <div className="flex items-start gap-3">
            <div className={styles.iconWrap}>
              <CalendarPlus size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className={styles.title}>Elegir fecha</div>
              <p className={styles.hint}>Define cuándo debe reaparecer “{item.title}”.</p>
            </div>
          </div>

          <label className={styles.label}>
            <span>Reaparecerá en</span>
            <input
              type="datetime-local"
              value={customSnoozeAt}
              onChange={(event) => onCustomSnoozeAtChange(event.target.value)}
              className={styles.input}
              autoFocus
            />
          </label>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancel}>Cancelar</button>
            <button
              type="button"
              disabled={!customSnoozeIsFuture}
              onClick={() => onConfirm(item)}
              className={styles.confirm}
            >
              Posponer
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
