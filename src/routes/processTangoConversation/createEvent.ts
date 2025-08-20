import { WhatsAppService } from '../../services/whatsapp'
import { DatabaseService } from '../../services/database'
import {
  ChatState,
  NewEventData
} from '../../types/processTangoConversation'
import { parseDate, parseTime } from './utils'

const tempData = new Map<string, NewEventData>()

export const handleEventCreation = async (
  userStates: Map<string, ChatState>,
  phoneNumber: string,
  messageContent: string
) => {
  const normalizedMessage = messageContent.trim().toLowerCase()
  const currentState = userStates.get(phoneNumber)

  switch (currentState) {
    case ChatState.SPECIAL_MENU:
      return handleSpecialMenuOptions(userStates, phoneNumber, normalizedMessage)

    case ChatState.CREATE_EVENT_TITLE:
      return handleEventTitle(userStates, phoneNumber, messageContent)

    case ChatState.CREATE_EVENT_DESCRIPTION:
      return handleEventDescription(userStates, phoneNumber, messageContent)

    case ChatState.CREATE_EVENT_LEVEL:
      return handleEventLevel(userStates, phoneNumber, messageContent)

    case ChatState.CREATE_EVENT_PRICE:
      return handleEventPrice(userStates, phoneNumber, messageContent)

    case ChatState.CREATE_EVENT_ADDRESS:
      return handleEventAddress(userStates, phoneNumber, messageContent)

    case ChatState.CREATE_EVENT_DATE:
      return handleEventDate(userStates, phoneNumber, messageContent)

    case ChatState.CREATE_EVENT_TIME:
      return handleEventTime(userStates, phoneNumber, messageContent)

    case ChatState.CREATE_EVENT_RECURRENCE:
      return handleEventRecurrence(userStates, phoneNumber, messageContent)

    case ChatState.CREATE_EVENT_DAY_OF_WEEK:
      return handleEventDayOfWeek(userStates, phoneNumber, messageContent)

    case ChatState.CREATE_EVENT_CONFIRMATION:
      return handleEventConfirmation(userStates, phoneNumber, messageContent)

    default:
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `😅 Algo salió mal, volvamos a empezar.`
      )
  }
}

async function handleSpecialMenuOptions(
  userStates: Map<string, ChatState>,
  phoneNumber: string,
  normalizedMessage: string
) {
  if (['1', 'clase'].includes(normalizedMessage)) {
    const eventData: NewEventData = { event_type: 'class' }
    tempData.set(phoneNumber, eventData)
    return startEventCreation(userStates, phoneNumber, eventData)
  } else if (['2', 'milonga'].includes(normalizedMessage)) {
    const eventData: NewEventData = { event_type: 'milonga' }
    tempData.set(phoneNumber, eventData)
    return startEventCreation(userStates, phoneNumber, eventData)
  } else if (['3', 'seminario'].includes(normalizedMessage)) {
    const eventData: NewEventData = { event_type: 'seminar' }
    tempData.set(phoneNumber, eventData)
    return startEventCreation(userStates, phoneNumber, eventData)
  } else if (['4', 'práctica', 'practica'].includes(normalizedMessage)) {
    const eventData: NewEventData = { event_type: 'practice' }
    tempData.set(phoneNumber, eventData)
    return startEventCreation(userStates, phoneNumber, eventData)
  } else if (['5', 'evento especial', 'especial'].includes(normalizedMessage)) {
    const eventData: NewEventData = { event_type: 'special_event' }
    tempData.set(phoneNumber, eventData)
    return startEventCreation(userStates, phoneNumber, eventData)
  } else if (['6', 'modificar'].includes(normalizedMessage)) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `🛠️ Modificar evento (en desarrollo)...`
    )
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Opción inválida. Elegí una opción del menú (1-6).`
    )
  }
}

async function startEventCreation(
  userStates: Map<string, ChatState>,
  phoneNumber: string,
  eventData: NewEventData
) {
  userStates.set(phoneNumber, ChatState.CREATE_EVENT_TITLE)

  const eventTypeNames: Record<string, string> = {
    class: 'clase',
    milonga: 'milonga',
    seminar: 'seminario',
    practice: 'práctica',
    special_event: 'evento especial'
  }

  const typeName = eventTypeNames[eventData.event_type || '']

  return WhatsAppService.sendTextMessage(
    phoneNumber,
    `📝 Crear ${typeName}

