import { WhatsAppService } from '../../services/whatsapp'
import { DatabaseService } from '../../services/database'
import { OpenAIService } from '../../services/openaiService'
import {
  ChatState,
  TempEventData,
  NewEventData,
  AIEventExtraction
} from '../../types/processTangoConversation'
import { getMainMenuMessage } from './utils'
import { caseToday, caseWeek, handleEventSelection } from './showEvents'
import {
  handleTeacherCreation,
  startTeacherCreation,
} from './createTeacher'

const secretWord = process.env.SECRETWORD

const userStates = new Map<string, ChatState>()
const tempEventData = new Map<string, TempEventData>()
const aiEventData = new Map<string, { 
  extraction: AIEventExtraction, 
  originalInput: string 
}>()

export async function handleConversation(
  phoneNumber: string,
  messageContent: string
) {
  const normalizedMessage = messageContent.trim().toLowerCase()
  const currentState = userStates.get(phoneNumber) || ChatState.START

  if (normalizedMessage === secretWord) {
    try {
      const existingUser = await DatabaseService.getUserByPhone(phoneNumber)

      if (existingUser && existingUser.role === 'teacher') {
        console.log(
          `Usuario profesor conocido detectado: ${existingUser.name} (${existingUser.role})`
        )
        const welcomeName = existingUser.name || 'Profesor'
        await WhatsAppService.sendTextMessage(
          phoneNumber,
          `¡Hola! ${welcomeName} Entraste al menú secreto`
        )
        return showSimplifiedSpecialMenu(userStates, phoneNumber)
      } else if (existingUser && existingUser.role !== 'normal_query') {
        console.log(
          `Usuario especial detectado: ${existingUser.name} (${existingUser.role})`
        )
        const welcomeName = existingUser.name || 'Usuario'
        await WhatsAppService.sendTextMessage(
          phoneNumber,
          `¡Hola! ${welcomeName} Entraste al menú secreto`
        )
        return showSimplifiedSpecialMenu(userStates, phoneNumber)
      } else {
        // Primera vez que entra o usuario normal
        console.log(
          'Primera vez que entra o usuario normal, creando perfil de profesor'
        )
        await WhatsAppService.sendTextMessage(
          phoneNumber,
          `¡Hola! Es la primera vez que entras, vamos a crear tu usuario.`
        )
        return startTeacherCreation(userStates, phoneNumber)
      }
    } catch (error) {
      console.error('Error verificando usuario existente:', error)
      await WhatsAppService.sendTextMessage(
        phoneNumber,
        `¡Hola! Es la primera vez que entras, vamos a crear tu usuario.`
      )
      return startTeacherCreation(userStates, phoneNumber)
    }
  }

  switch (currentState) {
    case ChatState.START:
      userStates.set(phoneNumber, ChatState.MAIN_MENU)
      return WhatsAppService.sendTextMessage(phoneNumber, getMainMenuMessage())

    case ChatState.MAIN_MENU:
    case ChatState.MENU_TODAY:
    case ChatState.MENU_WEEK:
      return handleMainMenuOptions(userStates, phoneNumber, normalizedMessage)

    case ChatState.MENU_TODAY_DETAILS:
    case ChatState.MENU_WEEK_DETAILS:
      return handleEventSelection(
        userStates,
        tempEventData,
        phoneNumber,
        normalizedMessage
      )

    case ChatState.NEW_TEACHER_NAME:
    case ChatState.NEW_TEACHER_DETAILS:
    case ChatState.NEW_TEACHER_CONFIRMATION:
    case ChatState.CREATE_OTHER_TEACHER_PHONE:
    case ChatState.CREATE_OTHER_TEACHER_NAME:
    case ChatState.CREATE_OTHER_TEACHER_DETAILS:
    case ChatState.CREATE_OTHER_TEACHER_CONFIRMATION:
      return handleTeacherCreation(userStates, phoneNumber, messageContent)

    case ChatState.SPECIAL_MENU:
      return handleSpecialMenuOptions(userStates, phoneNumber, normalizedMessage)

    // Nuevos casos para IA
    case ChatState.AI_EVENT_INPUT:
      return handleAIEventInput(userStates, aiEventData, phoneNumber, messageContent)

    case ChatState.AI_EVENT_VALIDATION:
      return handleAIEventValidation(userStates, aiEventData, phoneNumber, normalizedMessage)

    case ChatState.AI_EVENT_CORRECTION:
      return handleAIEventCorrection(userStates, aiEventData, phoneNumber, messageContent)

    default:
      userStates.set(phoneNumber, ChatState.START)
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `Algo salió mal, volvamos a empezar.`
      )
  }
}

