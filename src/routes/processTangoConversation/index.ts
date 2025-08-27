import { WhatsAppService } from '../../services/whatsapp'
import { DatabaseService } from '../../services/database'
import { ChatState, TempEventData, NewEventData } from '../../types/processTangoConversation'
import { getMainMenuMessage } from './utils'
import { caseToday, caseWeek, handleEventSelection } from './showEvents'
import { handleTeacherCreation } from './createTeacher'
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

      if (existingUser && existingUser.role !== 'normal_query') {
        console.log(
          `Usuario conocido detectado: ${existingUser.name} (${existingUser.role})`
        )
        return showSpecialMenu(userStates, phoneNumber)
      } else {
        userStates.set(phoneNumber, ChatState.SECRET_CODE)
        return WhatsAppService.sendTextMessage(
          phoneNumber,
          `🔐 ¡Accediste al menú secreto!

¿Eres un nuevo profesor?
1 - Sí
2 - No`
        )
      }
    } catch (error) {
      console.error('Error verificando usuario existente:', error)
      userStates.set(phoneNumber, ChatState.SECRET_CODE)
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `🔐 ¡Accediste al menú secreto!

¿Eres un nuevo profesor?
1 - Sí
2 - No`
      )
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

    case ChatState.SECRET_CODE:
      return handleSecretCode(userStates, phoneNumber, normalizedMessage)

    case ChatState.NEW_TEACHER_NAME:
    case ChatState.NEW_TEACHER_PASSWORD:
    case ChatState.NEW_TEACHER_DETAILS:
    case ChatState.NEW_TEACHER_CONFIRMATION:
      return handleTeacherCreation(userStates, phoneNumber, messageContent)

    // NEW EVENT CREATION STATES
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
    case ChatState.CREATE_EVENT_PRICING_DETAILS:
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

async function handleSecretCode(
  userStates: Map<string, ChatState>,
  phoneNumber: string,
  normalizedMessage: string
) {
  if (['1', 'sí', 'si', 'yes'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.NEW_TEACHER_NAME)
    return handleTeacherCreation(userStates, phoneNumber, '')
  } else if (['2', 'no'].includes(normalizedMessage)) {
    return showSpecialMenu(userStates, phoneNumber)
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `Opción inválida. ¿Eres un nuevo profesor?\n1 - Sí\n2 - No`
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
