import { WhatsAppService } from '../../services/whatsapp'
import { DatabaseService } from '../../services/database'
import {
  ChatState,
  NewEventData,
  EventType,
  ClassLevel
} from '../../types/processTangoConversation'
import { parseDate, parseTime } from './utils'

export const handleNewEventCreation = async (
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,
  phoneNumber: string,
  messageContent: string
) => {
  const currentState = userStates.get(phoneNumber)
  const normalizedMessage = messageContent.trim().toLowerCase()

  if (normalizedMessage === '0' || normalizedMessage === 'volver') {
    return handleGoBack(userStates, phoneNumber)
  }

  if (normalizedMessage === 'salir' || normalizedMessage === 'cancelar') {
    return handleExitCreation(userStates, tempData, phoneNumber)
  }

  switch (currentState) {
    case ChatState.SPECIAL_MENU:
      return handleSpecialMenuOptions(
        userStates,
        tempData,
        phoneNumber,
        normalizedMessage
      )

    case ChatState.CREATE_EVENT_TITLE:
      return handleEventTitle(userStates, tempData, phoneNumber, messageContent)

    case ChatState.CREATE_EVENT_VENUE:
      return handleEventVenue(userStates, tempData, phoneNumber, messageContent)

    case ChatState.CREATE_EVENT_ADDRESS:
      return handleEventAddress(
        userStates,
        tempData,
        phoneNumber,
        messageContent
      )

    case ChatState.CREATE_EVENT_DATE:
      return handleEventDate(userStates, tempData, phoneNumber, messageContent)

    // Class specific states
    case ChatState.CREATE_CLASS_SINGLE_OR_MULTIPLE:
      return handleClassSingleOrMultiple(
        userStates,
        tempData,
        phoneNumber,
        normalizedMessage
      )

    case ChatState.CREATE_CLASS_TIME:
      return handleClassTime(userStates, tempData, phoneNumber, messageContent)

    case ChatState.CREATE_CLASS_LEVEL:
      return handleClassLevel(
        userStates,
        tempData,
        phoneNumber,
        normalizedMessage
      )

    case ChatState.CREATE_CLASS_ADD_ANOTHER:
      return handleClassAddAnother(
        userStates,
        tempData,
        phoneNumber,
        normalizedMessage
      )

    case ChatState.CREATE_CLASS_PRACTICE:
      return handleClassPractice(
        userStates,
        tempData,
        phoneNumber,
        normalizedMessage
      )

    case ChatState.CREATE_CLASS_PRACTICE_TIME:
      return handleClassPracticeTime(
        userStates,
        tempData,
        phoneNumber,
        messageContent
      )

    // Milonga specific states
    case ChatState.CREATE_MILONGA_TIME:
      return handleMilongaTime(
        userStates,
        tempData,
        phoneNumber,
        messageContent
      )

    case ChatState.CREATE_MILONGA_PRE_CLASS:
      return handleMilongaPreClass(
        userStates,
        tempData,
        phoneNumber,
        normalizedMessage
      )

    case ChatState.CREATE_MILONGA_PRE_CLASS_DETAILS:
      return handleMilongaPreClassDetails(
        userStates,
        tempData,
        phoneNumber,
        messageContent
      )

    case ChatState.CREATE_MILONGA_SHOW:
      return handleMilongaShow(
        userStates,
        tempData,
        phoneNumber,
        messageContent
      )

    case ChatState.CREATE_SPECIAL_TIME:
      return handleSpecialTime(
        userStates,
        tempData,
        phoneNumber,
        messageContent
      )

    case ChatState.CREATE_EVENT_ORGANIZERS:
      return handleEventOrganizers(userStates, tempData, phoneNumber)

    case ChatState.CREATE_EVENT_ORGANIZER_SELF:
      return handleOrganizerSelf(
        userStates,
        tempData,
        phoneNumber,
        normalizedMessage
      )

    case ChatState.CREATE_EVENT_ORGANIZER_ADDITIONAL:
      return handleOrganizerAdditional(
        userStates,
        tempData,
        phoneNumber,
        normalizedMessage
      )

    case ChatState.CREATE_EVENT_ORGANIZER_SEARCH:
      return handleOrganizerSearch(
        userStates,
        tempData,
        phoneNumber,
        messageContent
      )

    case ChatState.CREATE_EVENT_ORGANIZER_SELECT:
      return handleOrganizerSelect(
        userStates,
        tempData,
        phoneNumber,
        normalizedMessage
      )

    case ChatState.CREATE_EVENT_ORGANIZER_ONE_TIME:
      return handleOrganizerOneTime(
        userStates,
        tempData,
        phoneNumber,
        messageContent
      )

    case ChatState.CREATE_EVENT_RECURRENCE:
      return handleEventRecurrence(
        userStates,
        tempData,
        phoneNumber,
        normalizedMessage
      )

    case ChatState.CREATE_EVENT_CONTACT:
      return handleEventContact(
        userStates,
        tempData,
        phoneNumber,
        normalizedMessage
      )

    case ChatState.CREATE_EVENT_CONTACT_NUMBER:
      return handleEventContactNumber(
        userStates,
        tempData,
        phoneNumber,
        messageContent
      )

    case ChatState.CREATE_EVENT_REMINDER:
      return handleEventReminder(
        userStates,
        tempData,
        phoneNumber,
        normalizedMessage
      )

    case ChatState.CREATE_EVENT_REMINDER_NUMBER:
      return handleEventReminderNumber(
        userStates,
        tempData,
        phoneNumber,
        messageContent
      )

    case ChatState.CREATE_EVENT_DESCRIPTION:
      return handleEventDescription(
        userStates,
        tempData,
        phoneNumber,
        messageContent
      )

    case ChatState.CREATE_EVENT_PRICING:
      return handleEventPricing(
        userStates,
        tempData,
        phoneNumber,
        messageContent
      )

    case ChatState.CREATE_EVENT_PRICING_DETAILS:
      return handleEventPricingDetails(
        userStates,
        tempData,
        phoneNumber,
        messageContent
      )

    case ChatState.CREATE_EVENT_CONFIRMATION:
      return handleEventConfirmation(
        userStates,
        tempData,
        phoneNumber,
        normalizedMessage
      )

    default:
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `😅 Algo salió mal, volvamos a empezar.`
      )
  }
}

