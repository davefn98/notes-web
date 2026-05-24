import { useEffect, useRef } from 'react'
import { Moon, Sun } from 'lucide-react'
import { InstallPrompt } from './InstallPrompt'
import { ReminderTray } from './ReminderTray'
import { Sidebar } from './Sidebar'
import { PrivacyText } from './PrivacyText'
import { useAuthStore } from '../store/authStore'
import { useNotesStore } from '../store/notesStore'
import { useRemindersStore } from '../store/remindersStore'
import { useTagsStore } from '../store/tagsStore'
import { useUiStore } from '../store/uiStore'

type AppLayoutProps = {
  children: React.ReactNode
}

function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)
  const theme = useUiStore((state) => state.theme)
  const privacyMode = useUiStore((state) => state.privacyMode)
  const toggleTheme = useUiStore((state) => state.toggleTheme)

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          aria-label="Alternar menú"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-sm font-bold text-slate-800">Notas</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <ReminderTray />
        <span
          className={`mx-1.5 h-2 w-2 rounded-full transition ${privacyMode ? 'bg-amber-400' : 'bg-slate-300'}`}
          title={privacyMode ? 'Modo privacidad activo (Ctrl+Shift+P)' : 'Ctrl+Shift+P para activar privacidad'}
        />
        <span className="hidden text-sm text-slate-600 sm:inline">
          <PrivacyText fallback="••••••">{user?.name ?? user?.username ?? 'Usuario'}</PrivacyText>
        </span>
        <button
          type="button"
          onClick={logout}
          className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          Salir
        </button>
      </div>
    </header>
  )
}

export function AppLayout({ children }: AppLayoutProps) {
  const groups = useNotesStore((state) => state.groups)
  const filters = useNotesStore((state) => state.filters)
  const setFilters = useNotesStore((state) => state.setFilters)
  const ungroupedNotesCount = useNotesStore((state) => state.ungroupedNotesCount)
  const sidebarOpen = useUiStore((state) => state.sidebarOpen)
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed)
  const sidebarWidth = useUiStore((state) => state.sidebarWidth)
  const theme = useUiStore((state) => state.theme)
  const privacyMode = useUiStore((state) => state.privacyMode)
  const openSidebar = useUiStore((state) => state.openSidebar)
  const closeSidebar = useUiStore((state) => state.closeSidebar)
  const toggleSidebarCollapsed = useUiStore((state) => state.toggleSidebarCollapsed)
  const setSidebarWidth = useUiStore((state) => state.setSidebarWidth)
  const togglePrivacyMode = useUiStore((state) => state.togglePrivacyMode)
  const loadReminders = useRemindersStore((state) => state.loadReminders)
  const reminders = useRemindersStore((state) => state.reminders)
  const loadTags = useTagsStore((state) => state.loadTags)
  const notifiedIds = useRef(new Set<number>())

  useEffect(() => {
    void loadReminders()
    void loadTags()
    const interval = window.setInterval(() => void loadReminders(), 30000)
    return () => window.clearInterval(interval)
  }, [loadReminders, loadTags])

  useEffect(() => {
    const newOverdue = reminders.filter(
      (r) => !notifiedIds.current.has(r.id) && new Date(r.remindAt) <= new Date(),
    )
    for (const reminder of newOverdue) {
      notifiedIds.current.add(reminder.id)
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const title = reminder.note?.title || 'Recordatorio'
        const body = reminder.message || `Nota #${reminder.noteId}`
        const n = new Notification(title, { body, icon: '/pwa-icon.svg' })
        n.onclick = () => { window.focus(); n.close() }
      }
    }
  }, [reminders])

  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  function handleResizeStart(e: React.MouseEvent) {
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startWidth: sidebarWidth }
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'

    function onMove(ev: MouseEvent) {
      if (!dragRef.current) return
      const next = Math.max(180, Math.min(400, dragRef.current.startWidth + ev.clientX - dragRef.current.startX))
      setSidebarWidth(next)
    }

    function onEnd() {
      dragRef.current = null
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onEnd)
      cleanupRef.current = null
    }

    cleanupRef.current = onEnd
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onEnd)
  }

  useEffect(() => {
    return () => {
      cleanupRef.current?.()
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('privacy-mode', privacyMode)
  }, [privacyMode])

  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', theme === 'dark')
    document.documentElement.classList.toggle('theme-light', theme === 'light')
  }, [theme])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        togglePrivacyMode()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePrivacyMode])

  function selectGroup(groupId: number | null) {
    setFilters({ groupId, tagId: null, page: 1 })
    closeSidebar()
  }

  function selectTag(tagId: number | null) {
    setFilters({ tagId, groupId: null, page: 1 })
    closeSidebar()
  }

  const sidebarProps = {
    groups,
    selectedGroupId: filters.groupId,
    ungroupedNotesCount,
    collapsed: sidebarCollapsed,
    onSelectGroup: selectGroup,
    selectedTagId: filters.tagId,
    onSelectTag: selectTag,
  }

  const desktopSidebarWidth = sidebarCollapsed ? 72 : sidebarWidth

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Mobile overlay sidebar */}
      <div className={`fixed inset-0 z-30 transition lg:hidden ${sidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
        <button
          type="button"
          aria-label="Cerrar menú"
          className="absolute inset-0 bg-slate-950/40 transition-opacity"
          onClick={closeSidebar}
        />
        <div className={`relative h-full w-72 max-w-[86vw] transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar {...sidebarProps} collapsed={false} />
        </div>
      </div>

      {/* Desktop: 3-column grid [sidebar | handle | main] */}
      <div
        className="hidden h-full transition-[grid-template-columns] duration-200 lg:grid"
        style={{ gridTemplateColumns: `${desktopSidebarWidth}px ${sidebarCollapsed ? 0 : 4}px 1fr` }}
      >
        <div className="h-full overflow-hidden">
          <Sidebar {...sidebarProps} />
        </div>

        {/* Drag resize handle */}
        <div
          className={`transition-colors ${sidebarCollapsed ? 'pointer-events-none opacity-0' : 'cursor-col-resize'} ${theme === 'dark' ? 'bg-slate-800 hover:bg-blue-500/40' : 'bg-slate-200 hover:bg-blue-400'}`}
          onMouseDown={sidebarCollapsed ? undefined : handleResizeStart}
        />

        {/* Main content */}
        <div className="flex h-full min-w-0 flex-col">
          <Topbar onMenuClick={toggleSidebarCollapsed} />
          <div className="shrink-0 px-3 py-1.5">
            <InstallPrompt />
          </div>
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile: full-width layout */}
      <div className="flex h-full flex-col lg:hidden">
        <Topbar onMenuClick={openSidebar} />
        <div className="shrink-0 px-3 py-1.5">
          <InstallPrompt />
        </div>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}
