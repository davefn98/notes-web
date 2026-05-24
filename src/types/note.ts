import type { Pagination } from './api'

export type NotePriority = 'low' | 'medium' | 'high' | 'urgent'
export type NoteRecurrence = 'daily' | 'weekdays' | 'weekly' | 'monthly'

export type Tag = {
  id: number
  name: string
  color?: string | null
}

export type Note = {
  id: number
  title: string
  content: string
  priority: NotePriority
  dueAt?: string | null
  completedAt?: string | null
  recurrence?: NoteRecurrence | null
  recurrenceEndAt?: string | null
  groupId?: number | null
  userId: number
  createdAt: string
  updatedAt: string
  tags?: Tag[]
}

export type NoteSortBy = 'dueAt' | 'createdAt' | 'updatedAt' | 'priority' | 'title'
export type NoteSortOrder = 'asc' | 'desc'

export type NoteFilters = {
  hideCompleted: boolean
  search: string
  priority: NotePriority | ''
  groupId: number | null
  tagId: number | null
  page: number
  limit: number
  sortBy: NoteSortBy
  sortOrder: NoteSortOrder
}

export type NotesResponse = {
  notes: Note[]
  pagination: Pagination
}

export type NotePayload = {
  title: string
  content: string
  priority: NotePriority
  dueAt?: string | null
  recurrence?: NoteRecurrence | null
  recurrenceEndAt?: string | null
  groupId?: number | null
  tagIds?: number[]
}