async function handleSpecialMenuOptions(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,
  phoneNumber: string,
  normalizedMessage: string
) {
  const eventTypeMap: Record<string, EventType> = {
    '1': 'class',
    clase: 'class',
    '2': 'milonga',
    milonga: 'milonga',
    '3': 'seminar',
    seminario: 'seminar',
    '4': 'special_event',
    'evento especial': 'special_event',
    especial: 'special_event'
  }

  if (eventTypeMap[normalizedMessage]) {
    const eventData: NewEventData = {
      event_type: eventTypeMap[normalizedMessage],
      organizers: [],
      classes: [],
      pricing: []
    }
    tempData.set(phoneNumber, eventData)
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_TITLE)

    const eventTypeNames = {
      class: 'clase',
      milonga: 'milonga',
      seminar: 'seminario',
      special_event: 'evento especial'
    }

    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `📝 *Crear ${eventTypeNames[eventData.event_type!]}*

¿Cuál es el título?

*Ejemplo:* "Clase de Tango Principiantes" o "Milonga de los Viernes"

_Envía "0" para volver o "salir" para cancelar_`
    )
  } else if (['5', 'modificar'].includes(normalizedMessage)) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `🛠️ Modificar evento (en desarrollo)...`
    )
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Opción inválida. Elegí una opción del menú (1-5).`
    )
  }
}

async function handleEventTitle(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,
  phoneNumber: string,
  messageContent: string
) {
  if (messageContent.trim().length < 3) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❌ El título debe tener al menos 3 caracteres.

*Ejemplo:* "Clase de Tango Principiantes"

_Envía "0" para volver_`
    )
  }

  const eventData = tempData.get(phoneNumber)!
  eventData.title = messageContent.trim()
  tempData.set(phoneNumber, eventData)
  userStates.set(phoneNumber, ChatState.CREATE_EVENT_VENUE)

  return WhatsAppService.sendTextMessage(
    phoneNumber,
    `✅ Título: *${eventData.title}*

¿Cuál es el nombre del lugar?

*Ejemplo:* "UADE" o "Centro Cultural"

_Envía "0" para volver_`
  )
}

async function handleEventVenue(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,
  phoneNumber: string,
  messageContent: string
) {
  if (messageContent.trim().length < 2) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❌ El nombre del lugar debe ser más específico.

*Ejemplo:* "UADE" o "Centro Cultural"

_Envía "0" para volver_`
    )
  }

  const eventData = tempData.get(phoneNumber)!
  eventData.venue_name = messageContent.trim()
  tempData.set(phoneNumber, eventData)
  userStates.set(phoneNumber, ChatState.CREATE_EVENT_ADDRESS)

  return WhatsAppService.sendTextMessage(
    phoneNumber,
    `✅ Lugar: *${eventData.venue_name}*

¿Cuál es la dirección completa?

*Ejemplo:* "Magallanes 2025, Mar del Plata"

_Envía "0" para volver_`
  )
}

async function handleEventAddress(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,
  phoneNumber: string,
  messageContent: string
) {
  if (messageContent.trim().length < 5) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❌ La dirección debe ser más completa.

*Ejemplo:* "Magallanes 2025, Mar del Plata"

_Envía "0" para volver_`
    )
  }

  const eventData = tempData.get(phoneNumber)!
  eventData.address = messageContent.trim()
  tempData.set(phoneNumber, eventData)
  userStates.set(phoneNumber, ChatState.CREATE_EVENT_DATE)

  return WhatsAppService.sendTextMessage(
    phoneNumber,
    `✅ Dirección: *${eventData.address}*

¿Qué fecha?

*Formatos:*
• 15/12/2024
• 15-12-2024  
• 15 de diciembre
• mañana
• hoy

_Envía "0" para volver_`
  )
}

// Event date handler
async function handleEventDate(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,
  phoneNumber: string,
  messageContent: string
) {
  const dateStr = parseDate(messageContent.trim())

  if (!dateStr) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❌ Fecha inválida.

*Formatos:*
• 15/12/2024
• 15-12-2024  
• 15 de diciembre
• mañana
• hoy

_Envía "0" para volver_`
    )
  }

  const eventData = tempData.get(phoneNumber)!
  eventData.date = dateStr
  tempData.set(phoneNumber, eventData)

  switch (eventData.event_type) {
    case 'class':
      userStates.set(phoneNumber, ChatState.CREATE_CLASS_SINGLE_OR_MULTIPLE)
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `✅ Fecha: *${dateStr}*

¿Es clase única o hay varias clases?

1 - Una sola clase
2 - Varias clases

_Envía "0" para volver_`
      )

    case 'milonga':
      userStates.set(phoneNumber, ChatState.CREATE_MILONGA_TIME)
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `✅ Fecha: *${dateStr}*

¿A qué hora empieza la milonga?

*Formato:* 20:30

_Envía "0" para volver_`
      )

    case 'special_event':
      userStates.set(phoneNumber, ChatState.CREATE_SPECIAL_TIME)
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `✅ Fecha: *${dateStr}*

¿A qué hora?

*Formato:* 20:30

_Envía "0" para volver_`
      )

    case 'seminar':
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `🚧 Los seminarios están en desarrollo...

_Envía "0" para volver_`
      )

    default:
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `❌ Tipo de evento no válido.

_Envía "0" para volver_`
      )
  }
}

async function handleClassSingleOrMultiple(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,
  phoneNumber: string,
  normalizedMessage: string
) {
  const eventData = tempData.get(phoneNumber)!

  if (['1', 'una', 'unica', 'única', 'sola'].includes(normalizedMessage)) {
    eventData.classes = [{ start_time: '' }]
    eventData.current_class_index = 0
    tempData.set(phoneNumber, eventData)
    userStates.set(phoneNumber, ChatState.CREATE_CLASS_TIME)

    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `¿A qué hora es la clase?

*Formato:* 20:30

_Envía "0" para volver_`
    )
  } else if (
    ['2', 'varias', 'multiples', 'múltiples'].includes(normalizedMessage)
  ) {
    eventData.classes = [{ start_time: '' }]
    eventData.current_class_index = 0
    tempData.set(phoneNumber, eventData)
    userStates.set(phoneNumber, ChatState.CREATE_CLASS_TIME)

    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `¿A qué hora es la primera clase?

*Formato:* 20:30

_Envía "0" para volver_`
    )
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Por favor responde:

1 - Una sola clase
2 - Varias clases

_Envía "0" para volver_`
    )
  }
}

