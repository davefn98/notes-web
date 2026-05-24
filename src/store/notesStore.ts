import { create } from 'zustand'
import {
  completeNote,
  createNote,
  deleteNote,
  getNotes,
  uncompleteNote,
  updateNote,
} from '../api/notes'
import {
  createGroup as createGroupApi,
  deleteGroup as deleteGroupApi,
  getGroupsTree,
  updateGroup as updateGroupApi,
} from '../api/groups'
import type { Group, GroupPayload } from '../types/group'
import type { Note, NoteFilters, NotePayload } from '../types/note'
import type { Pagination } from '../types/api'

const defaultFilters: NoteFilters = {
  hideCompleted: false,
  search: '',
  priority: '',
  groupId: null,
  tagId: null,
  page: 1,
  limit: 20,
  sortBy: 'dueAt',
  sortOrder: 'asc',
}

type NotesState = {
  notes: Note[]
  groups: Group[]
  ungroupedNotes: Note[]
  ungroupedNotesCount: number
  pagination: Pagination | null
  filters: NoteFilters
  loading: boolean
  groupsLoading: boolean
  error: string | null
  loadGroups: () => Promise<void>
  loadNotes: () => Promise<void>
  setFilters: (filters: Partial<NoteFilters>) => void
  saveNote: (payload: NotePayload, id?: number) => Promise<void>
  toggleComplete: (note: Note) => Promise<void>
  removeNote: (id: number) => Promise<void>
  createGroup: (payload: GroupPayload) => Promise<void>
  updateGroup: (id: number, payload: Partial<GroupPayload>) => Promise<void>
  deleteGroup: (id: number) => Promise<void>
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  groups: [],
  ungroupedNotes: [],
  ungroupedNotesCount: 0,
  pagination: null,
  filters: defaultFilters,
  loading: false,
  groupsLoading: false,
  error: null,
  loadGroups: async () => {
    set({ groupsLoading: true })
    try {
      const data = await getGroupsTree()
      set({ groups: data.groups, ungroupedNotes: data.ungroupedNotes, ungroupedNotesCount: data.ungroupedNotes.length, groupsLoading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'No se pudieron cargar los grupos', groupsLoading: false })
    }
  },
  loadNotes: async () => {
    set({ loading: true, error: null })
    try {
      const data = await getNotes(get().filters)
      set({ notes: data.notes, pagination: data.pagination, loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'No se pudieron cargar las notas', loading: false })
    }
  },
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  saveNote: async (payload, id) => {
    if (id) await updateNote(id, payload)
    else await createNote(payload)
    await get().loadNotes()
    await get().loadGroups()
  },
  toggleComplete: async (note) => {
    if (note.completedAt) await uncompleteNote(note.id)
    else await completeNote(note.id)
    await get().loadNotes()
    await get().loadGroups()
  },
  removeNote: async (id) => {
    await deleteNote(id)
    await get().loadNotes()
    await get().loadGroups()
  },
  createGroup: async (payload) => {
    await createGroupApi(payload)
    await get().loadGroups()
  },
  updateGroup: async (id, payload) => {
    await updateGroupApi(id, payload)
    await get().loadGroups()
  },
  deleteGroup: async (id) => {
    await deleteGroupApi(id)
    if (get().filters.groupId === id) {
      set((state) => ({ filters: { ...state.filters, groupId: null, page: 1 } }))
    }
    await get().loadGroups()
    await get().loadNotes()
  },
}))
