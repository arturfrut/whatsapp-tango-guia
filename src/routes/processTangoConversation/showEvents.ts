import { DatabaseService } from '../../services/database'
import { WhatsAppService } from '../../services/whatsapp'
import {
  ChatState,
  TempEventData,
  CompleteEventData
} from '../../types/processTangoConversation'
import { getMainMenuMessage, returnToMainMenu } from './utils'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'

export const caseToday = async (
  userStates: Map<string, ChatState>,
  tempEventData: Map<string, TempEventData>,
  phoneNumber: string
) => {
  userStates.set(phoneNumber, ChatState.MENU_TODAY)

  try {
    const today = format(new Date(), 'yyyy-MM-dd')

    const events = await getTangoEventsForDate(today)

    let message = `🎉 Estas son las actividades de *hoy*:\n\n`

    if (events.length === 0) {
      message += '🙁 No hay actividades programadas para hoy.'
      await WhatsAppService.sendTextMessage(phoneNumber, message)
      return WhatsAppService.sendTextMessage(phoneNumber, returnToMainMenu())
    }

    tempEventData.set(phoneNumber, {
      events: events,
      context: 'today'
    })

    events.forEach((event, index) => {
      const primaryOrganizer = event.organizers?.find(org => org.is_primary)
      const organizerName =
        primaryOrganizer?.one_time_teacher_name ||
        primaryOrganizer?.user?.name ||
        'Por confirmar'

      const eventTime = getEventDisplayTime(event)

      message += `${index + 1}. *${event.title}*\n`
      message += `🕒 ${eventTime}\n`
      message += `👤 ${organizerName}\n`
      message += `📍 ${event.address}\n\n`
    })

    userStates.set(phoneNumber, ChatState.MENU_TODAY_DETAILS)

    message += `📋 *Selecciona un número (1-${events.length}) para ver más detalles*\n`
    message += `🏠 *Presiona 0 para volver al menú principal*`

    return WhatsAppService.sendTextMessage(phoneNumber, message)
  } catch (error) {
    console.error('❌ Error in caseToday:', error)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      '⚠️ Ocurrió un error al obtener las actividades de hoy.'
    )
  }
}

export const caseWeek = async (
  userStates: Map<string, ChatState>,
  tempEventData: Map<string, TempEventData>,
  phoneNumber: string
) => {
  userStates.set(phoneNumber, ChatState.MENU_WEEK)

  try {
    const today = new Date()
    const startDate = format(today, 'yyyy-MM-dd')
    const endDate = format(addDays(today, 6), 'yyyy-MM-dd')

    const weekEvents = await getTangoEventsForDateRange(startDate, endDate)

    let message = `🗓️ Estas son las actividades de *la semana*:\n\n`

    if (weekEvents.length === 0) {
      message += '🙁 No hay actividades programadas para esta semana.'
      await WhatsAppService.sendTextMessage(phoneNumber, message)
      return WhatsAppService.sendTextMessage(phoneNumber, returnToMainMenu())
    }

    // Group events by date
    const groupedByDay = groupEventsByDate(weekEvents)
    const sortedDates = Object.keys(groupedByDay).sort()
    const allWeekEvents: CompleteEventData[] = []
    let counter = 1

    for (const dateStr of sortedDates) {
      const dayLabel = format(new Date(dateStr), 'EEEE dd/MM', { locale: es })
      message += `📅 *${dayLabel}*\n`

      groupedByDay[dateStr].forEach(event => {
        const primaryOrganizer = event.organizers?.find(org => org.is_primary)
        const organizerName =
          primaryOrganizer?.one_time_teacher_name ||
          primaryOrganizer?.user?.name ||
          'Por confirmar'

        const eventTime = getEventDisplayTime(event)

        message += `${counter}. *${event.title}*\n`
        message += `📍 ${event.address}\n`
        message += `🕒 ${eventTime}\n`
        message += `👤 ${organizerName}\n\n`

        allWeekEvents.push(event)
        counter++
      })
    }

    tempEventData.set(phoneNumber, {
      events: allWeekEvents,
      context: 'week'
    })

    userStates.set(phoneNumber, ChatState.MENU_WEEK_DETAILS)

    message += `📋 *Selecciona un número (1-${allWeekEvents.length}) para ver más detalles*\n`
    message += `🏠 *Presiona 0 para volver al menú principal*`

    return WhatsAppService.sendTextMessage(phoneNumber, message)
  } catch (error) {
    console.error('❌ Error in caseWeek:', error)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      '⚠️ Ocurrió un error al obtener las actividades de la semana.'
    )
  }
}

