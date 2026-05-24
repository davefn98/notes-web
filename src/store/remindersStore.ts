import { create } from 'zustand'
import {
  completeReminder as completeReminderApi,
  createReminder,
  deleteReminder,
  getReminders,
  uncompleteReminder as uncompleteReminderApi,
  updateReminder,
} from '../api/reminders'
import type { Reminder, ReminderPayload, ReminderUpdatePayload } from '../types/reminder'

type RemindersState = {
  reminders: Reminder[]
  loading: boolean
  error: string | null
  loadReminders: () => Promise<void>
  saveReminder: (payload: ReminderPayload | ReminderUpdatePayload, id?: number) => Promise<void>
  completeReminder: (id: number) => Promise<void>
  uncompleteReminder: (id: number) => Promise<void>
  removeReminder: (id: number) => Promise<void>
}

export const useRemindersStore = create<RemindersState>((set, get) => ({
  reminders: [],
  loading: false,
  error: null,
  loadReminders: async () => {
    set({ loading: true, error: null })
    try {
      const data = await getReminders({ completed: false })
      set({ reminders: data.reminders, loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'No se pudieron cargar los recordatorios', loading: false })
    }
  },
  saveReminder: async (payload, id) => {
    if (id) await updateReminder(id, payload as ReminderUpdatePayload)
    else await createReminder(payload as ReminderPayload)
    await get().loadReminders()
  },
  completeReminder: async (id) => {
    await completeReminderApi(id)
    await get().loadReminders()
  },
  uncompleteReminder: async (id) => {
    await uncompleteReminderApi(id)
    await get().loadReminders()
  },
  removeReminder: async (id) => {
    await deleteReminder(id)
    await get().loadReminders()
  },
}))
