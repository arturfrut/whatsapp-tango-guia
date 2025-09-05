import { WhatsAppService } from '../../services/whatsapp'
import { DatabaseService } from '../../services/database'
import {
  ChatState,
  TempEventData,
  NewEventData
} from '../../types/processTangoConversation'
import { getMainMenuMessage } from './utils'
import { caseToday, caseWeek, handleEventSelection } from './showEvents'
import {
  handleTeacherCreation,
  startTeacherCreation,
} from './createTeacher'
import { handleNewEventCreation, showSpecialMenu } from './createEvent'

const secretWord = process.env.SECRETWORD

const userStates = new Map<string, ChatState>()
const tempEventData = new Map<string, TempEventData>()
const newEventData = new Map<string, NewEventData>()

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
        return showSpecialMenuWithCreateTeacher(userStates, phoneNumber)
      } else if (existingUser && existingUser.role !== 'normal_query') {
        console.log(
          `Usuario especial detectado: ${existingUser.name} (${existingUser.role})`
        )
        const welcomeName = existingUser.name || 'Usuario'
        await WhatsAppService.sendTextMessage(
          phoneNumber,
          `¡Hola! ${welcomeName} Entraste al menú secreto`
        )
        return showSpecialMenuWithCreateTeacher(userStates, phoneNumber)
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
    case ChatState.CREATE_EVENT_TITLE:
    case ChatState.CREATE_EVENT_VENUE:
    case ChatState.CREATE_EVENT_ADDRESS:
    case ChatState.CREATE_EVENT_DATE:
    case ChatState.CREATE_CLASS_SINGLE_OR_MULTIPLE:
    case ChatState.CREATE_CLASS_TIME:
    case ChatState.CREATE_CLASS_LEVEL:
    case ChatState.CREATE_CLASS_ADD_ANOTHER:
    case ChatState.CREATE_CLASS_PRACTICE:
    case ChatState.CREATE_CLASS_PRACTICE_TIME:
    case ChatState.CREATE_MILONGA_TIME:
    case ChatState.CREATE_MILONGA_PRE_CLASS:
    case ChatState.CREATE_MILONGA_PRE_CLASS_DETAILS:
    case ChatState.CREATE_MILONGA_SHOW:
    case ChatState.CREATE_SPECIAL_TIME:
    case ChatState.CREATE_EVENT_ORGANIZERS:
    case ChatState.CREATE_EVENT_ORGANIZER_SELF:
    case ChatState.CREATE_EVENT_ORGANIZER_ADDITIONAL:
    case ChatState.CREATE_EVENT_ORGANIZER_SEARCH:
    case ChatState.CREATE_EVENT_ORGANIZER_SELECT:
    case ChatState.CREATE_EVENT_ORGANIZER_ONE_TIME:
    case ChatState.CREATE_EVENT_RECURRENCE:
    case ChatState.CREATE_EVENT_CONTACT:
    case ChatState.CREATE_EVENT_CONTACT_NUMBER:
    case ChatState.CREATE_EVENT_REMINDER:
    case ChatState.CREATE_EVENT_REMINDER_NUMBER:
    case ChatState.CREATE_EVENT_DESCRIPTION:
    case ChatState.CREATE_EVENT_PRICING:
    case ChatState.CREATE_EVENT_PRICING_TYPE:
    case ChatState.CREATE_EVENT_PRICING_DETAILS: 
    case ChatState.CREATE_EVENT_PRICING_AMOUNT: 
    case ChatState.CREATE_EVENT_PRICING_ADD_MORE:
    case ChatState.CREATE_EVENT_CONFIRMATION:
      return handleNewEventCreation(
        userStates,
        newEventData,
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

export const showSpecialMenuWithCreateTeacher = async (
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
5 - Crear *profesor* (otra persona)
6 - Modificar un *evento*

0 - Volver al menú principal`
  )
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
