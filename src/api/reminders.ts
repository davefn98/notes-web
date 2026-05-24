import { apiRequest } from './client'
import type { Reminder, ReminderPayload, ReminderUpdatePayload, RemindersResponse } from '../types/reminder'

export function getReminders(filters: { completed?: boolean; upcoming?: boolean; noteId?: number } = {}) {
  const params = new URLSearchParams()

  if (filters.completed !== undefined) params.set('completed', String(filters.completed))
  if (filters.upcoming !== undefined) params.set('upcoming', String(filters.upcoming))
  if (filters.noteId !== undefined) params.set('noteId', String(filters.noteId))

  const query = params.toString()
  return apiRequest<RemindersResponse>(`/reminders${query ? `?${query}` : ''}`)
}

export function createReminder(payload: ReminderPayload) {
  return apiRequest<{ reminder: Reminder }>('/reminders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateReminder(id: number, payload: ReminderUpdatePayload) {
  return apiRequest<{ reminder: Reminder }>(`/reminders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function completeReminder(id: number) {
  return apiRequest<{ reminder: Reminder }>(`/reminders/${id}/complete`, { method: 'PATCH' })
}

export function uncompleteReminder(id: number) {
  return apiRequest<{ reminder: Reminder }>(`/reminders/${id}/uncomplete`, { method: 'PATCH' })
}

export function deleteReminder(id: number) {
  return apiRequest<void>(`/reminders/${id}`, { method: 'DELETE' })
}