async function handleClassTime(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,
  phoneNumber: string,
  messageContent: string
) {
  const timeStr = parseTime(messageContent.trim())

  if (!timeStr) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❌ Hora inválida.

*Formatos:*
• 20:30
• 8:30 PM  
• 8.30

_Envía "0" para volver_`
    )
  }

  const eventData = tempData.get(phoneNumber)!
  const currentIndex = eventData.current_class_index || 0
  eventData.classes![currentIndex].start_time = timeStr
  tempData.set(phoneNumber, eventData)
  userStates.set(phoneNumber, ChatState.CREATE_CLASS_LEVEL)

  const classNumber =
    eventData.classes!.length > 1 ? ` ${currentIndex + 1}` : ''

  return WhatsAppService.sendTextMessage(
    phoneNumber,
    `✅ Hora clase${classNumber}: *${timeStr}*

¿Cuál es el nivel?

1 - Principiante
2 - Intermedio  
3 - Avanzado
4 - Todos los niveles
5 - . (omitir nivel)

_Envía "0" para volver_`
  )
}

async function handleClassLevel(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,
  phoneNumber: string,
  normalizedMessage: string
) {
  const levelMap: Record<string, ClassLevel | 'skip'> = {
    '1': 'beginner',
    principiante: 'beginner',
    '2': 'intermediate',
    intermedio: 'intermediate',
    '3': 'advanced',
    avanzado: 'advanced',
    '4': 'all_levels',
    todos: 'all_levels',
    '5': 'skip',
    '.': 'skip'
  }

  if (!levelMap[normalizedMessage]) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Opción inválida. Elegí:

1 - Principiante  2 - Intermedio  3 - Avanzado
4 - Todos los niveles  5 - . (omitir)

_Envía "0" para volver_`
    )
  }

  const eventData = tempData.get(phoneNumber)!
  const currentIndex = eventData.current_class_index || 0

  if (levelMap[normalizedMessage] !== 'skip') {
    eventData.classes![currentIndex].class_level = levelMap[
      normalizedMessage
    ] as ClassLevel
  }

  tempData.set(phoneNumber, eventData)

  const isFirstClassCreation =
    currentIndex === 0 && eventData.classes!.length === 1

  if (isFirstClassCreation) {
    userStates.set(phoneNumber, ChatState.CREATE_CLASS_ADD_ANOTHER)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `¿Hay otra clase?

1 - Sí, agregar otra clase
2 - No, continuar

_Envía "0" para volver_`
    )
  } else {
    // If we already have multiple classes or finished adding, move to practice
    userStates.set(phoneNumber, ChatState.CREATE_CLASS_PRACTICE)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `¿Hay práctica después de las clases?

1 - Sí, hay práctica
2 - No hay práctica

_Envía "0" para volver_`
    )
  }
}

// Add another class handler
async function handleClassAddAnother(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,
  phoneNumber: string,
  normalizedMessage: string
) {
  const eventData = tempData.get(phoneNumber)!

  if (['1', 'si', 'sí', 'agregar', 'otra'].includes(normalizedMessage)) {
    eventData.classes!.push({ start_time: '' })
    eventData.current_class_index = eventData.classes!.length - 1
    tempData.set(phoneNumber, eventData)
    userStates.set(phoneNumber, ChatState.CREATE_CLASS_TIME)

    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `¿A qué hora es la clase ${eventData.current_class_index! + 1}?

*Formato:* 20:30

_Envía "0" para volver_`
    )
  } else if (['2', 'no', 'continuar'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.CREATE_CLASS_PRACTICE)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `¿Hay práctica después de las clases?

1 - Sí, hay práctica
2 - No hay práctica

_Envía "0" para volver_`
    )
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Por favor responde:

1 - Sí, agregar otra clase
2 - No, continuar

_Envía "0" para volver_`
    )
  }
}

// Class practice handler
async function handleClassPractice(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,
  phoneNumber: string,
  normalizedMessage: string
) {
  if (['1', 'si', 'sí', 'hay'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.CREATE_CLASS_PRACTICE_TIME)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `¿A qué hora es la práctica?

*Formato:* 23:00

_Envía "0" para volver_`
    )
  } else if (['2', 'no'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_ORGANIZERS)
    return handleEventOrganizers(userStates, tempData, phoneNumber)
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Por favor responde:

1 - Sí, hay práctica
2 - No hay práctica

_Envía "0" para volver_`
    )
  }
}

async function handleClassPracticeTime(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,
  phoneNumber: string,
  messageContent: string
) {
  const timeStr = parseTime(messageContent.trim())

  if (!timeStr) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❌ Hora inválida.

*Formatos:*
• 23:00
• 11:00 PM  
• 11.00

_Envía "0" para volver_`
    )
  }

  const eventData = tempData.get(phoneNumber)!
  eventData.practice = { practice_time: timeStr }
  tempData.set(phoneNumber, eventData)
  userStates.set(phoneNumber, ChatState.CREATE_EVENT_ORGANIZERS)

  return handleEventOrganizers(userStates, tempData, phoneNumber)
}

async function handleMilongaTime(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,
  phoneNumber: string,
  messageContent: string
) {
  const timeStr = parseTime(messageContent.trim())

  if (!timeStr) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❌ Hora inválida.

*Formatos:*
• 20:30
• 8:30 PM  
• 8.30

_Envía "0" para volver_`
    )
  }

  const eventData = tempData.get(phoneNumber)!
  eventData.milonga_time = timeStr
  tempData.set(phoneNumber, eventData)
  userStates.set(phoneNumber, ChatState.CREATE_MILONGA_PRE_CLASS)

  return WhatsAppService.sendTextMessage(
    phoneNumber,
    `✅ Hora milonga: *${timeStr}*

¿Hay clase previa antes de la milonga?

1 - Sí, hay clase previa
2 - No hay clase previa

_Envía "0" para volver_`
  )
}

async function handleMilongaPreClass(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,
  phoneNumber: string,
  normalizedMessage: string
) {
  if (['1', 'si', 'sí', 'hay'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.CREATE_MILONGA_PRE_CLASS_DETAILS)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `¿A qué hora es la clase previa?

*Formato:* 19:30

_Envía "0" para volver_`
    )
  } else if (['2', 'no'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.CREATE_MILONGA_SHOW)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `¿Hay show en la milonga?

1 - Sí, hay show
2 - No hay show

_Envía "0" para volver_`
    )
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Por favor responde:

1 - Sí, hay clase previa
2 - No hay clase previa

_Envía "0" para volver_`
    )
  }
}

async function handleMilongaPreClassDetails(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,
  phoneNumber: string,
  messageContent: string
) {
  const timeStr = parseTime(messageContent.trim())

  if (!timeStr) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❌ Hora inválida.

*Formatos:*
• 19:30
• 7:30 PM  
• 7.30

_Envía "0" para volver_`
    )
  }

  const eventData = tempData.get(phoneNumber)!
  eventData.pre_class = {
    class_time: timeStr,
    milonga_start_time: eventData.milonga_time!
  }
  tempData.set(phoneNumber, eventData)
  userStates.set(phoneNumber, ChatState.CREATE_MILONGA_SHOW)

  return WhatsAppService.sendTextMessage(
    phoneNumber,
    `✅ Clase previa: *${timeStr}*

¿Hay show en la milonga?

1 - Sí, hay show
2 - No hay show

_Envía "0" para volver_`
  )
}

