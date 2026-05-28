import { apiRequest } from './client'
import type {
  CreateReminderRequest,
  CreateReminderRuleRequest,
  DueReminderItem,
  Reminder,
  ReminderOccurrence,
  ReminderOccurrencesResponse,
  ReminderOccurrenceStatus,
  ReminderRule,
  ReminderRulesResponse,
  RemindersResponse,
  SnoozeOccurrenceRequest,
  SnoozeReminderRequest,
  UpdateReminderRequest,
  UpdateReminderRuleRequest,
} from '../types/reminder'

const isDev = import.meta.env.DEV

function devLog(endpoint: string, payload?: unknown, response?: unknown) {
  if (!isDev) return
  console.log('[reminders] endpoint:', endpoint)
  if (payload !== undefined) console.log('[reminders] payload:', payload)
  if (response !== undefined) console.log('[reminders] response:', response)
}

// ─── /reminders ─────────────────────────────────────────────────────────────

export async function listReminders(params: { completed?: boolean; upcoming?: boolean; due?: boolean; noteId?: number } = {}) {
  const qs = new URLSearchParams()
  if (params.completed !== undefined) qs.set('completed', String(params.completed))
  if (params.upcoming !== undefined) qs.set('upcoming', String(params.upcoming))
  if (params.due !== undefined) qs.set('due', String(params.due))
  if (params.noteId !== undefined) qs.set('noteId', String(params.noteId))
  const endpoint = `/reminders${qs.toString() ? `?${qs}` : ''}`
  devLog(endpoint)
  const response = await apiRequest<RemindersResponse>(endpoint)
  devLog(endpoint, undefined, response)
  return response
}

/** @deprecated Use listReminders */
export const getReminders = listReminders

