import { WhatsAppService } from '../../services/whatsapp'
import { DatabaseService } from '../../services/database'
import {
  ChatState,
  NewTeacherData
} from '../../types/processTangoConversation'

const tempData = new Map<string, NewTeacherData>()

const MESSAGES = {
  TEACHER_NAME_PROMPT: `👨‍🏫 ¡Perfecto! Vamos a registrarte como nuevo profesor.

¿Cuál es tu nombre completo?
*Ejemplo:* María González`,

  PASSWORD_PROMPT: `Ahora necesito que crees una contraseña personal. Esta contraseña te permitirá acceder al menú de profesor sin usar el código secreto.

*Debe tener al menos 6 caracteres*
*Ejemplo:* MiPassword123`,

  DETAILS_PROMPT: `🔐 Contraseña creada exitosamente.

Ahora cuéntame un poco sobre ti. Esta información será visible para los alumnos interesados en tus clases.

*Ejemplo:* "Soy profesor de tango desde hace 10 años, especializado en técnica y musicalidad. Doy clases en el centro de Mar del Plata."`,

  CONFIRMATION_PROMPT: (data: NewTeacherData) => `📋 *CONFIRMACIÓN DE DATOS DE PROFESOR*

👤 *Nombre:* ${data.name}
🔑 *Contraseña:* ${'*'.repeat(data.password?.length || 0)}
📝 *Descripción:* ${data.details}

¿Confirmas que todos los datos están correctos?
1 - ✅ Sí, crear mi cuenta de profesor
2 - ❌ No, quiero modificar algo`,

  SUCCESS: (name: string) => `🎉 ¡Felicitaciones ${name}! 

Tu cuenta de profesor ha sido creada exitosamente. Ahora tienes acceso al menú especial.

📋 ¿Qué te gustaría hacer?

1 - Crear *clase*
2 - Crear *milonga*
3 - Crear *seminario*
4 - Crear *práctica*  
5 - Crear *evento especial*
6 - Modificar un *evento*`,

  ERROR: `❌ Ocurrió un error al crear tu cuenta de profesor. 

Por favor intenta nuevamente más tarde o contacta al administrador.`,

  RESTART: `🔄 Perfecto, empecemos de nuevo.

¿Cuál es tu nombre completo?
*Ejemplo:* María González`
}

// Validaciones helper
const validateInput = {
  name: (input: string) => input.trim().length >= 2,
  password: (input: string) => input.trim().length >= 6,
  details: (input: string) => input.trim().length >= 10
}

const sendError = (phoneNumber: string, message: string, example?: string) => {
  return WhatsAppService.sendTextMessage(
    phoneNumber,
    `❌ ${message}${example ? `\n\n*Ejemplo:* ${example}` : ''}`
  )
}

export const handleTeacherCreation = async (
  userStates: Map<string, ChatState>,
  phoneNumber: string,
  messageContent: string
) => {
  const currentState = userStates.get(phoneNumber)

  switch (currentState) {
    case ChatState.NEW_TEACHER_NAME:
      return handleTeacherName(userStates, phoneNumber, messageContent)
    case ChatState.NEW_TEACHER_PASSWORD:
      return handleTeacherPassword(userStates, phoneNumber, messageContent)
    case ChatState.NEW_TEACHER_DETAILS:
      return handleTeacherDetails(userStates, phoneNumber, messageContent)
    case ChatState.NEW_TEACHER_CONFIRMATION:
      return handleTeacherConfirmation(userStates, phoneNumber, messageContent)
    default:
      return WhatsAppService.sendTextMessage(phoneNumber, `😅 Algo salió mal, volvamos a empezar.`)
  }
}

