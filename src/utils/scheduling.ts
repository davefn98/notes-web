import type { Group } from '../types/group'

export const DEFAULT_TIMEZONE = 'America/Lima'
export const LIMA_UTC_OFFSET = '-05:00'

export const TIMEZONE_OPTIONS = [
  {
    group: 'América',
    zones: [
      { value: 'America/Lima', label: 'Lima (PET)' },
      { value: 'America/Santiago', label: 'Santiago (CLT)' },
      { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (ART)' },
      { value: 'America/Caracas', label: 'Caracas (VET)' },
      { value: 'America/Mexico_City', label: 'Ciudad de México (CST)' },
      { value: 'America/New_York', label: 'Nueva York (EST)' },
      { value: 'America/Chicago', label: 'Chicago (CST)' },
      { value: 'America/Denver', label: 'Denver (MST)' },
      { value: 'America/Los_Angeles', label: 'Los Ángeles (PST)' },
      { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },
    ],
  },
  {
    group: 'Europa',
    zones: [
      { value: 'Europe/Madrid', label: 'Madrid (CET)' },
      { value: 'Europe/London', label: 'Londres (GMT)' },
      { value: 'Europe/Paris', label: 'París (CET)' },
      { value: 'Europe/Berlin', label: 'Berlín (CET)' },
      { value: 'Europe/Rome', label: 'Roma (CET)' },
      { value: 'Europe/Lisbon', label: 'Lisboa (WET)' },
      { value: 'Europe/Moscow', label: 'Moscú (MSK)' },
    ],
  },
  {
    group: 'Asia / Pacífico',
    zones: [
      { value: 'Asia/Tokyo', label: 'Tokio (JST)' },
      { value: 'Asia/Shanghai', label: 'Shanghái (CST)' },
      { value: 'Asia/Kolkata', label: 'Calcuta (IST)' },
      { value: 'Asia/Dubai', label: 'Dubái (GST)' },
      { value: 'Asia/Singapore', label: 'Singapur (SGT)' },
      { value: 'Australia/Sydney', label: 'Sídney (AEDT)' },
      { value: 'Pacific/Auckland', label: 'Auckland (NZST)' },
    ],
  },
  {
    group: 'Otras',
    zones: [
      { value: 'UTC', label: 'UTC' },
      { value: 'Africa/Cairo', label: 'El Cairo (EET)' },
      { value: 'Africa/Lagos', label: 'Lagos (WAT)' },
    ],
  },
]

export function flattenGroups(groups: Group[]): Group[] {
  return groups.flatMap((g) => [g, ...flattenGroups(g.children)])
}

export function toInputDate(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DEFAULT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

export function fromLimaParts(datePart: string, timePart: string): Date {
  return new Date(`${datePart}T${timePart}:00${LIMA_UTC_OFFSET}`)
}

export function formatPreviewDate(date: Date): string {
  return new Intl.DateTimeFormat('es', {
    timeZone: DEFAULT_TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function getInitialReminderOffset(dueInput: string, remindAt?: string | null): string {
  if (!dueInput || !remindAt) return '0'
  const due = fromLimaParts(dueInput.slice(0, 10), dueInput.slice(11, 16))
  const remind = new Date(remindAt)
  const diff = Math.round((due.getTime() - remind.getTime()) / 60_000)
  return ['0', '5', '15', '30', '60', '1440'].includes(String(diff)) ? String(diff) : '0'
}