// Nuevo menú simplificado
const showSimplifiedSpecialMenu = async (
  userStates: Map<string, ChatState>,
  phoneNumber: string
) => {
  userStates.set(phoneNumber, ChatState.SPECIAL_MENU)
  return WhatsAppService.sendTextMessage(
    phoneNumber,
    `📋 ¿Qué te gustaría hacer?

1 - Crear evento (describe todo en un mensaje)
2 - Crear profesor (otra persona)
3 - Modificar un evento

0 - Volver al menú principal`
  )
}

async function handleSpecialMenuOptions(
  userStates: Map<string, ChatState>,
  phoneNumber: string,
  normalizedMessage: string
) {
  if (['1', 'crear evento', 'evento'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.AI_EVENT_INPUT)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `🎭 *Crear evento con IA*

Describe tu evento en un solo mensaje. Incluye toda la información que puedas:

*Ejemplo:*
"Crear clase de tango principiantes todos los martes 20hs en UADE, Magallanes 2025"

o

"Milonga en La Trastienda el sábado 21hs con clase previa a las 19:30"

_Envía "0" para volver_`
    )
  } else if (['2', 'crear profesor', 'profesor'].includes(normalizedMessage)) {
    return startTeacherCreation(userStates, phoneNumber)
  } else if (['3', 'modificar'].includes(normalizedMessage)) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `🛠️ Modificar evento (en desarrollo)...`
    )
  } else if (['0', 'volver', 'salir'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.MAIN_MENU)
    return WhatsAppService.sendTextMessage(phoneNumber, getMainMenuMessage())
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Opción inválida. Elegí una opción del menú (1-3) o "0" para volver al menú principal.`
    )
  }
}

// Nuevo manejador para entrada de IA
async function handleAIEventInput(
  userStates: Map<string, ChatState>,
  aiEventData: Map<string, { extraction: AIEventExtraction, originalInput: string }>,
  phoneNumber: string,
  messageContent: string
) {
  if (messageContent.trim().toLowerCase() === '0') {
    userStates.set(phoneNumber, ChatState.SPECIAL_MENU)
    return showSimplifiedSpecialMenu(userStates, phoneNumber)
  }

  // Obtener contexto del usuario
  const user = await DatabaseService.getUserByPhone(phoneNumber)
  const context = {
    userPhone: phoneNumber,
    isTeacher: user?.role === 'teacher',
    userName: user?.name
  }

  await WhatsAppService.sendTextMessage(
    phoneNumber,
    `🤖 Procesando tu evento...`
  )

  // Llamar a Gemini para extraer información
  const extraction = await OpenAIService.extractEventData(messageContent, context)

  // Guardar la extracción y entrada original
  aiEventData.set(phoneNumber, {
    extraction,
    originalInput: messageContent
  })

  if (extraction.confidence < 30 || extraction.needsHumanInput) {
    // Confidence muy baja, hacer preguntas de seguimiento
    let followUpMessage = extraction.validationMessage + '\n\n'
    
    if (extraction.followUpQuestions && extraction.followUpQuestions.length > 0) {
      followUpMessage += '*Ayúdame respondiendo:*\n'
      extraction.followUpQuestions.forEach((question, index) => {
        followUpMessage += `${index + 1}. ${question}\n`
      })
    }

    followUpMessage += '\n_Envía "0" para volver_'

    return WhatsAppService.sendTextMessage(phoneNumber, followUpMessage)
  }

  // Confidence aceptable, mostrar validación
  const validationMessage = OpenAIService.buildValidationMessage(extraction)
  userStates.set(phoneNumber, ChatState.AI_EVENT_VALIDATION)
  
  return WhatsAppService.sendTextMessage(phoneNumber, validationMessage)
}

// Manejador para validación de evento IA
async function handleAIEventValidation(
  userStates: Map<string, ChatState>,
  aiEventData: Map<string, { extraction: AIEventExtraction, originalInput: string }>,
  phoneNumber: string,
  normalizedMessage: string
) {
  if (normalizedMessage === '0') {
    aiEventData.delete(phoneNumber)
    userStates.set(phoneNumber, ChatState.SPECIAL_MENU)
    return showSimplifiedSpecialMenu(userStates, phoneNumber)
  }

  const storedData = aiEventData.get(phoneNumber)
  if (!storedData) {
    userStates.set(phoneNumber, ChatState.SPECIAL_MENU)
    return showSimplifiedSpecialMenu(userStates, phoneNumber)
  }

  if (['1', 'si', 'sí', 'confirmo', 'crear'].includes(normalizedMessage)) {
    // Confirmar y crear evento
    return await createEventFromAI(userStates, aiEventData, phoneNumber)
  } else if (['2', 'no', 'corregir', 'modificar'].includes(normalizedMessage)) {
    // Permitir correcciones
    userStates.set(phoneNumber, ChatState.AI_EVENT_CORRECTION)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `🔧 ¿Qué quieres corregir?

Describe los cambios que quieres hacer:

*Ejemplos:*
- "La fecha es el viernes, no el martes"
- "El horario es 21hs, no 20hs"
- "Agregar práctica a las 23hs"

_Envía "0" para volver_`
    )
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Por favor responde:

1 - ✅ Sí, crear evento
2 - ❌ Corregir algo

_Envía "0" para volver_`
    )
  }
}