async function handleTeacherName(
  userStates: Map<string, ChatState>,
  phoneNumber: string,
  messageContent: string
) {
  const name = messageContent.trim()
  
  if (!validateInput.name(name)) {
    return sendError(phoneNumber, 'El nombre debe tener al menos 2 caracteres.', 'María González')
  }

  const teacherData = tempData.get(phoneNumber) || {}
  teacherData.name = name
  tempData.set(phoneNumber, teacherData)
  userStates.set(phoneNumber, ChatState.NEW_TEACHER_PASSWORD)

  return WhatsAppService.sendTextMessage(
    phoneNumber,
    `✅ Nombre registrado: *${name}*\n\n${MESSAGES.PASSWORD_PROMPT}`
  )
}

async function handleTeacherPassword(
  userStates: Map<string, ChatState>,
  phoneNumber: string,
  messageContent: string
) {
  const password = messageContent.trim()
  
  if (!validateInput.password(password)) {
    return sendError(phoneNumber, 'La contraseña debe tener al menos 6 caracteres.', 'MiPassword123')
  }

  const teacherData = tempData.get(phoneNumber) as NewTeacherData
  teacherData.password = password
  tempData.set(phoneNumber, teacherData)
  userStates.set(phoneNumber, ChatState.NEW_TEACHER_DETAILS)

  return WhatsAppService.sendTextMessage(phoneNumber, MESSAGES.DETAILS_PROMPT)
}

async function handleTeacherDetails(
  userStates: Map<string, ChatState>,
  phoneNumber: string,
  messageContent: string
) {
  const details = messageContent.trim()
  
  if (!validateInput.details(details)) {
    return sendError(
      phoneNumber, 
      'La descripción debe ser más detallada (mínimo 10 caracteres).',
      '"Soy profesor de tango desde hace 10 años, especializado en técnica y musicalidad."'
    )
  }

  const teacherData = tempData.get(phoneNumber) as NewTeacherData
  teacherData.details = details
  tempData.set(phoneNumber, teacherData)
  userStates.set(phoneNumber, ChatState.NEW_TEACHER_CONFIRMATION)

  return WhatsAppService.sendTextMessage(phoneNumber, MESSAGES.CONFIRMATION_PROMPT(teacherData))
}

async function handleTeacherConfirmation(
  userStates: Map<string, ChatState>,
  phoneNumber: string,
  messageContent: string
) {
  const normalizedMessage = messageContent.trim().toLowerCase()

  if (['1', 'si', 'sí', 'confirmo', 'yes'].includes(normalizedMessage)) {
    return await createTeacher(userStates, phoneNumber)
  } else if (['2', 'no', 'modificar'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.NEW_TEACHER_NAME)
    return WhatsAppService.sendTextMessage(phoneNumber, MESSAGES.RESTART)
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Por favor responde:\n1 - Sí, crear mi cuenta\n2 - No, modificar datos`
    )
  }
}

async function createTeacher(
  userStates: Map<string, ChatState>,
  phoneNumber: string
) {
  const finalTeacherData = tempData.get(phoneNumber) as NewTeacherData

  try {
    const newTeacher = await DatabaseService.createTeacher(phoneNumber, {
      name: finalTeacherData.name!,
      password: finalTeacherData.password!,
      details: finalTeacherData.details!
    })

    tempData.delete(phoneNumber)

    if (newTeacher) {
      userStates.set(phoneNumber, ChatState.SPECIAL_MENU)
      return WhatsAppService.sendTextMessage(phoneNumber, MESSAGES.SUCCESS(finalTeacherData.name!))
    } else {
      userStates.set(phoneNumber, ChatState.START)
      return WhatsAppService.sendTextMessage(phoneNumber, MESSAGES.ERROR)
    }
  } catch (error) {
    console.error('Error creating teacher:', error)
    userStates.set(phoneNumber, ChatState.START)
    return WhatsAppService.sendTextMessage(phoneNumber, MESSAGES.ERROR)
  }
}

export const startTeacherCreation = async (
  userStates: Map<string, ChatState>,
  phoneNumber: string
) => {
  userStates.set(phoneNumber, ChatState.NEW_TEACHER_NAME)
  tempData.set(phoneNumber, {})
  return WhatsAppService.sendTextMessage(phoneNumber, MESSAGES.TEACHER_NAME_PROMPT)
}