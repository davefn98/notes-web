import { create } from 'zustand'
import {
  completeReminder as completeReminderApi,
  completeReminderOccurrence as completeReminderOccurrenceApi,
  createReminder,
  createReminderRule,
  deleteReminder,
  deleteReminderRule,
  fetchDueItems,
  listReminderOccurrences,
  listReminderRules,
  listReminders,
  skipReminderOccurrence as skipReminderOccurrenceApi,
  snoozeReminder as snoozeReminderApi,
  snoozeReminderOccurrence as snoozeReminderOccurrenceApi,
  uncompleteReminder as uncompleteReminderApi,
  uncompleteReminderOccurrence as uncompleteReminderOccurrenceApi,
  updateReminder,
  updateReminderRule,
} from '../api/reminders'
import type { DueReminderItem, Reminder, ReminderOccurrence, ReminderPayload, ReminderRule, ReminderRulePayload } from '../types/reminder'

type RemindersState = {
  reminders: Reminder[]
  rules: ReminderRule[]
  occurrences: ReminderOccurrence[]
  dueItems: DueReminderItem[]
  loading: boolean
  error: string | null
  loadReminders: (filters?: { completed?: boolean; upcoming?: boolean; noteId?: number }) => Promise<void>
  loadReminderRules: (filters?: { active?: boolean; noteId?: number }) => Promise<void>
  loadReminderOccurrences: (filters?: { due?: boolean; noteId?: number; ruleId?: number; status?: ReminderOccurrence['status'] }) => Promise<void>
  loadDueOccurrences: () => Promise<void>
  loadDueItems: () => Promise<void>
  saveReminder: (payload: ReminderPayload, id?: number) => Promise<void>
  saveReminderRule: (payload: ReminderRulePayload, id?: number) => Promise<void>
  removeReminderRule: (id: number) => Promise<void>
  snoozeReminder: (id: number, minutes: number) => Promise<void>
  snoozeOccurrence: (id: number, minutes: number) => Promise<void>
  completeReminder: (id: number) => Promise<void>
  uncompleteReminder: (id: number) => Promise<void>
  completeOccurrence: (id: number) => Promise<void>
  uncompleteOccurrence: (id: number) => Promise<void>
  skipOccurrence: (id: number) => Promise<void>
  removeReminder: (id: number) => Promise<void>
}

export const useRemindersStore = create<RemindersState>((set, get) => ({
  reminders: [],
  rules: [],
  occurrences: [],
  dueItems: [],
  loading: false,
  error: null,

  loadReminders: async (filters = { completed: false }) => {
    set({ loading: true, error: null })
    try {
      const data = await listReminders(filters)
      set({ reminders: data.reminders, loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'No se pudieron cargar los recordatorios', loading: false })
    }
  },

  loadReminderRules: async (filters = { active: true }) => {
    set({ loading: true, error: null })
    try {
      const data = await listReminderRules(filters)
      set({ rules: data.reminderRules, loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'No se pudieron cargar las reglas de recordatorio', loading: false })
    }
  },

  loadReminderOccurrences: async (filters = {}) => {
    set({ loading: true, error: null })
    try {
      const data = await listReminderOccurrences(filters)
      set({ occurrences: data.reminderOccurrences, loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'No se pudieron cargar las ocurrencias', loading: false })
    }
  },

  loadDueOccurrences: async () => {
    set({ loading: true, error: null })
    try {
      const data = await listReminderOccurrences({ due: true })
      set({ occurrences: data.reminderOccurrences, loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'No se pudieron cargar las ocurrencias', loading: false })
    }
  },

  loadDueItems: async () => {
    try {
      const items = await fetchDueItems()
      set({ dueItems: items })
    } catch (error) {
      console.error('[reminders] Error loading due items:', error)
    }
  },

  saveReminder: async (payload, id) => {
    if (id) await updateReminder(id, payload)
    else await createReminder(payload)
    await Promise.all([get().loadReminders(), get().loadReminderOccurrences(), get().loadDueItems()])
  },

  saveReminderRule: async (payload, id) => {
    if (id) await updateReminderRule(id, payload)
    else await createReminderRule(payload)
    await Promise.all([get().loadReminderRules(), get().loadReminderOccurrences()])
  },

  removeReminderRule: async (id) => {
    await deleteReminderRule(id)
    await get().loadReminderRules()
  },

  snoozeReminder: async (id, minutes) => {
    await snoozeReminderApi(id, { minutes })
    await Promise.all([get().loadReminders(), get().loadReminderOccurrences(), get().loadDueItems()])
  },

  snoozeOccurrence: async (id, minutes) => {
    await snoozeReminderOccurrenceApi(id, { minutes })
    await Promise.all([get().loadReminders(), get().loadReminderOccurrences(), get().loadDueItems()])
  },

  completeReminder: async (id) => {
    await completeReminderApi(id)
    await Promise.all([get().loadReminders(), get().loadReminderOccurrences(), get().loadDueItems()])
  },

  uncompleteReminder: async (id) => {
    await uncompleteReminderApi(id)
    await Promise.all([get().loadReminders(), get().loadReminderOccurrences(), get().loadDueItems()])
  },

  completeOccurrence: async (id) => {
    await completeReminderOccurrenceApi(id)
    await Promise.all([get().loadReminders(), get().loadReminderOccurrences(), get().loadDueItems()])
  },

  uncompleteOccurrence: async (id) => {
    await uncompleteReminderOccurrenceApi(id)
    await Promise.all([get().loadReminders(), get().loadReminderOccurrences(), get().loadDueItems()])
  },

  skipOccurrence: async (id) => {
    await skipReminderOccurrenceApi(id)
    await Promise.all([get().loadReminders(), get().loadReminderOccurrences(), get().loadDueItems()])
  },

  removeReminder: async (id) => {
    await deleteReminder(id)
    await Promise.all([get().loadReminders(), get().loadReminderOccurrences(), get().loadDueItems()])
  },
}))