export async function handleEventSelection(
  userStates: Map<string, ChatState>,
  tempEventData: Map<string, TempEventData>,
  phoneNumber: string,
  normalizedMessage: string
) {
  const tempData = tempEventData.get(phoneNumber)

  if (!tempData) {
    userStates.set(phoneNumber, ChatState.MAIN_MENU)
    return WhatsAppService.sendTextMessage(phoneNumber, getMainMenuMessage())
  }

  if (normalizedMessage === '0') {
    tempEventData.delete(phoneNumber)
    userStates.set(phoneNumber, ChatState.MAIN_MENU)
    return WhatsAppService.sendTextMessage(phoneNumber, getMainMenuMessage())
  }

  const selectedNumber = parseInt(normalizedMessage)
  if (
    isNaN(selectedNumber) ||
    selectedNumber < 1 ||
    selectedNumber > tempData.events.length
  ) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Opción inválida. Por favor selecciona un número del 1 al ${tempData.events.length}, o presiona 0 para volver al menú principal.`
    )
  }

  const selectedEvent = tempData.events[selectedNumber - 1]

  await showEventDetails(phoneNumber, selectedEvent)

  return WhatsAppService.sendTextMessage(
    phoneNumber,
    `¿Qué te gustaría hacer ahora?

📋 Escribe otro número (1-${tempData.events.length}) para ver más detalles
🏠 Presiona 0 para volver al menú principal`
  )
}

async function getTangoEventsForDate(
  date: string
): Promise<CompleteEventData[]> {
  try {
    const specificEvents = await DatabaseService.getTangoEventsByDate(date)

    const recurringEvents = await getRecurringEventsForDate(date)

    const allEvents = [...specificEvents, ...recurringEvents]
    const uniqueEvents = allEvents.filter(
      (event, index, self) => self.findIndex(e => e.id === event.id) === index
    )

    return uniqueEvents.sort((a, b) => {
      const timeA = getEventSortTime(a)
      const timeB = getEventSortTime(b)
      return timeA.localeCompare(timeB)
    })
  } catch (error) {
    console.error('Error getting tango events for date:', error)
    return []
  }
}
async function getTangoEventsForDateRange(
  startDate: string,
  endDate: string
): Promise<CompleteEventData[]> {
  try {
    const specificEvents = await DatabaseService.getTangoEventsByDateRange(
      startDate,
      endDate
    )

    const recurringEvents = await getRecurringEventsForDateRange(
      startDate,
      endDate
    )

    const allEvents = [...specificEvents, ...recurringEvents]
    const uniqueEvents = allEvents.filter(
      (event, index, self) => self.findIndex(e => e.id === event.id) === index
    )

    return uniqueEvents.sort((a, b) => {
      const dateA = a.date
      const dateB = b.date
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB)
      }

      const timeA = getEventSortTime(a)
      const timeB = getEventSortTime(b)
      return timeA.localeCompare(timeB)
    })
  } catch (error) {
    console.error('Error getting tango events for date range:', error)
    return []
  }
}
async function getRecurringEventsForDate(
  targetDate: string
): Promise<CompleteEventData[]> {
  try {
    const allEvents = await DatabaseService.getTangoEventsByDateRange(
      '2024-01-01',
      '2030-12-31'
    )
    const recurringEvents = allEvents.filter(
      event => event.has_weekly_recurrence
    )

    const targetDay = new Date(targetDate)
    const targetDayOfWeek = targetDay.getDay() 

    const eventsForDate: CompleteEventData[] = []

    for (const event of recurringEvents) {
      const eventDate = new Date(event.date)
      const eventDayOfWeek = eventDate.getDay()

      if (eventDayOfWeek === targetDayOfWeek) {
        if (targetDay >= eventDate) {
          eventsForDate.push({
            ...event,
            date: targetDate
          })
        }
      }
    }

    return eventsForDate
  } catch (error) {
    console.error('Error getting recurring events for date:', error)
    return []
  }
}

async function getRecurringEventsForDateRange(
  startDate: string,
  endDate: string
): Promise<CompleteEventData[]> {
  try {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const eventsForRange: CompleteEventData[] = []

    const allEvents = await DatabaseService.getTangoEventsByDateRange(
      '2024-01-01',
      '2030-12-31'
    )
    const recurringEvents = allEvents.filter(
      event => event.has_weekly_recurrence
    )

    for (const event of recurringEvents) {
      const eventStartDate = new Date(event.date)

      const current = new Date(
        Math.max(start.getTime(), eventStartDate.getTime())
      )

      while (current <= end) {
        if (current.getDay() === eventStartDate.getDay()) {
          eventsForRange.push({
            ...event,
            date: format(current, 'yyyy-MM-dd')
          })
        }
        current.setDate(current.getDate() + 1)
      }
    }

    return eventsForRange
  } catch (error) {
    console.error('Error getting recurring events for date range:', error)
    return []
  }
}
function groupEventsByDate(
  events: CompleteEventData[]
): Record<string, CompleteEventData[]> {
  const grouped: Record<string, CompleteEventData[]> = {}

  events.forEach(event => {
    const date = event.date
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(event)
  })

  Object.keys(grouped).forEach(date => {
    grouped[date].sort((a, b) => {
      const timeA = getEventSortTime(a)
      const timeB = getEventSortTime(b)
      return timeA.localeCompare(timeB)
    })
  })

  return grouped
}

function getEventDisplayTime(event: CompleteEventData): string {
  switch (event.event_type) {
    case 'class':
      if (event.classes && event.classes.length > 0) {
        const times = event.classes.map(c => c.start_time).join(', ')
        if (event.practice) {
          return `${times} + Práctica ${event.practice.practice_time}`
        }
        return times
      }
      break

    case 'milonga':
      if (event.milonga_pre_class) {
        return `Clase ${event.milonga_pre_class.class_time} + Milonga ${event.milonga_pre_class.milonga_start_time}`
      }
      if (event.classes && event.classes.length > 0) {
        return event.classes[0].start_time
      }
      break

    case 'special_event':
    case 'seminar':
      if (event.classes && event.classes.length > 0) {
        return event.classes[0].start_time
      }
      break
  }

  return 'Sin horario'
}

function getEventSortTime(event: CompleteEventData): string {
  switch (event.event_type) {
    case 'class':
      if (event.classes && event.classes.length > 0) {
        return event.classes[0].start_time
      }
      break

    case 'milonga':
      if (event.milonga_pre_class) {
        return event.milonga_pre_class.class_time
      }
      if (event.classes && event.classes.length > 0) {
        return event.classes[0].start_time
      }
      break

    case 'special_event':
    case 'seminar':
      if (event.classes && event.classes.length > 0) {
        return event.classes[0].start_time
      }
      break
  }

  return '99:99' 
}
async function showEventDetails(phoneNumber: string, event: CompleteEventData) {
  const primaryOrganizer = event.organizers?.find(org => org.is_primary)
  const organizerName =
    primaryOrganizer?.one_time_teacher_name ||
    primaryOrganizer?.user?.name ||
    'Por confirmar'

  let message = `🎭 *${event.title}*\n\n`

  if (event.description) {
    message += `📝 *Descripción:*\n${event.description}\n\n`
  }

  const eventTypeLabels: Record<string, string> = {
    class: 'Clase',
    milonga: 'Milonga',
    seminar: 'Seminario',
    special_event: 'Evento Especial'
  }
  message += `🎪 *Tipo:* ${
    eventTypeLabels[event.event_type] || event.event_type
  }\n`

  message += `🏢 *Lugar:* ${event.venue_name}\n`

  if (event.classes && event.classes.length > 0) {
    const levelLabels: Record<string, string> = {
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      all_levels: 'Todos los niveles'
    }

    if (event.classes.length === 1) {
      message += `🕒 *Horario:* ${event.classes[0].start_time}\n`
      if (event.classes[0].class_level) {
        message += `📊 *Nivel:* ${levelLabels[event.classes[0].class_level]}\n`
      }
    } else {
      message += `🕒 *Horarios:*\n`
      event.classes.forEach((cls, index) => {
        message += `   Clase ${index + 1}: ${cls.start_time}`
        if (cls.class_level) {
          message += ` (${levelLabels[cls.class_level]})`
        }
        message += `\n`
      })
    }
  }

  if (event.practice) {
    message += `💃 *Práctica:* ${event.practice.practice_time}\n`
  }

  if (event.milonga_pre_class) {
    message += `📚 *Clase previa:* ${event.milonga_pre_class.class_time}\n`
    message += `🎵 *Milonga:* ${event.milonga_pre_class.milonga_start_time}\n`
  }

  if (event.show_description) {
    message += `🎭 *Show:* ${event.show_description}\n`
  }

  if (event.pricing && event.pricing.length > 0) {
    if (event.pricing.length === 1) {
      const price = event.pricing[0]
      message += `💰 *Precio:* ${
        price.price === 0 ? 'Gratuito' : `$${price.price}`
      }\n`
    } else {
      message += `💰 *Precios:*\n`
      event.pricing.forEach(price => {
        message += `   ${price.description}: ${
          price.price === 0 ? 'Gratuito' : `$${price.price}`
        }\n`
      })
    }
  } else {
    message += `💰 *Precio:* Consultar\n`
  }

  message += `👤 *Profesor/Organizador:* ${organizerName}\n`

  if (event.has_weekly_recurrence) {
    message += `🔄 *Se repite:* Semanalmente\n`
  }

  message += `📍 *Dirección:* ${event.address}\n`

  if (event.contact_phone) {
    message += `📞 *Contacto:* ${event.contact_phone}\n`
  }

  return WhatsAppService.sendTextMessage(phoneNumber, message)
}
