import { useState } from 'react'
import { DEFAULT_TIMEZONE, formatPreviewDate, fromLimaParts, getInitialReminderOffset, toInputDate } from '../utils/scheduling'
import type { NoteRecurrence } from '../types/note'
import type { Reminder, ReminderPayload, ReminderRule, ReminderRulePayload } from '../types/reminder'

type InitialValues = {
  dueAt?: string | null
  reminder?: Reminder | null
  reminderRule?: ReminderRule | null
}

export type BuildReminderResult = {
  reminderPayload: { payload: ReminderPayload; id?: number } | null
  rulePayload: { payload: ReminderRulePayload; id?: number } | null
  deleteReminderId: number | null
}

export type SchedulingFormValues = {
  dueDate: string
  dueTime: string
  recurrence: NoteRecurrence | ''
  remindBefore: string
  timeOfDay: string
  timezone: string
  reminderMessage: string
  setDueDate: (v: string) => void
  setDueTime: (v: string) => void
  setRecurrence: (v: NoteRecurrence | '') => void
  setRemindBefore: (v: string) => void
  setTimeOfDay: (v: string) => void
  setTimezone: (v: string) => void
  setReminderMessage: (v: string) => void
  dueDateTime: Date | null
  remindAtDate: Date | null
  isDailyRule: boolean
  dueAtPast: boolean
  punctualPast: boolean
  punctualPreview: string | null
  dailyPreview: string | null
  buildReminderPayloads: (
    noteId: number,
    existing?: { reminder?: Reminder | null; reminderRule?: ReminderRule | null },
  ) => BuildReminderResult
  reset: () => void
}

export function useSchedulingForm(initial: InitialValues = {}): SchedulingFormValues {
  const initialDueAt = toInputDate(initial.dueAt ?? initial.reminder?.remindAt)
  const [dueDate, setDueDate] = useState(initialDueAt.slice(0, 10))
  const [dueTime, setDueTime] = useState(initialDueAt.length >= 16 ? initialDueAt.slice(11, 16) : '')
  const [recurrence, setRecurrence] = useState<NoteRecurrence | ''>(initial.reminderRule?.active ? 'daily' : '')
  const [remindBefore, setRemindBefore] = useState(getInitialReminderOffset(initialDueAt, initial.reminder?.remindAt))
  const [timeOfDay, setTimeOfDay] = useState(initial.reminderRule?.timeOfDay?.slice(0, 5) ?? '')
  const [timezone, setTimezone] = useState(
    initial.reminderRule?.timezone && initial.reminderRule.timezone !== 'America/Bogota'
      ? initial.reminderRule.timezone
      : DEFAULT_TIMEZONE,
  )
  const [reminderMessage, setReminderMessage] = useState(
    initial.reminder?.message ?? initial.reminderRule?.message ?? '',
  )

  const isDailyRule = recurrence === 'daily'
  const dueDateTime = dueDate && dueTime ? fromLimaParts(dueDate, dueTime) : null
  const remindAtDate =
    dueDateTime && !isDailyRule
      ? new Date(dueDateTime.getTime() - Number(remindBefore) * 60_000)
      : null
  const dueAtPast = Boolean(dueDateTime && dueDateTime <= new Date())
  const punctualPast = Boolean(remindAtDate && remindAtDate <= new Date())
  const punctualPreview =
    remindAtDate && !isNaN(remindAtDate.getTime())
      ? `${formatPreviewDate(remindAtDate)} · ${DEFAULT_TIMEZONE}`
      : null
  const dailyPreview = timeOfDay ? `Diario · ${timeOfDay} · ${timezone}` : null

  function buildReminderPayloads(
    noteId: number,
    existing: { reminder?: Reminder | null; reminderRule?: ReminderRule | null } = {},
  ): BuildReminderResult {
    if (isDailyRule && timeOfDay) {
      return {
        rulePayload: {
          payload: {
            noteId,
            timeOfDay,
            timezone,
            recurrenceType: 'daily',
            active: true,
            message: reminderMessage.trim() || null,
          },
          id: existing.reminderRule?.id,
        },
        reminderPayload: null,
        deleteReminderId: existing.reminder?.id ?? null,
      }
    }

    if (!isDailyRule && remindAtDate) {
      return {
        reminderPayload: {
          payload: {
            noteId,
            remindAt: remindAtDate.toISOString(),
            message: reminderMessage.trim() || null,
          },
          id: existing.reminder?.id,
        },
        rulePayload:
          existing.reminderRule?.active
            ? {
                payload: {
                  noteId,
                  timeOfDay: existing.reminderRule.timeOfDay,
                  timezone: existing.reminderRule.timezone,
                  recurrenceType: 'daily',
                  active: false,
                  message: existing.reminderRule.message ?? null,
                },
                id: existing.reminderRule.id,
              }
            : null,
        deleteReminderId: null,
      }
    }

    return {
      reminderPayload: null,
      rulePayload: null,
      deleteReminderId: existing.reminder?.id ?? null,
    }
  }

  function reset() {
    setDueDate('')
    setDueTime('')
    setRecurrence('')
    setRemindBefore('0')
    setTimeOfDay('')
    setTimezone(DEFAULT_TIMEZONE)
    setReminderMessage('')
  }

  return {
    dueDate,
    dueTime,
    recurrence,
    remindBefore,
    timeOfDay,
    timezone,
    reminderMessage,
    setDueDate,
    setDueTime,
    setRecurrence,
    setRemindBefore,
    setTimeOfDay,
    setTimezone,
    setReminderMessage,
    dueDateTime,
    remindAtDate,
    isDailyRule,
    dueAtPast,
    punctualPast,
    punctualPreview,
    dailyPreview,
    buildReminderPayloads,
    reset,
  }
}
