import { apiRequest } from './client'
import type { Note, NoteFilters, NotePayload, NotesResponse } from '../types/note'

function buildNotesQuery(filters: NoteFilters) {
  const params = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  })

  if (filters.hideCompleted) params.set('hideCompleted', 'true')
  if (filters.search.trim()) params.set('search', filters.search.trim())
  if (filters.priority) params.set('priority', filters.priority)
  if (filters.groupId && filters.groupId > 0) params.set('groupId', String(filters.groupId))
  if (filters.tagId && filters.tagId > 0) params.set('tagId', String(filters.tagId))

  return params.toString()
}

export function getNotes(filters: NoteFilters) {
  return apiRequest<NotesResponse>(`/notes?${buildNotesQuery(filters)}`)
}

export function createNote(payload: NotePayload) {
  return apiRequest<{ note: Note }>('/notes', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateNote(id: number, payload: Partial<NotePayload>) {
  return apiRequest<{ note: Note }>(`/notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function completeNote(id: number) {
  return apiRequest<{ note: Note }>(`/notes/${id}/complete`, { method: 'PATCH' })
}

export function uncompleteNote(id: number) {
  return apiRequest<{ note: Note }>(`/notes/${id}/uncomplete`, { method: 'PATCH' })
}

export function deleteNote(id: number) {
  return apiRequest<void>(`/notes/${id}`, { method: 'DELETE' })
}