¿Cuál es el título de tu ${typeName}?
*Ejemplo:* "Clase de Tango Nivel Principiantes" o "Milonga de los Viernes"`
  )
}

async function handleEventTitle(
  userStates: Map<string, ChatState>,
  phoneNumber: string,
  messageContent: string
) {
  if (messageContent.trim().length < 3) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❌ El título debe tener al menos 3 caracteres.
      
*Ejemplo:* "Clase de Tango Nivel Principiantes"`
    )
  }

  const eventData = tempData.get(phoneNumber) as NewEventData
  eventData.title = messageContent.trim()
  tempData.set(phoneNumber, eventData)
  userStates.set(phoneNumber, ChatState.CREATE_EVENT_DESCRIPTION)

  return WhatsAppService.sendTextMessage(
    phoneNumber,
    `✅ Título: *${eventData.title}*

Ahora describe tu evento *(opcional)*
Puedes incluir detalles importantes para los participantes.

*Ejemplo:* "Clase enfocada en técnica básica y musicalidad. Ideal para quienes recién empiezan."

Escribe "saltar" si no quieres agregar descripción.`
  )
}

async function handleEventDescription(
  userStates: Map<string, ChatState>,
  phoneNumber: string,
  messageContent: string
) {
  const eventData = tempData.get(phoneNumber) as NewEventData

  if (!['saltar', 'skip', 'no'].includes(messageContent.trim().toLowerCase())) {
    eventData.description = messageContent.trim()
  }

  tempData.set(phoneNumber, eventData)

  // Si es una clase, preguntar nivel
  if (eventData.event_type === 'class') {
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_LEVEL)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `📈 ¿Cuál es el nivel de la clase? *(opcional)*

1 - Principiante
2 - Intermedio  
3 - Avanzado
4 - Todos los niveles
5 - Saltar (no especificar nivel)`
    )
  } else {
    // Si no es clase, ir directo al precio
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_PRICE)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `💰 ¿Cuál es el precio? *(opcional)*

*Formato:* Solo el número
*Ejemplo:* 5000 (para $5000)

Escribe "gratis" si es gratuito o "saltar" si no quieres especificar precio.`
    )
  }
}

async function handleEventLevel(
  userStates: Map<string, ChatState>,
  phoneNumber: string,
  messageContent: string
) {
  const eventData = tempData.get(phoneNumber) as NewEventData
  const normalizedMessage = messageContent.trim().toLowerCase()

  const levelMap: Record<string, string> = {
    '1': 'beginner',
    principiante: 'beginner',
    '2': 'intermediate',
    intermedio: 'intermediate',
    '3': 'advanced',
    avanzado: 'advanced',
    '4': 'all_levels',
    todos: 'all_levels',
    '5': 'skip',
    saltar: 'skip',
    skip: 'skip'
  }

  if (levelMap[normalizedMessage]) {
    if (levelMap[normalizedMessage] !== 'skip') {
      eventData.class_level = levelMap[normalizedMessage]
    }

    tempData.set(phoneNumber, eventData)
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_PRICE)

    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `💰 ¿Cuál es el precio? *(opcional)*

*Formato:* Solo el número
*Ejemplo:* 5000 (para $5000)

Escribe "gratis" si es gratuito o "saltar" si no quieres especificar precio.`
    )
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Opción inválida. Elegí una opción (1-5):