// Milonga show handler
async function handleMilongaShow(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,
  phoneNumber: string,
  messageContent: string
) {
  const eventData = tempData.get(phoneNumber)!
  const normalizedMessage = messageContent.trim().toLowerCase()

  if (['1', 'si', 'sí', 'hay'].includes(normalizedMessage)) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `¿Quién baila en el show?

*Ejemplo:* "Juan y Belén"

Escribe "." para omitir

_Envía "0" para volver_`
    )
  } else if (['2', 'no'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_ORGANIZERS)
    return handleEventOrganizers(userStates, tempData, phoneNumber)
  } else if (messageContent.trim() === '.') {
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_ORGANIZERS)
    return handleEventOrganizers(userStates, tempData, phoneNumber)
  } else if (
    messageContent.trim().length > 0 &&
    !['1', '2'].includes(normalizedMessage)
  ) {
    // They provided show description
    eventData.show_description = messageContent.trim()
    tempData.set(phoneNumber, eventData)
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_ORGANIZERS)
    return handleEventOrganizers(userStates, tempData, phoneNumber)
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Por favor responde:

1 - Sí, hay show
2 - No hay show

_Envía "0" para volver_`
    )
  }
}

async function handleSpecialTime(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,
  phoneNumber: string,
  messageContent: string
) {
  const timeStr = parseTime(messageContent.trim())

  if (!timeStr) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❌ Hora inválida.

*Formatos:*
• 20:30
• 8:30 PM  
• 8.30

_Envía "0" para volver_`
    )
  }

  const eventData = tempData.get(phoneNumber)!
  eventData.classes = [{ start_time: timeStr }]
  tempData.set(phoneNumber, eventData)
  userStates.set(phoneNumber, ChatState.CREATE_EVENT_ORGANIZERS)

  return handleEventOrganizers(userStates, tempData, phoneNumber)
}

async function handleEventOrganizers(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,
  phoneNumber: string
) {
  const eventData = tempData.get(phoneNumber)!

  const currentUser = await DatabaseService.getUserByPhone(phoneNumber)
  const isTeacher = currentUser?.role === 'teacher'

  if (
    isTeacher &&
    (eventData.event_type === 'class' || eventData.event_type === 'seminar')
  ) {
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_ORGANIZER_SELF)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `👨‍🏫 ¿Vas a dar esta ${
        eventData.event_type === 'class' ? 'clase' : 'seminario'
      } vos?

1 - Sí, la doy yo
2 - No, la da otro profesor

_Envía "0" para volver_`
    )
  } else {
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_ORGANIZER_SEARCH)
    const organizerType =
      eventData.event_type === 'class'
        ? 'profesor'
        : eventData.event_type === 'seminar'
        ? 'profesor'
        : 'organizador'

    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `👥 ¿Quién es el ${organizerType}?

Escribí el nombre del ${organizerType} para buscar o:
• "nuevo" - Para agregar un ${organizerType} de una sola vez

_Envía "0" para volver_`
    )
  }
}

async function handleGoBack(
  userStates: Map<string, ChatState>,
  phoneNumber: string
) {
  const currentState = userStates.get(phoneNumber)

  const backTransitions: Partial<Record<ChatState, ChatState>> = {
    [ChatState.CREATE_EVENT_TITLE]: ChatState.SPECIAL_MENU,
    [ChatState.CREATE_EVENT_VENUE]: ChatState.CREATE_EVENT_TITLE,
    [ChatState.CREATE_EVENT_ADDRESS]: ChatState.CREATE_EVENT_VENUE,
    [ChatState.CREATE_EVENT_DATE]: ChatState.CREATE_EVENT_ADDRESS,
    [ChatState.CREATE_CLASS_SINGLE_OR_MULTIPLE]: ChatState.CREATE_EVENT_DATE,
    [ChatState.CREATE_CLASS_TIME]: ChatState.CREATE_CLASS_SINGLE_OR_MULTIPLE,
    [ChatState.CREATE_CLASS_LEVEL]: ChatState.CREATE_CLASS_TIME,
    [ChatState.CREATE_CLASS_ADD_ANOTHER]: ChatState.CREATE_CLASS_LEVEL,
    [ChatState.CREATE_CLASS_PRACTICE]: ChatState.CREATE_CLASS_ADD_ANOTHER,
    [ChatState.CREATE_CLASS_PRACTICE_TIME]: ChatState.CREATE_CLASS_PRACTICE,
    [ChatState.CREATE_MILONGA_TIME]: ChatState.CREATE_EVENT_DATE,
    [ChatState.CREATE_MILONGA_PRE_CLASS]: ChatState.CREATE_MILONGA_TIME,
    [ChatState.CREATE_MILONGA_PRE_CLASS_DETAILS]:
      ChatState.CREATE_MILONGA_PRE_CLASS,
    [ChatState.CREATE_MILONGA_SHOW]: ChatState.CREATE_MILONGA_PRE_CLASS_DETAILS,
    [ChatState.CREATE_SPECIAL_TIME]: ChatState.CREATE_EVENT_DATE,
    [ChatState.CREATE_EVENT_ORGANIZERS]: ChatState.CREATE_CLASS_PRACTICE,
    [ChatState.CREATE_EVENT_ORGANIZER_SELF]: ChatState.CREATE_EVENT_ORGANIZERS,
    [ChatState.CREATE_EVENT_ORGANIZER_ADDITIONAL]:
      ChatState.CREATE_EVENT_ORGANIZER_SELF,
    [ChatState.CREATE_EVENT_ORGANIZER_SEARCH]:
      ChatState.CREATE_EVENT_ORGANIZERS,
    [ChatState.CREATE_EVENT_ORGANIZER_SELECT]:
      ChatState.CREATE_EVENT_ORGANIZER_SEARCH,
    [ChatState.CREATE_EVENT_ORGANIZER_ONE_TIME]:
      ChatState.CREATE_EVENT_ORGANIZER_SEARCH,
    [ChatState.CREATE_EVENT_RECURRENCE]:
      ChatState.CREATE_EVENT_ORGANIZER_ADDITIONAL,
    [ChatState.CREATE_EVENT_CONTACT]: ChatState.CREATE_EVENT_RECURRENCE,
    [ChatState.CREATE_EVENT_CONTACT_NUMBER]: ChatState.CREATE_EVENT_CONTACT,
    [ChatState.CREATE_EVENT_REMINDER]: ChatState.CREATE_EVENT_CONTACT,
    [ChatState.CREATE_EVENT_REMINDER_NUMBER]: ChatState.CREATE_EVENT_REMINDER,
    [ChatState.CREATE_EVENT_DESCRIPTION]: ChatState.CREATE_EVENT_REMINDER,
    [ChatState.CREATE_EVENT_PRICING]: ChatState.CREATE_EVENT_DESCRIPTION,
    [ChatState.CREATE_EVENT_PRICING_DETAILS]: ChatState.CREATE_EVENT_PRICING,
    [ChatState.CREATE_EVENT_CONFIRMATION]: ChatState.CREATE_EVENT_PRICING
  }

  const previousState = backTransitions[currentState!]

  if (previousState) {
    userStates.set(phoneNumber, previousState)
    return showStateMessage(userStates, phoneNumber, previousState)
  } else {
    userStates.set(phoneNumber, ChatState.SPECIAL_MENU)
    return showSpecialMenu(userStates, phoneNumber)
  }
}

