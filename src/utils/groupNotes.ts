import type { Pagination } from '../types/api'
import type { Group } from '../types/group'
import type { Note, NoteFilters, NotePriority } from '../types/note'

const priorityRank: Record<NotePriority, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
}

export function getDescendantGroupIds(group: Group): number[] {
  return [group.id, ...group.children.flatMap(getDescendantGroupIds)]
}

function findGroup(groups: Group[], groupId: number): Group | null {
  for (const group of groups) {
    if (group.id === groupId) return group
    const child = findGroup(group.children, groupId)
    if (child) return child
  }

  return null
}

function collectGroupNotes(group: Group, notesById = new Map<number, Note>()) {
  group.notes?.forEach((note) => notesById.set(note.id, note))
  group.children.forEach((child) => collectGroupNotes(child, notesById))
  return [...notesById.values()]
}

function getComparableValue(note: Note, sortBy: NoteFilters['sortBy']) {
  if (sortBy === 'priority') return priorityRank[note.priority]
  if (sortBy === 'dueAt' || sortBy === 'createdAt' || sortBy === 'updatedAt') {
    return note[sortBy] ? new Date(note[sortBy] as string).getTime() : Number.POSITIVE_INFINITY
  }

  return note.title.toLocaleLowerCase('es')
}

function sortNotes(notes: Note[], filters: NoteFilters) {
  const direction = filters.sortOrder === 'asc' ? 1 : -1

  return [...notes].sort((a, b) => {
    const first = getComparableValue(a, filters.sortBy)
    const second = getComparableValue(b, filters.sortBy)

    if (first < second) return -1 * direction
    if (first > second) return 1 * direction

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })
}

function filterNotes(notes: Note[], filters: NoteFilters) {
  const search = filters.search.trim().toLocaleLowerCase('es')

  return notes.filter((note) => {
    if (filters.hideCompleted && note.completedAt) return false
    if (filters.priority && note.priority !== filters.priority) return false
    if (search && !`${note.title} ${note.content}`.toLocaleLowerCase('es').includes(search)) return false
    return true
  })
}

function paginate(notes: Note[], filters: NoteFilters): { notes: Note[]; pagination: Pagination } {
  const total = notes.length
  const totalPages = Math.ceil(total / filters.limit)
  const start = (filters.page - 1) * filters.limit

  return {
    notes: notes.slice(start, start + filters.limit),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages,
      hasNextPage: filters.page * filters.limit < total,
      hasPreviousPage: filters.page > 1,
    },
  }
}

export function getVisibleNotesForGroup(groups: Group[], filters: NoteFilters, ungroupedNotes: Note[] = []) {
  if (!filters.groupId) return null

  if (filters.groupId === -1) {
    return paginate(sortNotes(filterNotes([...ungroupedNotes], filters), filters), filters)
  }

  const group = findGroup(groups, filters.groupId)
  if (!group) return null

  const notes = sortNotes(filterNotes(collectGroupNotes(group), filters), filters)
  return paginate(notes, filters)
}