1 - Principiante
2 - Intermedio  
3 - Avanzado
4 - Todos los niveles
5 - Saltar`
    )
  }
}

async function handleEventPrice(
  userStates: Map<string, ChatState>,
  phoneNumber: string,
  messageContent: string
) {
  const eventData = tempData.get(phoneNumber) as NewEventData
  const normalizedMessage = messageContent.trim().toLowerCase()

  if (['saltar', 'skip', 'no'].includes(normalizedMessage)) {
    // No se especifica precio
  } else if (['gratis', 'gratuito', 'free', '0'].includes(normalizedMessage)) {
    eventData.price = 0
  } else {
    // Intentar parsear como número
    const price = parseFloat(messageContent.replace(/[^\d.]/g, ''))
    if (isNaN(price) || price < 0) {
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `❌ Precio inválido. 

*Formato:* Solo el número
*Ejemplo:* 5000

O escribe "gratis" o "saltar"`
      )
    }
    eventData.price = price
  }

  tempData.set(phoneNumber, eventData)
  userStates.set(phoneNumber, ChatState.CREATE_EVENT_ADDRESS)

  return WhatsAppService.sendTextMessage(
    phoneNumber,
    `📍 ¿Dónde se realizará?

Incluye la dirección completa para que sea fácil de encontrar.

*Ejemplo:* "Av. Colón 1234, Mar del Plata" o "Centro Cultural Municipal - Güemes 2020"`
  )
}

async function handleEventAddress(
  userStates: Map<string, ChatState>,
  phoneNumber: string,
  messageContent: string
) {
  if (messageContent.trim().length < 5) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❌ La dirección debe ser más específica.

*Ejemplo:* "Av. Colón 1234, Mar del Plata"`
    )
  }

  const eventData = tempData.get(phoneNumber) as NewEventData
  eventData.address = messageContent.trim()
  tempData.set(phoneNumber, eventData)
  userStates.set(phoneNumber, ChatState.CREATE_EVENT_DATE)

  return WhatsAppService.sendTextMessage(
    phoneNumber,
    `📅 ¿Qué fecha?

*Formatos aceptados:*
• 15/12/2024
• 15-12-2024  
• 15 de diciembre
• mañana
• hoy

*Ejemplo:* 20/12/2024`
  )
}

async function handleEventDate(
  userStates: Map<string, ChatState>,
  phoneNumber: string,
  messageContent: string
) {
  try {
    const dateStr = parseDate(messageContent.trim())

    if (!dateStr) {
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `❌ Fecha inválida.

*Formatos aceptados:*
• 15/12/2024
• 15-12-2024  
• 15 de diciembre
• mañana
• hoy

*Ejemplo:* 20/12/2024`
      )
    }

    const eventData = tempData.get(phoneNumber) as NewEventData
    if (!eventData) {
      console.error('No event data found for phone:', phoneNumber)
      userStates.set(phoneNumber, ChatState.START)
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `😅 Algo salió mal, volvamos a empezar.`
      )
    }

    eventData.date = dateStr
    tempData.set(phoneNumber, eventData)
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_TIME)

    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `🕐 ¿A qué hora?

*Formatos aceptados:*
• 20:30
• 8:30 PM
• 8.30
• 8 y media

*Ejemplo:* 20:30`
    )
  } catch (error) {
    console.error('Error in handleEventDate:', error)
    userStates.set(phoneNumber, ChatState.START)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `😅 Ocurrió un error. Volvamos a empezar.`
    )
  }
}