async function showStateMessage(
  userStates: Map<string, ChatState>,
  phoneNumber: string,
  state: ChatState
): Promise<any> {
  switch (state) {
    case ChatState.SPECIAL_MENU:
      return showSpecialMenu(userStates, phoneNumber)
    case ChatState.CREATE_EVENT_TITLE:
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `📝 ¿Cuál es el título del evento?\n\n*Ejemplo:* "Clase de Tango Principiantes"\n\n_Envía "0" para volver_`
      )
    // Agregar más casos según necesidad
    default:
      return showSpecialMenu(userStates, phoneNumber)
  }
}

async function handleExitCreation(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,
  phoneNumber: string
) {
  tempData.delete(phoneNumber)
  userStates.set(phoneNumber, ChatState.START)

  return WhatsAppService.sendTextMessage(
    phoneNumber,
    `❌ Creación de evento cancelada.

¿Necesitas algo más?`
  )
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
4 - Crear *evento especial*
5 - Modificar un *evento*`
  )
}

// Organizer self handler
async function handleOrganizerSelf(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,
  phoneNumber: string,
  normalizedMessage: string
) {
  const eventData = tempData.get(phoneNumber)!
  const currentUser = await DatabaseService.getUserByPhone(phoneNumber)

  if (['1', 'si', 'sí', 'yo'].includes(normalizedMessage)) {
    eventData.organizers!.push({
      user_id: currentUser!.id,
      organizer_type: 'teacher',
      is_primary: true,
      is_one_time_teacher: false
    })
    tempData.set(phoneNumber, eventData)
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_ORGANIZER_ADDITIONAL)

    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `✅ Agregado: *${currentUser!.name}*

¿La das con alguien más?

1 - Sí, agregar otro profesor
2 - No, continuar

_Envía "0" para volver_`
    )
  } else if (['2', 'no', 'otro'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_ORGANIZER_SEARCH)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `👥 ¿Quién da la clase?

Escribí el nombre del profesor para buscar o:
• "nuevo" - Para agregar un profesor de una sola vez

_Envía "0" para volver_`
    )
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Por favor responde:

1 - Sí, la doy yo
2 - No, la da otro profesor

_Envía "0" para volver_`
    )
  }
}

async function handleOrganizerAdditional(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,
  phoneNumber: string,
  normalizedMessage: string
) {
  if (['1', 'si', 'sí', 'agregar'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_ORGANIZER_SEARCH)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `👥 ¿Quién más da la clase?

Escribí el nombre del profesor para buscar o:
• "nuevo" - Para agregar un profesor de una sola vez

_Envía "0" para volver_`
    )
  } else if (['2', 'no', 'continuar'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_RECURRENCE)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `🔄 ¿Esta clase se repite todas las semanas?

*Recordá que mensualmente te llegará un recordatorio para confirmar si seguís organizando.*

1 - Sí, se repite semanalmente
2 - No, es solo esta vez

_Envía "0" para volver_`
    )
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Por favor responde:

1 - Sí, agregar otro profesor
2 - No, continuar

_Envía "0" para volver_`
    )
  }
}

async function handleOrganizerSearch(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,
  phoneNumber: string,
  messageContent: string
) {
  const searchTerm = messageContent.trim()

  if (searchTerm.toLowerCase() === 'nuevo') {
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_ORGANIZER_ONE_TIME)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `¿Cuál es el nombre del profesor?

*Ejemplo:* "Juan Pérez"

_Envía "0" para volver_`
    )
  }

  if (searchTerm.length < 2) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❌ El nombre debe tener al menos 2 caracteres.

Escribí el nombre para buscar o "nuevo" para profesor de una vez.

_Envía "0" para volver_`
    )
  }

  const teachers = await DatabaseService.searchTeachersByName(searchTerm)

  if (teachers.length === 0) {
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_ORGANIZER_ONE_TIME)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❌ No se encontraron profesores con ese nombre.

¿Es un profesor de una sola vez?
Escribí el nombre completo:

*Ejemplo:* "Juan Pérez"

_Envía "0" para volver_`
    )
  }

  const eventData = tempData.get(phoneNumber)!
  eventData.temp_organizer_search = searchTerm
  eventData.temp_organizer_results = teachers.map(t => ({
    id: t.id ?? '',
    name: t.name ?? '',
    phone_number: t.phone_number ?? '',
    details: t.details ?? ''
  }))
  tempData.set(phoneNumber, eventData)
  userStates.set(phoneNumber, ChatState.CREATE_EVENT_ORGANIZER_SELECT)

  let message = `🔍 Profesores encontrados:\n\n`
  teachers.forEach((teacher, index) => {
    message += `${index + 1} - *${teacher.name}*\n`
  })
  message += `\n${
    teachers.length + 1
  } - Es otra persona (profesor de una vez)\n`
  message += `\n¿Cuál elegís?\n\n_Envía "0" para volver_`

  return WhatsAppService.sendTextMessage(phoneNumber, message)
}

async function handleOrganizerSelect(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,

  phoneNumber: string,
  normalizedMessage: string
) {
  const eventData = tempData.get(phoneNumber)!
  const results = eventData.temp_organizer_results || []
  const selection = parseInt(normalizedMessage)

  if (selection >= 1 && selection <= results.length) {
    const selectedTeacher = results[selection - 1]
    const isFirst = eventData.organizers!.length === 0

    eventData.organizers!.push({
      user_id: selectedTeacher.id,
      organizer_type: 'teacher',
      is_primary: isFirst,
      is_one_time_teacher: false
    })

    delete eventData.temp_organizer_search
    delete eventData.temp_organizer_results
    tempData.set(phoneNumber, eventData)

    userStates.set(phoneNumber, ChatState.CREATE_EVENT_ORGANIZER_ADDITIONAL)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `✅ Agregado: *${selectedTeacher.name}*

¿Hay otro profesor más?

1 - Sí, agregar otro
2 - No, continuar

_Envía "0" para volver_`
    )
  } else if (selection === results.length + 1) {
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_ORGANIZER_ONE_TIME)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `¿Cuál es el nombre completo del profesor?

*Ejemplo:* "Juan Pérez"

_Envía "0" para volver_`
    )
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Número inválido. Elegí una opción del 1 al ${results.length + 1}.

_Envía "0" para volver_`
    )
  }
}

