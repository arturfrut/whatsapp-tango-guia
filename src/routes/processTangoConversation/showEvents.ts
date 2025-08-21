
import { supabase } from '../../config/supabase'
import { WhatsAppService } from '../../services/whatsapp'
import { ChatState, TempEventData } from '../../types/processTangoConversation'
import { filterEventsByDateRange } from '../../utils/eventFiltering'
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
    const today = new Date()

    const { data: events, error } = await supabase
      .from('events')
      .select(
        `
        *,
        event_schedules (
          id,
          start_date,
          end_date,
          start_time,
          end_time,
          timezone,
          recurrence_pattern,
          recurrence_rule,
          days_of_week,
          ends_at
        ),
        event_teachers (
          id,
          is_primary_teacher,
          teacher:users!event_teachers_teacher_id_fkey (
            id,
            name,
            phone_number
          )
        )
      `
      )
      .eq('is_active', true)
      .is('deleted_at', null)

    if (error) {
      console.error('❌ Error al traer eventos:', error)
      await WhatsAppService.sendTextMessage(
        phoneNumber,
        '⚠️ Hubo un error al obtener las actividades del dia de hoy.'
      )
      return
    }

    const filteredEvents = events ? filterEventsByDateRange(events, today) : []

    let message = `🎉 Estas son las actividades de *hoy*:\n\n`

    if (filteredEvents.length === 0) {
      message += '🙁 No hay actividades programadas para hoy.'
      await WhatsAppService.sendTextMessage(phoneNumber, message)
      return WhatsAppService.sendTextMessage(phoneNumber, returnToMainMenu())
    } else {
      tempEventData.set(phoneNumber, {
        events: filteredEvents,
        context: 'today'
      })

      filteredEvents.forEach((event: any, index: number) => {
        const teacher = event.event_teachers?.find(
          (t: any) => t.is_primary_teacher
        )?.teacher?.name
        const startTime = event.event_schedules?.[0]?.start_time || 'Sin hora'
        message += `${index + 1}. *${event.title || 'Evento'}*\n🕒 ${startTime}\n👤 ${
          teacher || 'Por confirmar'
        }\n📍 ${event.address || 'Sin dirección'}\n\n`
      })

      userStates.set(phoneNumber, ChatState.MENU_TODAY_DETAILS)
      
      message += `📋 *Selecciona un número (1-${filteredEvents.length}) para ver más detalles*\n🏠 *Presiona 0 para volver al menú principal*`
    }

    return WhatsAppService.sendTextMessage(phoneNumber, message)
  } catch (err) {
    console.error('❌ Excepción en caseToday:', err)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      '⚠️ Ocurrió un error inesperado al obtener las actividades de hoy.'
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
    const endOfWeek = addDays(today, 6)

    const { data: events, error } = await supabase
      .from('events')
      .select(
        `
        *,
        event_schedules (
          id,
          start_date,
          end_date,
          start_time,
          end_time,
          timezone,
          recurrence_pattern,
          recurrence_rule,
          days_of_week,
          ends_at
        ),
        event_teachers (
          id,
          is_primary_teacher,
          teacher:users!event_teachers_teacher_id_fkey (
            id,
            name
          )
        )
      `
      )
      .eq('is_active', true)
      .is('deleted_at', null)

    if (error) {
      console.error('❌ Error al traer eventos:', error)
      await WhatsAppService.sendTextMessage(
        phoneNumber,
        '⚠️ Hubo un error al obtener las actividades de la semana.'
      )
      return
    }

    const weekEvents = events ? filterEventsByDateRange(events, today, endOfWeek) : []

    const groupedByDay: Record<string, any[]> = {}
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(today, i))

    weekDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd')

      weekEvents.forEach((event: any) => {
        const eventOccursOnDay = event.event_schedules?.some((schedule: any) => {
          if (schedule.recurrence_pattern === 'none' || !schedule.recurrence_pattern) {
            return format(new Date(schedule.start_date), 'yyyy-MM-dd') === dayKey
          }

          if (schedule.recurrence_pattern === 'weekly' && schedule.days_of_week) {
            const dayName = day.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
            const startDate = new Date(schedule.start_date)
            return day >= startDate && schedule.days_of_week.includes(dayName)
          }

          return false
        })

        if (eventOccursOnDay) {
          if (!groupedByDay[dayKey]) groupedByDay[dayKey] = []
          groupedByDay[dayKey].push({
            ...event,
            displayDate: dayKey
          })
        }
      })
    })

    let message = `🗓️ Estas son las actividades de *la semana*:\n\n`
    const daysSorted = Object.keys(groupedByDay).sort()

    if (daysSorted.length === 0) {
      message += '🙁 No hay actividades programadas para esta semana.'
      await WhatsAppService.sendTextMessage(phoneNumber, message)
      return WhatsAppService.sendTextMessage(phoneNumber, returnToMainMenu())
    } else {
      const allWeekEvents: any[] = []
      let counter = 1

      for (const day of daysSorted) {
        const dayLabel = format(new Date(day), 'EEEE dd/MM', { locale: es })
        message += `📅 *${dayLabel}*\n`

        groupedByDay[day].forEach(event => {
          const teacher = event.event_teachers?.find((t: any) => t.is_primary_teacher)?.teacher?.name
          message += `${counter}. *${event.title}*\n📍 ${event.address || 'Sin dirección'}\n🕒 ${event.event_schedules?.[0]?.start_time || 'Sin hora'}\n👤 ${teacher || 'Por confirmar'}\n\n`
          
          allWeekEvents.push(event)
          counter++
        })
      }

      tempEventData.set(phoneNumber, {
        events: allWeekEvents,
        context: 'week'
      })

      userStates.set(phoneNumber, ChatState.MENU_WEEK_DETAILS)
      
      message += `📋 *Selecciona un número (1-${allWeekEvents.length}) para ver más detalles*\n🏠 *Presiona 0 para volver al menú principal*`
    }

    return WhatsAppService.sendTextMessage(phoneNumber, message)
  } catch (err) {
    console.error('❌ Excepción en caseWeek:', err)
    await WhatsAppService.sendTextMessage(phoneNumber, '⚠️ Ocurrió un error inesperado.')
    return
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
  if (isNaN(selectedNumber) || selectedNumber < 1 || selectedNumber > tempData.events.length) {
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

async function showEventDetails(phoneNumber: string, event: any) {
  const teacher = event.event_teachers?.find((t: any) => t.is_primary_teacher)?.teacher
  const schedule = event.event_schedules?.[0]

  let message = `🎭 *${event.title || 'Evento sin título'}*\n\n`

  if (event.description) {
    message += `📝 *Descripción:*\n${event.description}\n\n`
  }

  if (event.event_type) {
    const eventTypeLabels: Record<string, string> = {
      'class': 'Clase',
      'milonga': 'Milonga',
      'practice': 'Práctica',
      'seminar': 'Seminario',
      'special_event': 'Evento Especial'
    }
    message += `🎪 *Tipo:* ${eventTypeLabels[event.event_type] || event.event_type}\n`
  }

  if (event.class_level) {
    const levelLabels: Record<string, string> = {
      'beginner': 'Principiante',
      'intermediate': 'Intermedio',
      'advanced': 'Avanzado',
      'all_levels': 'Todos los niveles'
    }
    message += `📊 *Nivel:* ${levelLabels[event.class_level] || event.class_level}\n`
  }

  if (event.price !== undefined && event.price !== null) {
    message += `💰 *Precio:* $${event.price}\n`
  } else {
    message += `💰 *Precio:* Consultar\n`
  }

  if (teacher?.name) {
    message += `👤 *Profesor:* ${teacher.name}\n`
  } else {
    message += `👤 *Profesor:* Por confirmar\n`
  }

  if (schedule) {
    if (schedule.start_time) {
      message += `🕒 *Horario:* ${schedule.start_time}`
      if (schedule.end_time) {
        message += ` - ${schedule.end_time}`
      }
      message += `\n`
    }

    if (schedule.recurrence_pattern && schedule.recurrence_pattern !== 'none') {
      message += `🔄 *Recurrencia:* `
      switch (schedule.recurrence_pattern) {
        case 'weekly':
          message += 'Semanal'
          if (schedule.days_of_week && schedule.days_of_week.length > 0) {
            const dayLabels: Record<string, string> = {
              'monday': 'Lunes',
              'tuesday': 'Martes', 
              'wednesday': 'Miércoles',
              'thursday': 'Jueves',
              'friday': 'Viernes',
              'saturday': 'Sábado',
              'sunday': 'Domingo'
            }
            const days = schedule.days_of_week.map((day: string) => dayLabels[day] || day).join(', ')
            message += ` (${days})`
          }
          break
        case 'daily':
          message += 'Diaria'
          break
        case 'monthly':
          message += 'Mensual'
          break
        default:
          message += schedule.recurrence_pattern
      }
      message += `\n`
    }
  }

  if (event.address) {
    message += `📍 *Dirección:* ${event.address}\n`
  }

  if (event.has_limited_capacity && event.max_capacity) {
    const available = event.max_capacity - event.current_attendees
    message += `👥 *Capacidad:* ${event.current_attendees}/${event.max_capacity} (${available} disponibles)\n`
  }

  return WhatsAppService.sendTextMessage(phoneNumber, message)
}