async function handleEventTime(
  userStates: Map<string, ChatState>,
  phoneNumber: string,
  messageContent: string
) {
  try {
    const timeStr = parseTime(messageContent.trim())

    if (!timeStr) {
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `❌ Hora inválida.

*Formatos aceptados:*
• 20:30
• 8:30 PM  
• 8.30
• 8 y media`
      )
    }

    const eventData = tempData.get(phoneNumber) as NewEventData
    if (!eventData) {
      console.error('No event data found for phone:', phoneNumber)
      userStates.set(phoneNumber, ChatState.START)
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `😅 Algo salió mal, volvamos a empezar.`
      )
    }

    eventData.time = timeStr
    tempData.set(phoneNumber, eventData)
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_RECURRENCE)

    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `🔄 ¿Esta ${
        eventData.event_type === 'class' ? 'clase' : 'actividad'
      } se repite todas las semanas?

*Recordá que una vez al mes te llegará un recordatorio para que confirmes si seguís dando la ${
        eventData.event_type === 'class' ? 'clase' : 'actividad'
      }.*

1 - Sí, se repite semanalmente
2 - No, es solo esta vez`
    )
  } catch (error) {
    console.error('Error in handleEventTime:', error)
    userStates.set(phoneNumber, ChatState.START)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `😅 Ocurrió un error. Volvamos a empezar.`
    )
  }
}

async function handleEventRecurrence(
  userStates: Map<string, ChatState>,
  phoneNumber: string,
  messageContent: string
) {
  const eventData = tempData.get(phoneNumber) as NewEventData
  const normalizedMessage = messageContent.trim().toLowerCase()

  if (['1', 'si', 'sí', 'yes', 'repite'].includes(normalizedMessage)) {
    eventData.has_recurrence = true
    tempData.set(phoneNumber, eventData)
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_DAY_OF_WEEK)

    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `📅 ¿Qué día de la semana?

1 - Lunes
2 - Martes
3 - Miércoles  
4 - Jueves
5 - Viernes
6 - Sábado
7 - Domingo`
    )
  } else if (['2', 'no'].includes(normalizedMessage)) {
    eventData.has_recurrence = false
    tempData.set(phoneNumber, eventData)
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_CONFIRMATION)

    return showEventConfirmation(phoneNumber, eventData)
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Por favor responde:
1 - Sí, se repite semanalmente
2 - No, es solo esta vez`
    )
  }
}

async function handleEventDayOfWeek(
  userStates: Map<string, ChatState>,
  phoneNumber: string,
  messageContent: string
) {
  const eventData = tempData.get(phoneNumber) as NewEventData
  const normalizedMessage = messageContent.trim().toLowerCase()

  const dayMap: Record<string, string> = {
    '1': 'monday',
    lunes: 'monday',
    '2': 'tuesday',
    martes: 'tuesday',
    '3': 'wednesday',
    miércoles: 'wednesday',
    miercoles: 'wednesday',
    '4': 'thursday',
    jueves: 'thursday',
    '5': 'friday',
    viernes: 'friday',
    '6': 'saturday',
    sábado: 'saturday',
    sabado: 'saturday',
    '7': 'sunday',
    domingo: 'sunday'
  }

  if (dayMap[normalizedMessage]) {
    eventData.day_of_week = dayMap[normalizedMessage]
    tempData.set(phoneNumber, eventData)
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_CONFIRMATION)

    return showEventConfirmation(phoneNumber, eventData)
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Día inválido. Elegí una opción (1-7):

1 - Lunes  2 - Martes  3 - Miércoles
4 - Jueves  5 - Viernes  6 - Sábado  7 - Domingo`
    )
  }
}