// Manejador para correcciones
async function handleAIEventCorrection(
  userStates: Map<string, ChatState>,
  aiEventData: Map<string, { extraction: AIEventExtraction, originalInput: string }>,
  phoneNumber: string,
  messageContent: string
) {
  if (messageContent.trim().toLowerCase() === '0') {
    userStates.set(phoneNumber, ChatState.AI_EVENT_VALIDATION)
    const storedData = aiEventData.get(phoneNumber)
    if (storedData) {
      const validationMessage = OpenAIService.buildValidationMessage(storedData.extraction)
      return WhatsAppService.sendTextMessage(phoneNumber, validationMessage)
    }
    return showSimplifiedSpecialMenu(userStates, phoneNumber)
  }

  const storedData = aiEventData.get(phoneNumber)
  if (!storedData) {
    userStates.set(phoneNumber, ChatState.SPECIAL_MENU)
    return showSimplifiedSpecialMenu(userStates, phoneNumber)
  }

  await WhatsAppService.sendTextMessage(
    phoneNumber,
    `🤖 Procesando correcciones...`
  )

  // Usar Gemini para continuar la conversación diagnóstica
  const updatedExtraction = await OpenAIService.continueDiagnosticConversation(
    storedData.originalInput,
    storedData.extraction,
    messageContent
  )

  // Actualizar datos almacenados
  aiEventData.set(phoneNumber, {
    ...storedData,
    extraction: updatedExtraction
  })

  // Mostrar nueva validación
  const validationMessage = OpenAIService.buildValidationMessage(updatedExtraction)
  userStates.set(phoneNumber, ChatState.AI_EVENT_VALIDATION)
  
  return WhatsAppService.sendTextMessage(phoneNumber, validationMessage)
}

