import { CalendarDays } from 'lucide-react'
import { TIMEZONE_OPTIONS } from '../utils/scheduling'
import type { SchedulingFormValues } from '../hooks/useSchedulingForm'
import type { NoteRecurrence } from '../types/note'

export type SchedulingStyles = {
  label: string
  labelText: string
  input: string
  compactRow: string
  warning: string
  inlineError: string
  preview: string
  mutedNote: string
  metaHeader: string
}

type SchedulingFieldsProps = {
  scheduling: SchedulingFormValues
  saveAttempted: boolean
  styles: SchedulingStyles
  showHeader?: boolean
}

export function SchedulingFields({ scheduling, saveAttempted, styles, showHeader = true }: SchedulingFieldsProps) {
  const {
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
    dueAtPast,
    punctualPast,
    punctualPreview,
    dailyPreview,
    isDailyRule,
  } = scheduling

  const dueIncomplete = saveAttempted && !isDailyRule && Boolean(dueDate || dueTime) && (!dueDate || !dueTime)
  const dailyMissing = saveAttempted && isDailyRule && !timeOfDay

  return (
    <div className="space-y-3">
      {showHeader ? (
        <div className={styles.metaHeader}>
          <CalendarDays size={13} />
          Programación
        </div>
      ) : null}

      <div className={styles.compactRow}>
        <label className={styles.label}>
          <span className={styles.labelText}>Fecha límite</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={styles.input}
          />
        </label>
        <label className={styles.label}>
          <span className={styles.labelText}>Hora</span>
          <input
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            className={styles.input}
          />
        </label>
      </div>

      {dueIncomplete ? (
        <div className={styles.inlineError}>Completa fecha y hora, o deja ambos vacíos.</div>
      ) : null}
      {dueAtPast ? (
        <div className={styles.warning}>La fecha límite está en el pasado.</div>
      ) : null}

      <label className={styles.label}>
        <span className={styles.labelText}>Repetir</span>
        <select
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value as NoteRecurrence | '')}
          className={styles.input}
        >
          <option value="">No repetir</option>
          <option value="daily">Diario</option>
        </select>
      </label>

      {!isDailyRule ? (
        <>
          <label className={styles.label}>
            <span className={styles.labelText}>Avisarme</span>
            <select
              value={remindBefore}
              onChange={(e) => setRemindBefore(e.target.value)}
              className={styles.input}
            >
              <option value="0">Mismo momento</option>
              <option value="5">5 min antes</option>
              <option value="15">15 min antes</option>
              <option value="30">30 min antes</option>
              <option value="60">1 hora antes</option>
              <option value="1440">1 día antes</option>
            </select>
          </label>
          {punctualPast ? (
            <div className={styles.warning}>Este aviso ya está vencido. Elige una hora futura.</div>
          ) : null}
          {punctualPreview ? (
            <div className={styles.preview}>Aviso: {punctualPreview}</div>
          ) : null}
        </>
      ) : (
        <>
          <div className={styles.compactRow}>
            <label className={styles.label}>
              <span className={styles.labelText}>Hora diaria</span>
              <input
                type="time"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className={styles.input}
              />
            </label>
            <label className={styles.label}>
              <span className={styles.labelText}>Zona horaria</span>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={styles.input}
              >
                {TIMEZONE_OPTIONS.map(({ group, zones }) => (
                  <optgroup key={group} label={group}>
                    {zones.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          </div>

          <label className={styles.label}>
            <span className={styles.labelText}>Mensaje opcional</span>
            <input
              value={reminderMessage}
              onChange={(e) => setReminderMessage(e.target.value)}
              placeholder="Mensaje del recordatorio..."
              className={styles.input}
            />
          </label>

          {dailyMissing ? (
            <div className={styles.inlineError}>Selecciona la hora diaria.</div>
          ) : null}
          {dailyPreview ? (
            <div className={styles.preview}>{dailyPreview}</div>
          ) : null}
          <p className={styles.mutedNote}>
            Los recordatorios recurrentes aparecerán automáticamente en la campana.
          </p>
        </>
      )}
    </div>
  )
}