async function handleOrganizerOneTime(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,

  phoneNumber: string,
  messageContent: string
) {
  const teacherName = messageContent.trim()

  if (teacherName.length < 3) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❌ El nombre debe tener al menos 3 caracteres.

*Ejemplo:* "Juan Pérez"

_Envía "0" para volver_`
    )
  }

  const eventData = tempData.get(phoneNumber)!
  const isFirst = eventData.organizers!.length === 0

  eventData.organizers!.push({
    organizer_type: 'teacher',
    is_primary: isFirst,
    is_one_time_teacher: true,
    one_time_teacher_name: teacherName
  })

  tempData.set(phoneNumber, eventData)
  userStates.set(phoneNumber, ChatState.CREATE_EVENT_ORGANIZER_ADDITIONAL)

  return WhatsAppService.sendTextMessage(
    phoneNumber,
    `✅ Agregado: *${teacherName}*

¿Hay otro profesor más?

1 - Sí, agregar otro
2 - No, continuar

_Envía "0" para volver_`
  )
}

async function handleEventRecurrence(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,

  phoneNumber: string,
  normalizedMessage: string
) {
  const eventData = tempData.get(phoneNumber)!

  if (!normalizedMessage) {
    const eventTypeName = {
      class: 'clase',
      milonga: 'milonga',
      seminar: 'seminario',
      special_event: 'evento'
    }[eventData.event_type!]

    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `🔄 ¿Esta ${eventTypeName} se repite todas las semanas?

*Recordá que mensualmente te llegará un recordatorio para confirmar si seguís organizando.*

1 - Sí, se repite semanalmente
2 - No, es solo esta vez

_Envía "0" para volver_`
    )
  }

  if (['1', 'si', 'sí', 'repite', 'semanalmente'].includes(normalizedMessage)) {
    eventData.has_weekly_recurrence = true
    tempData.set(phoneNumber, eventData)
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_CONTACT)
    return handleEventContact(userStates, tempData, phoneNumber, '')
  } else if (['2', 'no', 'una vez', 'unica'].includes(normalizedMessage)) {
    eventData.has_weekly_recurrence = false
    tempData.set(phoneNumber, eventData)
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_CONTACT)
    return handleEventContact(userStates, tempData, phoneNumber, '')
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Por favor responde:

1 - Sí, se repite semanalmente
2 - No, es solo esta vez

_Envía "0" para volver_`
    )
  }
}

async function handleEventContact(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,

  phoneNumber: string,
  normalizedMessage: string
) {
  if (!normalizedMessage) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `📞 ¿Agregar número de contacto?

1 - Usar mi número (${phoneNumber})
2 - Usar otro número
3 - . (no agregar contacto)

_Envía "0" para volver_`
    )
  }

  const eventData = tempData.get(phoneNumber)!

  if (['1', 'mi numero', 'mi número'].includes(normalizedMessage)) {
    eventData.contact_phone = phoneNumber
    tempData.set(phoneNumber, eventData)
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_REMINDER)
    return handleEventReminder(userStates, tempData, phoneNumber, '')
  } else if (
    ['2', 'otro', 'otro numero', 'otro número'].includes(normalizedMessage)
  ) {
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_CONTACT_NUMBER)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `📞 ¿Cuál es el número de contacto?

*Ejemplo:* 2234567890

_Envía "0" para volver_`
    )
  } else if (['3', '.', 'no', 'omitir'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_REMINDER)
    return handleEventReminder(userStates, tempData, phoneNumber, '')
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Por favor responde:

1 - Usar mi número
2 - Usar otro número
3 - . (no agregar contacto)

_Envía "0" para volver_`
    )
  }
}

async function handleEventContactNumber(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,

  phoneNumber: string,
  messageContent: string
) {
  const contactNumber = messageContent.trim().replace(/\D/g, '') // Remove non-digits

  if (contactNumber.length < 8 || contactNumber.length > 15) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❌ Número inválido. Debe tener entre 8 y 15 dígitos.

*Ejemplo:* 2234567890

_Envía "0" para volver_`
    )
  }

  const eventData = tempData.get(phoneNumber)!
  eventData.contact_phone = contactNumber
  tempData.set(phoneNumber, eventData)
  userStates.set(phoneNumber, ChatState.CREATE_EVENT_REMINDER)

  return handleEventReminder(userStates, tempData, phoneNumber, '')
}

async function handleEventReminder(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,

  phoneNumber: string,
  normalizedMessage: string
) {
  if (!normalizedMessage) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `🔔 ¿Usar este número para recordatorios?

1 - Sí, usar mi número (${phoneNumber})
2 - Usar otro número
3 - . (sin recordatorios)

_Envía "0" para volver_`
    )
  }

  const eventData = tempData.get(phoneNumber)!

  if (['1', 'si', 'sí', 'mi numero', 'mi número'].includes(normalizedMessage)) {
    eventData.reminder_phone = phoneNumber
    tempData.set(phoneNumber, eventData)
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_DESCRIPTION)
    return handleEventDescription(userStates, tempData, phoneNumber, '')
  } else if (
    ['2', 'otro', 'otro numero', 'otro número'].includes(normalizedMessage)
  ) {
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_REMINDER_NUMBER)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `🔔 ¿Cuál es el número para recordatorios?

*Ejemplo:* 2234567890

_Envía "0" para volver_`
    )
  } else if (['3', '.', 'no', 'sin'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_DESCRIPTION)
    return handleEventDescription(userStates, tempData, phoneNumber, '')
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Por favor responde:

1 - Sí, usar mi número
2 - Usar otro número  
3 - . (sin recordatorios)

_Envía "0" para volver_`
    )
  }
}

async function handleEventReminderNumber(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,

  phoneNumber: string,
  messageContent: string
) {
  const reminderNumber = messageContent.trim().replace(/\D/g, '') // Remove non-digits

  if (reminderNumber.length < 8 || reminderNumber.length > 15) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❌ Número inválido. Debe tener entre 8 y 15 dígitos.

*Ejemplo:* 2234567890

_Envía "0" para volver_`
    )
  }

  const eventData = tempData.get(phoneNumber)!
  eventData.reminder_phone = reminderNumber
  tempData.set(phoneNumber, eventData)
  userStates.set(phoneNumber, ChatState.CREATE_EVENT_DESCRIPTION)

  return handleEventDescription(userStates, tempData, phoneNumber, '')
}

async function handleEventDescription(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,

  phoneNumber: string,
  messageContent: string
) {
  if (!messageContent) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `💬 Descripción del evento *(opcional)*

Incluye detalles importantes para los participantes.

*Ejemplo:* "Clase enfocada en técnica básica y musicalidad."

Escribe "." para omitir

_Envía "0" para volver_`
    )
  }

  const eventData = tempData.get(phoneNumber)!

  if (messageContent.trim() !== '.') {
    eventData.description = messageContent.trim()
  }

  tempData.set(phoneNumber, eventData)
  userStates.set(phoneNumber, ChatState.CREATE_EVENT_PRICING)

  return handleEventPricing(userStates, tempData, phoneNumber, '')
}

