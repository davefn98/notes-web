import { create } from 'zustand'
import type { Note } from '../types/note'

type UiState = {
  theme: 'light' | 'dark'
  privacyMode: boolean
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  sidebarWidth: number
  editorOpen: boolean
  editingNote: Note | null
  installPrompt: BeforeInstallPromptEvent | null
  toggleTheme: () => void
  togglePrivacyMode: () => void
  openSidebar: () => void
  closeSidebar: () => void
  toggleSidebarCollapsed: () => void
  setSidebarWidth: (width: number) => void
  openEditor: (note?: Note | null) => void
  closeEditor: () => void
  setInstallPrompt: (prompt: BeforeInstallPromptEvent | null) => void
}

export const useUiStore = create<UiState>((set) => ({
  theme: localStorage.getItem('theme') === 'dark' ? 'dark' : 'light',
  privacyMode: localStorage.getItem('privacy-mode') === 'true',
  sidebarOpen: false,
  sidebarCollapsed: localStorage.getItem('sidebar-collapsed') === 'true',
  sidebarWidth: Number(localStorage.getItem('sidebar-width')) || 240,
  editorOpen: false,
  editingNote: null,
  installPrompt: null,
  toggleTheme: () => set((state) => {
    const next = state.theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', next)
    return { theme: next }
  }),
  togglePrivacyMode: () => set((state) => {
    const next = !state.privacyMode
    localStorage.setItem('privacy-mode', String(next))
    return { privacyMode: next }
  }),
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  toggleSidebarCollapsed: () => set((state) => {
    const next = !state.sidebarCollapsed
    localStorage.setItem('sidebar-collapsed', String(next))
    return { sidebarCollapsed: next }
  }),
  setSidebarWidth: (width) => {
    localStorage.setItem('sidebar-width', String(width))
    set({ sidebarWidth: width })
  },
  openEditor: (note = null) => set({ editorOpen: true, editingNote: note }),
  closeEditor: () => set({ editorOpen: false, editingNote: null }),
  setInstallPrompt: (prompt) => set({ installPrompt: prompt }),
}))
