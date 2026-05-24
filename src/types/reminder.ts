import type { Note } from './note'

export type Reminder = {
  id: number
  remindAt: string
  message?: string | null
  completedAt?: string | null
  noteId: number
  userId: number
  createdAt: string
  updatedAt: string
  note?: Note
}

export type ReminderPayload = {
  noteId: number
  remindAt: string
  message?: string | null
}

export type ReminderUpdatePayload = Partial<Pick<ReminderPayload, 'remindAt' | 'message'>>

export type RemindersResponse = {
  reminders: Reminder[]
}
