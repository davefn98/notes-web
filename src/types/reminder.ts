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

export type CreateReminderRequest = {
  noteId: number
  remindAt: string
  message?: string | null
}

export type UpdateReminderRequest = {
  noteId?: number
  remindAt?: string
  message?: string | null
}

export type ReminderPayload = CreateReminderRequest

export type SnoozeReminderRequest = {
  minutes: number
}

export type ReminderSnoozePayload = SnoozeReminderRequest

export type ReminderRule = {
  id: number
  message?: string | null
  recurrenceType: 'daily'
  timeOfDay: string
  timezone: string
  active: boolean
  noteId: number
  userId: number
  createdAt: string
  updatedAt: string
  note?: Note
}

export type CreateReminderRuleRequest = {
  noteId: number
  timeOfDay: string
  timezone: string
  message?: string | null
  recurrenceType?: 'daily'
  active?: boolean
}

export type UpdateReminderRuleRequest = {
  noteId?: number
  timeOfDay?: string
  timezone?: string
  message?: string | null
  recurrenceType?: 'daily'
  active?: boolean
}

export type ReminderRulePayload = CreateReminderRuleRequest

export type ReminderOccurrenceStatus = 'pending' | 'snoozed' | 'completed' | 'skipped'

export type ReminderOccurrence = {
  id: number
  ruleId: number
  scheduledAt: string
  currentRemindAt: string
  status: ReminderOccurrenceStatus
  completedAt?: string | null
  skippedAt?: string | null
  noteId: number
  userId: number
  createdAt: string
  updatedAt: string
  note?: Note
}

export type SnoozeOccurrenceRequest = {
  minutes: number
}

export type RemindersResponse = {
  reminders: Reminder[]
}

export type ReminderRulesResponse = {
  reminderRules: ReminderRule[]
}

export type ReminderOccurrencesResponse = {
  reminderOccurrences: ReminderOccurrence[]
}

export type DueReminderItem = {
  source: 'reminder' | 'occurrence'
  id: number
  noteId: number
  title: string
  message: string | null
  currentRemindAt: string
  status: string
}