export async function createReminder(payload: CreateReminderRequest) {
  const endpoint = '/reminders'
  devLog(endpoint, payload)
  const response = await apiRequest<{ reminder: Reminder }>(endpoint, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  devLog(endpoint, payload, response)
  return response
}

export async function getReminder(id: number) {
  const endpoint = `/reminders/${id}`
  devLog(endpoint)
  const response = await apiRequest<{ reminder: Reminder }>(endpoint)
  devLog(endpoint, undefined, response)
  return response
}

export async function updateReminder(id: number, payload: UpdateReminderRequest) {
  const endpoint = `/reminders/${id}`
  devLog(endpoint, payload)
  const response = await apiRequest<{ reminder: Reminder }>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  devLog(endpoint, payload, response)
  return response
}

export async function deleteReminder(id: number) {
  const endpoint = `/reminders/${id}`
  devLog(endpoint)
  const response = await apiRequest<void>(endpoint, { method: 'DELETE' })
  devLog(endpoint, undefined, response)
  return response
}

export async function completeReminder(id: number) {
  const endpoint = `/reminders/${id}/complete`
  devLog(endpoint)
  const response = await apiRequest<{ reminder: Reminder }>(endpoint, { method: 'PATCH' })
  devLog(endpoint, undefined, response)
  return response
}

export async function snoozeReminder(id: number, payload: SnoozeReminderRequest) {
  const endpoint = `/reminders/${id}/snooze`
  devLog(endpoint, payload)
  const response = await apiRequest<{ reminder: Reminder }>(endpoint, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  devLog(endpoint, payload, response)
  return response
}

export async function uncompleteReminder(id: number) {
  const endpoint = `/reminders/${id}/uncomplete`
  devLog(endpoint)
  const response = await apiRequest<{ reminder: Reminder }>(endpoint, { method: 'PATCH' })
  devLog(endpoint, undefined, response)
  return response
}

// ─── /reminder-rules ────────────────────────────────────────────────────────

export async function listReminderRules(params: { active?: boolean; noteId?: number } = {}) {
  const qs = new URLSearchParams()
  if (params.active !== undefined) qs.set('active', String(params.active))
  if (params.noteId !== undefined) qs.set('noteId', String(params.noteId))
  const endpoint = `/reminder-rules${qs.toString() ? `?${qs}` : ''}`
  devLog(endpoint)
  const response = await apiRequest<ReminderRulesResponse>(endpoint)
  devLog(endpoint, undefined, response)
  return response
}

/** @deprecated Use listReminderRules */
export const getReminderRules = listReminderRules

export async function createReminderRule(payload: CreateReminderRuleRequest) {
  const endpoint = '/reminder-rules'
  devLog(endpoint, payload)
  const response = await apiRequest<{ reminderRule: ReminderRule }>(endpoint, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  devLog(endpoint, payload, response)
  return response
}

export async function getReminderRule(id: number) {
  const endpoint = `/reminder-rules/${id}`
  devLog(endpoint)
  const response = await apiRequest<{ reminderRule: ReminderRule }>(endpoint)
  devLog(endpoint, undefined, response)
  return response
}

export async function updateReminderRule(id: number, payload: UpdateReminderRuleRequest) {
  const endpoint = `/reminder-rules/${id}`
  devLog(endpoint, payload)
  const response = await apiRequest<{ reminderRule: ReminderRule }>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  devLog(endpoint, payload, response)
  return response
}

export async function deleteReminderRule(id: number) {
  const endpoint = `/reminder-rules/${id}`
  devLog(endpoint)
  const response = await apiRequest<void>(endpoint, { method: 'DELETE' })
  devLog(endpoint, undefined, response)
  return response
}

// ─── /reminder-occurrences ──────────────────────────────────────────────────

export async function listReminderOccurrences(params: { due?: boolean; noteId?: number; ruleId?: number; status?: ReminderOccurrenceStatus } = {}) {
  const qs = new URLSearchParams()
  if (params.due !== undefined) qs.set('due', String(params.due))
  if (params.noteId !== undefined) qs.set('noteId', String(params.noteId))
  if (params.ruleId !== undefined) qs.set('ruleId', String(params.ruleId))
  if (params.status !== undefined) qs.set('status', params.status)
  const endpoint = `/reminder-occurrences${qs.toString() ? `?${qs}` : ''}`
  devLog(endpoint)
  const response = await apiRequest<ReminderOccurrencesResponse>(endpoint)
  devLog(endpoint, undefined, response)
  return response
}

/** @deprecated Use listReminderOccurrences */
export const getReminderOccurrences = listReminderOccurrences

export async function getReminderOccurrence(id: number) {
  const endpoint = `/reminder-occurrences/${id}`
  devLog(endpoint)
  const response = await apiRequest<{ reminderOccurrence: ReminderOccurrence }>(endpoint)
  devLog(endpoint, undefined, response)
  return response
}

export async function snoozeReminderOccurrence(id: number, payload: SnoozeOccurrenceRequest) {
  const endpoint = `/reminder-occurrences/${id}/snooze`
  devLog(endpoint, payload)
  const response = await apiRequest<{ reminderOccurrence: ReminderOccurrence }>(endpoint, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  devLog(endpoint, payload, response)
  return response
}

export async function completeReminderOccurrence(id: number) {
  const endpoint = `/reminder-occurrences/${id}/complete`
  devLog(endpoint)
  const response = await apiRequest<{ reminderOccurrence: ReminderOccurrence }>(endpoint, { method: 'PATCH' })
  devLog(endpoint, undefined, response)
  return response
}

export async function uncompleteReminderOccurrence(id: number) {
  const endpoint = `/reminder-occurrences/${id}/uncomplete`
  devLog(endpoint)
  const response = await apiRequest<{ reminderOccurrence: ReminderOccurrence }>(endpoint, { method: 'PATCH' })
  devLog(endpoint, undefined, response)
  return response
}

export async function skipReminderOccurrence(id: number) {
  const endpoint = `/reminder-occurrences/${id}/skip`
  devLog(endpoint)
  const response = await apiRequest<{ reminderOccurrence: ReminderOccurrence }>(endpoint, { method: 'PATCH' })
  devLog(endpoint, undefined, response)
  return response
}

// ─── Normalization helper ────────────────────────────────────────────────────

export async function fetchDueItems(): Promise<DueReminderItem[]> {
  const now = new Date()

  const [remindersData, occurrencesData] = await Promise.all([
    listReminders({ due: true }),
    listReminderOccurrences({ due: true }),
  ])

  const fromReminders: DueReminderItem[] = remindersData.reminders
    .filter((r) => !r.completedAt && new Date(r.remindAt) <= now)
    .map((r) => ({
      source: 'reminder' as const,
      id: r.id,
      noteId: r.noteId,
      title: r.note?.title ?? `Nota #${r.noteId}`,
      message: r.message ?? null,
      currentRemindAt: r.remindAt,
      status: 'pending',
    }))

  const fromOccurrences: DueReminderItem[] = occurrencesData.reminderOccurrences
    .filter((o) => ['pending', 'snoozed'].includes(o.status) && new Date(o.currentRemindAt) <= now)
    .map((o) => ({
      source: 'occurrence' as const,
      id: o.id,
      noteId: o.noteId,
      title: o.note?.title ?? `Nota #${o.noteId}`,
      message: null,
      currentRemindAt: o.currentRemindAt,
      status: o.status,
    }))

  const seen = new Set<string>()
  const items: DueReminderItem[] = []
  for (const item of [...fromReminders, ...fromOccurrences]) {
    const key = `${item.source}:${item.id}`
    if (!seen.has(key)) {
      seen.add(key)
      items.push(item)
    }
  }
  return items.sort((a, b) => new Date(a.currentRemindAt).getTime() - new Date(b.currentRemindAt).getTime())
}
