import { WhatsAppService } from '../../services/whatsapp'
import { DatabaseService } from '../../services/database'
import {
  ChatState,
  TempEventData,
  AIEventDataStore
} from '../../types/processTangoConversation'
import { getMainMenuMessage } from './utils'
import { caseToday, caseWeek, handleEventSelection } from './showEvents'
import { handleTeacherCreation, startTeacherCreation } from './createTeacher'
import { handleEventCreation } from './createEvent' 

const secretWord = process.env.SECRETWORD

const userStates = new Map<string, ChatState>()
const tempEventData = new Map<string, TempEventData>()
const aiEventData = new Map<string, AIEventDataStore>()

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
      return handleSpecialMenuOptions(
        userStates,
        phoneNumber,
        normalizedMessage
      )

    case ChatState.AI_EVENT_INPUT:
    case ChatState.AI_EVENT_TEACHER_SEARCH:
    case ChatState.AI_EVENT_TEACHER_SELECT:
    case ChatState.AI_EVENT_TEACHER_CREATE:
    case ChatState.AI_EVENT_VALIDATION:
    case ChatState.AI_EVENT_CORRECTION:
      return handleEventCreation(
        userStates,
        aiEventData,
        phoneNumber,
        messageContent
      )

    default:
      userStates.set(phoneNumber, ChatState.START)
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `Algo salió mal, volvamos a empezar.`
      )
  }
}

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

Describe tu evento lo más completo posible. Cuanta más información des, menos preguntas te haré después.

*Incluye:*
- Tipo (clase, milonga, seminario)
- Día y horario
- Lugar y dirección
- Profesor/organizador (opcional)
- Precio (opcional)

*Ejemplos:*

"Clase de tango principiantes todos los martes 20hs en UADE Magallanes 2025, la da Juan López, $5000"

"Milonga el sábado 21hs en La Trastienda con clase previa 19:30"

💡 No es necesario que esté perfecto, puedo ayudarte a completar lo que falte.

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