async function handleEventPricing(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,

  phoneNumber: string,
  messageContent: string
) {
  const eventData = tempData.get(phoneNumber)!

  if (!messageContent) {
    let pricingMessage = `💰 *Precios* *(opcional)*\n\n`

    if (eventData.event_type === 'class' && eventData.practice) {
      pricingMessage += `Tienes clase y práctica. ¿Cómo se cobra?\n\n`
      pricingMessage += `1 - Solo clase\n`
      pricingMessage += `2 - Solo práctica\n`
      pricingMessage += `3 - Clase y práctica\n`
      pricingMessage += `4 - . (sin precios)\n`
    } else if (eventData.event_type === 'milonga' && eventData.pre_class) {
      pricingMessage += `Tienes clase previa y milonga. ¿Cómo se cobra?\n\n`
      pricingMessage += `1 - Solo clase previa\n`
      pricingMessage += `2 - Solo milonga\n`
      pricingMessage += `3 - Clase y milonga\n`
      pricingMessage += `4 - . (sin precios)\n`
    } else {
      pricingMessage += `¿Cuál es el precio?\n\n`
      pricingMessage += `*Formato:* Solo el número\n`
      pricingMessage += `*Ejemplo:* 5000\n\n`
      pricingMessage += `Escribe "gratis" o "." para omitir\n`
    }

    pricingMessage += `\n_Envía "0" para volver_`

    return WhatsAppService.sendTextMessage(phoneNumber, pricingMessage)
  }

  const normalizedMessage = messageContent.trim().toLowerCase()

  if (eventData.event_type === 'class' && eventData.practice) {
    return handleClassWithPracticePricing(
      userStates,
      tempData,
      phoneNumber,
      normalizedMessage,
      eventData
    )
  } else if (eventData.event_type === 'milonga' && eventData.pre_class) {
    return handleMilongaWithClassPricing(
      userStates,
      tempData,
      phoneNumber,
      normalizedMessage,
      eventData
    )
  } else {
    return handleSimplePricing(
      userStates,
      tempData,
      phoneNumber,
      normalizedMessage,
      eventData
    )
  }
}

async function handleClassWithPracticePricing(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,
  phoneNumber: string,
  normalizedMessage: string,
  eventData: NewEventData
) {
  if (['1', 'solo clase', 'clase'].includes(normalizedMessage)) {
    eventData.temp_pricing_type = 'class_only'
    tempData.set(phoneNumber, eventData)
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_PRICING_DETAILS)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `💰 ¿Cuál es el precio de la clase?

*Formato:* Solo el número
*Ejemplo:* 5000

_Envía "0" para volver_`
    )
  } else if (
    ['2', 'solo practica', 'práctica', 'practica'].includes(normalizedMessage)
  ) {
    eventData.temp_pricing_type = 'practice_only'
    tempData.set(phoneNumber, eventData)
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_PRICING_DETAILS)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `💰 ¿Cuál es el precio de la práctica?

*Formato:* Solo el número
*Ejemplo:* 3000

_Envía "0" para volver_`
    )
  } else if (
    ['3', 'clase y practica', 'ambos', 'todo'].includes(normalizedMessage)
  ) {
    eventData.temp_pricing_type = 'class_and_practice'
    tempData.set(phoneNumber, eventData)
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_PRICING_DETAILS)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `💰 ¿Cuál es el precio de clase + práctica?

*Formato:* Solo el número
*Ejemplo:* 7000

_Envía "0" para volver_`
    )
  } else if (['4', '.', 'sin precios', 'omitir'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_CONFIRMATION)
    return showEventConfirmation(phoneNumber, tempData)
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Por favor responde:

1 - Solo clase
2 - Solo práctica
3 - Clase y práctica
4 - . (sin precios)

_Envía "0" para volver_`
    )
  }
}

async function handleMilongaWithClassPricing(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,
  phoneNumber: string,
  normalizedMessage: string,
  eventData: NewEventData
) {
  if (['1', 'solo clase', 'clase previa'].includes(normalizedMessage)) {
    eventData.temp_pricing_type = 'class_only'
    tempData.set(phoneNumber, eventData)
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_PRICING_DETAILS)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `💰 ¿Cuál es el precio de la clase previa?

*Formato:* Solo el número
*Ejemplo:* 4000

_Envía "0" para volver_`
    )
  } else if (['2', 'solo milonga', 'milonga'].includes(normalizedMessage)) {
    eventData.temp_pricing_type = 'milonga_only'
    tempData.set(phoneNumber, eventData)
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_PRICING_DETAILS)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `💰 ¿Cuál es el precio de la milonga?

*Formato:* Solo el número
*Ejemplo:* 6000

_Envía "0" para volver_`
    )
  } else if (
    ['3', 'clase y milonga', 'ambos', 'todo'].includes(normalizedMessage)
  ) {
    eventData.temp_pricing_type = 'class_and_milonga'
    tempData.set(phoneNumber, eventData)
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_PRICING_DETAILS)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `💰 ¿Cuál es el precio de clase + milonga?

*Formato:* Solo el número
*Ejemplo:* 8000

_Envía "0" para volver_`
    )
  } else if (['4', '.', 'sin precios', 'omitir'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_CONFIRMATION)
    return showEventConfirmation(phoneNumber, tempData)
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Por favor responde:

1 - Solo clase previa
2 - Solo milonga
3 - Clase y milonga
4 - . (sin precios)

_Envía "0" para volver_`
    )
  }
}

async function handleSimplePricing(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,
  phoneNumber: string,
  normalizedMessage: string,
  eventData: NewEventData
) {
  if (['.', 'sin precios', 'omitir'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_CONFIRMATION)
    return showEventConfirmation(phoneNumber, tempData)
  } else if (['gratis', 'gratuito', 'free', '0'].includes(normalizedMessage)) {
    eventData.pricing!.push({
      price_type: 'general',
      price: 0,
      description: 'Gratuito'
    })
    tempData.set(phoneNumber, eventData)
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_CONFIRMATION)
    return showEventConfirmation(phoneNumber, tempData)
  } else {
    const price = parseFloat(normalizedMessage.replace(/[^\d.]/g, ''))
    if (isNaN(price) || price < 0) {
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `❌ Precio inválido.

*Formato:* Solo el número
*Ejemplo:* 5000

O escribe "gratis" o "." para omitir

_Envía "0" para volver_`
      )
    }

    eventData.pricing!.push({
      price_type: 'general',
      price: price,
      description:
        eventData.event_type === 'class'
          ? 'Clase'
          : eventData.event_type === 'milonga'
          ? 'Milonga'
          : eventData.event_type === 'seminar'
          ? 'Seminario'
          : 'Evento'
    })
    tempData.set(phoneNumber, eventData)
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_CONFIRMATION)
    return showEventConfirmation(phoneNumber, tempData)
  }
}

