import type { Note } from './note'

export type Group = {
  id: number
  name: string
  color?: string | null
  parentId?: number | null
  notes?: Note[]
  children: Group[]
}

export type GroupsTreeResponse = {
  groups: Group[]
  ungroupedNotes: Note[]
}

export type GroupPayload = {
  name: string
  color?: string | null
  parentId?: number | null
}