async function showEventConfirmation(
  phoneNumber: string,
  eventData: NewEventData
) {
  const eventTypeNames: Record<string, string> = {
    class: 'Clase',
    milonga: 'Milonga',
    seminar: 'Seminario',
    practice: 'Práctica',
    special_event: 'Evento Especial'
  }

  const levelNames: Record<string, string> = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
    all_levels: 'Todos los niveles'
  }

  const dayNames: Record<string, string> = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
  }

  let confirmationText = `📋 *CONFIRMACIÓN DEL EVENTO*

🎭 *Tipo:* ${eventTypeNames[eventData.event_type || '']}
📝 *Título:* ${eventData.title}`

  if (eventData.description) {
    confirmationText += `\n💬 *Descripción:* ${eventData.description}`
  }

  if (eventData.class_level) {
    confirmationText += `\n📈 *Nivel:* ${levelNames[eventData.class_level]}`
  }

  if (eventData.price !== undefined) {
    confirmationText += `\n💰 *Precio:* ${
      eventData.price === 0 ? 'Gratuito' : `${eventData.price}`
    }`
  }

  confirmationText += `\n📍 *Dirección:* ${eventData.address}
📅 *Fecha:* ${eventData.date}
🕐 *Hora:* ${eventData.time}`

  if (eventData.has_recurrence && eventData.day_of_week) {
    confirmationText += `\n🔄 *Se repite:* Todos los ${
      dayNames[eventData.day_of_week]
    }`
  }

  confirmationText += `\n\n¿Confirmas que todos los datos están correctos?
1 - ✅ Sí, crear el evento
2 - ❌ No, quiero modificar algo`

  return WhatsAppService.sendTextMessage(phoneNumber, confirmationText)
}

async function handleEventConfirmation(
  userStates: Map<string, ChatState>,
  phoneNumber: string,
  messageContent: string
) {
  const eventData = tempData.get(phoneNumber) as NewEventData
  const normalizedMessage = messageContent.trim().toLowerCase()

  if (['1', 'si', 'sí', 'confirmo', 'yes'].includes(normalizedMessage)) {
    // Crear evento en la base de datos
    const newEvent = await DatabaseService.createEvent(phoneNumber, {
      event_type: eventData.event_type!,
      title: eventData.title!,
      description: eventData.description,
      class_level: eventData.class_level,
      price: eventData.price,
      address: eventData.address!,
      date: eventData.date!,
      time: eventData.time!,
      has_recurrence: eventData.has_recurrence!,
      day_of_week: eventData.day_of_week
    })

    tempData.delete(phoneNumber)

    const eventTypeNames: Record<string, string> = {
      class: 'clase',
      milonga: 'milonga',
      seminar: 'seminario',
      practice: 'práctica',
      special_event: 'evento especial'
    }

    if (newEvent) {
      userStates.set(phoneNumber, ChatState.SPECIAL_MENU)
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `🎉 ¡Excelente! Tu ${eventTypeNames[eventData.event_type || '']} *"${
          eventData.title
        }"* ha sido creada exitosamente.

${
  eventData.has_recurrence
    ? '🔔 Recordatorio: Una vez al mes te llegará una notificación para confirmar si seguís dando esta actividad.'
    : ''
}

📋 ¿Te gustaría crear otra actividad?

1 - Crear *clase*
2 - Crear *milonga*
3 - Crear *seminario*
4 - Crear *práctica*  
5 - Crear *evento especial*
6 - Modificar un *evento*`
      )
    } else {
      userStates.set(phoneNumber, ChatState.START)
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `❌ Ocurrió un error al crear tu ${
          eventTypeNames[eventData.event_type || '']
        }.

Por favor intenta nuevamente más tarde o contacta al administrador.`
      )
    }
  } else if (['2', 'no', 'modificar'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_TITLE)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `🔄 Perfecto, empecemos de nuevo con el evento.

¿Cuál es el título de tu evento?
*Ejemplo:* "Clase de Tango Nivel Principiantes"`
    )
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Por favor responde:
1 - Sí, crear el evento
2 - No, modificar datos`
    )
  }
}

export const showSpecialMenu = async (
  userStates: Map<string, ChatState>,
  phoneNumber: string
) => {
  userStates.set(phoneNumber, ChatState.SPECIAL_MENU)
  return WhatsAppService.sendTextMessage(
    phoneNumber,
    `📋 ¿Qué te gustaría hacer?

1 - Crear *clase*
2 - Crear *milonga*
3 - Crear *seminario*
4 - Crear *práctica*  
5 - Crear *evento especial*
6 - Modificar un *evento*`
  )
}