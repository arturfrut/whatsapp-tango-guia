import { supabase } from '../../config/supabase'
import { WhatsAppService } from '../../services/whatsapp'
import { ChatState } from '../../types/processTangoConversation'
import { filterEventsByDateRange } from '../../utils/eventFiltering'
import { returnToMainMenu } from './utils'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'

export const caseToday = async (
  userStates: Map<string, any>,
  phoneNumber: string
) => {
  userStates.set(phoneNumber, 'MENU_TODAY')

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

    // Usar la lógica unificada
    const filteredEvents = events ? filterEventsByDateRange(events, today) : []

    let message = `🎉 Estas son las actividades de *hoy*:\n\n`

    if (filteredEvents.length === 0) {
      message += '🙁 No hay actividades programadas para hoy.'
    } else {
      filteredEvents.forEach((event: any) => {
        const teacher = event.event_teachers?.find(
          (t: any) => t.is_primary_teacher
        )?.teacher?.name
        const startTime = event.event_schedules?.[0]?.start_time || 'Sin hora'
        message += `👉 *${event.title || 'Evento'}*\n🕒 ${startTime}\n👤 ${
          teacher || 'Por confirmar'
        }\n📍 ${event.address || 'Sin dirección'}\n\n`
      })
    }

    await WhatsAppService.sendTextMessage(phoneNumber, message)
    return WhatsAppService.sendTextMessage(phoneNumber, returnToMainMenu())
  } catch (err) {
    console.error('❌ Excepción en caseToday:', err)
  }
}

export const caseWeek = async (
  userStates: Map<string, ChatState>,
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

    const weekEvents = events
      ? filterEventsByDateRange(events, today, endOfWeek)
      : []

    console.log('✅ Eventos filtrados para la semana:', weekEvents)

    const groupedByDay: Record<string, any[]> = {}

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(today, i))

    weekDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd')

      weekEvents.forEach((event: any) => {
        const eventOccursOnDay = event.event_schedules?.some(
          (schedule: any) => {
            if (
              schedule.recurrence_pattern === 'none' ||
              !schedule.recurrence_pattern
            ) {
              return (
                format(new Date(schedule.start_date), 'yyyy-MM-dd') === dayKey
              )
            }

            if (
              schedule.recurrence_pattern === 'weekly' &&
              schedule.days_of_week
            ) {
              const dayName = day
                .toLocaleDateString('en-US', { weekday: 'long' })
                .toLowerCase()
              const startDate = new Date(schedule.start_date)
              return day >= startDate && schedule.days_of_week.includes(dayName)
            }

            return false
          }
        )

        if (eventOccursOnDay) {
          if (!groupedByDay[dayKey]) groupedByDay[dayKey] = []
          groupedByDay[dayKey].push({
            title: event.title || 'Evento',
            address: event.address || 'Dirección no disponible',
            start_time: event.event_schedules?.[0]?.start_time || 'Sin hora'
          })
        }
      })
    })

    let message = `🗓️ Estas son las actividades de *la semana*:\n\n`
    let counter = 1

    const daysSorted = Object.keys(groupedByDay).sort()

    if (daysSorted.length === 0) {
      message += '🙁 No hay actividades programadas para esta semana.'
    } else {
      for (const day of daysSorted) {
        const dayLabel = format(new Date(day), 'EEEE dd/MM', { locale: es })
        message += `📅 *${dayLabel}*\n`

        groupedByDay[day].forEach(event => {
          message += `${counter}. *${event.title}*\n📍 ${event.address}\n🕒 ${event.start_time}\n\n`
          counter++
        })
      }
    }

    await WhatsAppService.sendTextMessage(phoneNumber, message)
    return WhatsAppService.sendTextMessage(phoneNumber, returnToMainMenu())
  } catch (err) {
    console.error('❌ Excepción en caseWeek:', err)
    await WhatsAppService.sendTextMessage(
      phoneNumber,
      '⚠️ Ocurrió un error inesperado.'
    )
    return
  }
}