// Crear evento desde extracción IA
async function createEventFromAI(
  userStates: Map<string, ChatState>,
  aiEventData: Map<string, { extraction: AIEventExtraction, originalInput: string }>,
  phoneNumber: string
): Promise<any> {
  const storedData = aiEventData.get(phoneNumber)
  if (!storedData) {
    return WhatsAppService.sendTextMessage(phoneNumber, '❌ Error: No se encontraron datos del evento')
  }

  const { extraction } = storedData
  const extractedData = extraction.extractedData

  try {
    // Validar datos mínimos requeridos
    if (!extractedData.event_type || !extractedData.title || !extractedData.venue_name || !extractedData.address || !extractedData.date) {
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `❌ Faltan datos críticos para crear el evento:
        
${!extractedData.event_type ? '• Tipo de evento' : ''}
${!extractedData.title ? '• Título' : ''}
${!extractedData.venue_name ? '• Lugar' : ''}
${!extractedData.address ? '• Dirección' : ''}
${!extractedData.date ? '• Fecha' : ''}

Por favor, describe nuevamente tu evento con esta información.`
      )
    }

    // Preparar datos para crear evento
    const eventData: NewEventData = {
      event_type: extractedData.event_type,
      title: extractedData.title,
      venue_name: extractedData.venue_name,
      address: extractedData.address,
      date: extractedData.date,
      description: extractedData.description,
      has_weekly_recurrence: extractedData.has_weekly_recurrence || false,
      show_description: extractedData.show_description,
      classes: extractedData.classes,
      practice: extractedData.practice,
      pre_class: extractedData.pre_class,
      organizers: [] // Por ahora sin organizadores específicos
    }

    // Crear el evento
    const newEvent = await DatabaseService.createTangoEvent(phoneNumber, eventData)

    if (newEvent) {
      // Limpiar datos temporales
      aiEventData.delete(phoneNumber)
      userStates.set(phoneNumber, ChatState.SPECIAL_MENU)

      const eventTypeName = {
        class: 'clase',
        milonga: 'milonga', 
        seminar: 'seminario',
        special_event: 'evento especial'
      }[extractedData.event_type]

      let successMessage = `🎉 ¡Excelente! Tu ${eventTypeName} *"${extractedData.title}"* ha sido creada exitosamente.\n\n`

      if (extractedData.has_weekly_recurrence) {
        successMessage += `🔔 Recordatorio: Mensualmente te llegará una notificación para confirmar si seguís organizando esta actividad.\n\n`
      }

      successMessage += `¿Quieres crear otro evento?\n\n`
      successMessage += `1 - Crear otro evento\n`
      successMessage += `2 - Crear profesor\n`
      successMessage += `0 - Volver al menú principal`

      return WhatsAppService.sendTextMessage(phoneNumber, successMessage)
    } else {
      userStates.set(phoneNumber, ChatState.START)
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `❌ Ocurrió un error al crear tu evento.\n\nPor favor intenta nuevamente más tarde.`
      )
    }
  } catch (error) {
    console.error('Error creating event from AI:', error)
    userStates.set(phoneNumber, ChatState.START)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❌ Ocurrió un error al crear tu evento.\n\nPor favor intenta nuevamente más tarde.`
    )
  }
}

async function handleMainMenuOptions(
  userStates: Map<string, ChatState>,
  phoneNumber: string,
  normalizedMessage: string
) {
  if (['1', 'hoy'].includes(normalizedMessage)) {
    return caseToday(userStates, tempEventData, phoneNumber)
  } else if (['2', 'semana'].includes(normalizedMessage)) {
    return caseWeek(userStates, tempEventData, phoneNumber)
  } else if (['3'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.MENU_18_35)
    return WhatsAppService.sendTextMessage(phoneNumber, `En proceso...`)
  } else if (['4'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.MENU_REPORT)
    return WhatsAppService.sendTextMessage(phoneNumber, `En proceso...`)
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `No entendí. Por favor elegí una opción del menú con el número correspondiente.

${getMainMenuMessage()}`
    )
  }
}