async function handleEventPricingDetails(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,

  phoneNumber: string,
  messageContent: string
) {
  const eventData = tempData.get(phoneNumber)!
  const normalizedMessage = messageContent.trim().toLowerCase()

  if (['gratis', 'gratuito', 'free', '0'].includes(normalizedMessage)) {
    const pricingType = eventData.temp_pricing_type! as
      | 'class_only'
      | 'practice_only'
      | 'class_and_practice'
      | 'milonga_only'
      | 'class_and_milonga'
    const descriptionMap: Record<typeof pricingType, string> = {
      class_only: 'Solo clase',
      practice_only: 'Solo práctica',
      class_and_practice: 'Clase y práctica',
      milonga_only: 'Solo milonga',
      class_and_milonga: 'Clase y milonga'
    }
    const description = descriptionMap[pricingType] || 'General'

    eventData.pricing!.push({
      price_type: pricingType,
      price: 0,
      description: `${description} - Gratuito`
    })

    delete eventData.temp_pricing_type
    tempData.set(phoneNumber, eventData)
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_CONFIRMATION)
    return showEventConfirmation(phoneNumber, tempData)
  } else {
    const price = parseFloat(normalizedMessage.replace(/[^\d.]/g, ''))
    if (isNaN(price) || price < 0) {
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `❌ Precio inválido.

*Formato:* Solo el número
*Ejemplo:* 5000

O escribe "gratis" para precio gratuito

_Envía "0" para volver_`
      )
    }

    const pricingType = eventData.temp_pricing_type! as
      | 'class_only'
      | 'practice_only'
      | 'class_and_practice'
      | 'milonga_only'
      | 'class_and_milonga'
    const descriptionMap: Record<typeof pricingType, string> = {
      class_only: 'Solo clase',
      practice_only: 'Solo práctica',
      class_and_practice: 'Clase y práctica',
      milonga_only: 'Solo milonga',
      class_and_milonga: 'Clase y milonga'
    }
    const description = descriptionMap[pricingType] || 'General'

    eventData.pricing!.push({
      price_type: pricingType,
      price: price,
      description: description
    })

    delete eventData.temp_pricing_type
    delete eventData.temp_organizer_search
    delete eventData.temp_organizer_results
    
    tempData.set(phoneNumber, eventData)
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_CONFIRMATION)
    return showEventConfirmation(phoneNumber, tempData)
  }
}

async function showEventConfirmation(
  phoneNumber: string,
  tempData: Map<string, NewEventData>
) {
  const eventData = tempData.get(phoneNumber)!

  const eventTypeNames = {
    class: 'Clase',
    milonga: 'Milonga',
    seminar: 'Seminario',
    special_event: 'Evento Especial'
  }

  const levelNames = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
    all_levels: 'Todos los niveles'
  }

  let confirmationText = `📋 *CONFIRMACIÓN DEL EVENTO*\n\n`
  confirmationText += `🎭 *Tipo:* ${eventTypeNames[eventData.event_type!]}\n`
  confirmationText += `📝 *Título:* ${eventData.title}\n`
  confirmationText += `🏢 *Lugar:* ${eventData.venue_name}\n`
  confirmationText += `📍 *Dirección:* ${eventData.address}\n`
  confirmationText += `📅 *Fecha:* ${eventData.date}\n`

  if (eventData.classes && eventData.classes.length > 0) {
    eventData.classes.forEach((cls, index) => {
      const classNum = eventData.classes!.length > 1 ? ` ${index + 1}` : ''
      confirmationText += `🕐 *Clase${classNum}:* ${cls.start_time}`
      if (cls.class_level) {
        confirmationText += ` (${levelNames[cls.class_level]})`
      }
      confirmationText += `\n`
    })
  }

  if (eventData.organizers && eventData.organizers.length > 0) {
    const organizerNames = eventData.organizers.map(org => {
      return org.one_time_teacher_name || 'Profesor registrado'
    })
    confirmationText += `👥 *Profesores:* ${organizerNames.join(', ')}\n`
  }

  if (eventData.pricing && eventData.pricing.length > 0) {
    confirmationText += `💰 *Precios:*\n`
    eventData.pricing.forEach(price => {
      confirmationText += `   • ${price.description}: ${
        price.price === 0 ? 'Gratuito' : `${price.price}`
      }\n`
    })
  }

  confirmationText += `\n¿Confirmas que todos los datos están correctos?\n`
  confirmationText += `1 - ✅ Sí, crear el evento\n`
  confirmationText += `2 - ❌ No, quiero modificar algo\n\n`
  confirmationText += `_Envía "0" para volver o "salir" para cancelar_`

  return WhatsAppService.sendTextMessage(phoneNumber, confirmationText)
}

async function handleEventConfirmation(
  userStates: Map<string, ChatState>,
  tempData: Map<string, NewEventData>,

  phoneNumber: string,
  normalizedMessage: string
) {
  if (['1', 'si', 'sí', 'confirmo', 'crear'].includes(normalizedMessage)) {
    const eventData = tempData.get(phoneNumber)!

    try {
      const newEvent = await DatabaseService.createTangoEvent(
        phoneNumber,
        eventData
      )

      if (newEvent) {
        tempData.delete(phoneNumber)
        userStates.set(phoneNumber, ChatState.SPECIAL_MENU)

        const eventTypeName = {
          class: 'clase',
          milonga: 'milonga',
          seminar: 'seminario',
          special_event: 'evento especial'
        }[eventData.event_type!]

        let successMessage = `🎉 ¡Excelente! Tu ${eventTypeName} *"${eventData.title}"* ha sido creada exitosamente.\n\n`

        if (eventData.has_weekly_recurrence) {
          successMessage += `🔔 Recordatorio: Mensualmente te llegará una notificación para confirmar si seguís organizando esta actividad.\n\n`
        }

        successMessage += `📋 ¿Te gustaría crear otra actividad?\n\n`
        successMessage += `1 - Crear *clase*\n`
        successMessage += `2 - Crear *milonga*\n`
        successMessage += `3 - Crear *seminario*\n`
        successMessage += `4 - Crear *evento especial*\n`
        successMessage += `5 - Modificar un *evento*`

        return WhatsAppService.sendTextMessage(phoneNumber, successMessage)
      } else {
        userStates.set(phoneNumber, ChatState.START)
        return WhatsAppService.sendTextMessage(
          phoneNumber,
          `❌ Ocurrió un error al crear tu evento.\n\nPor favor intenta nuevamente más tarde.`
        )
      }
    } catch (error) {
      console.error('Error creating event:', error)
      userStates.set(phoneNumber, ChatState.START)
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `❌ Ocurrió un error al crear tu evento.\n\nPor favor intenta nuevamente más tarde.`
      )
    }
  } else if (['2', 'no', 'modificar'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.CREATE_EVENT_TITLE)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `🔄 Perfecto, empecemos de nuevo.\n\n¿Cuál es el título del evento?\n\n_Envía "0" para volver o "salir" para cancelar_`
    )
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Por favor responde:\n\n1 - Sí, crear el evento\n2 - No, modificar datos\n\n_Envía "0" para volver_`
    )
  }
}
