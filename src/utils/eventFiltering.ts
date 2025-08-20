import { format } from 'date-fns'
import { EventSchedule, EventWithDetails } from '../types'

export function isEventOnDate(
  event: EventWithDetails,
  targetDate: Date
): boolean {
  return (
    event.event_schedules?.some((schedule: EventSchedule) =>
      isScheduleOnDate(schedule, targetDate)
    ) || false
  )
}


export function isScheduleOnDate(schedule: any, targetDate: Date): boolean {
  const scheduleDate = new Date(schedule.start_date)
  const target = new Date(targetDate)

  if (schedule.recurrence_pattern === 'none' || !schedule.recurrence_pattern) {
    return format(scheduleDate, 'yyyy-MM-dd') === format(target, 'yyyy-MM-dd')
  }

  if (schedule.recurrence_pattern === 'weekly' && schedule.days_of_week) {
    if (target < scheduleDate) {
      return false
    }

    const dayName = target
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase()

    return schedule.days_of_week.includes(dayName)
  }

  return false
}


export function filterEventsByDateRange(
  events: EventWithDetails[],
  startDate: Date,
  endDate?: Date
): EventWithDetails[] {
  const end = endDate || startDate

  return events.filter(event => {
    return event.event_schedules?.some((schedule: EventSchedule) => {
      const scheduleDate = new Date(schedule.start_date)

      if (
        schedule.recurrence_pattern === 'none' ||
        !schedule.recurrence_pattern
      ) {
        return scheduleDate >= startDate && scheduleDate <= end
      }

      if (schedule.recurrence_pattern === 'weekly' && schedule.days_of_week) {
        if (scheduleDate > end) {
          return false
        }

        const current = new Date(startDate)
        while (current <= end) {
          if (isScheduleOnDate(schedule, current)) {
            return true
          }
          current.setDate(current.getDate() + 1)
        }
      }

      return false
    })
  })
}
