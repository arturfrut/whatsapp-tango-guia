import { WhatsAppService } from '../../services/whatsapp'
import { DatabaseService } from '../../services/database'
import {
  ChatState,
  NewTeacherData
} from '../../types/processTangoConversation'

const tempData = new Map<string, NewTeacherData>()

const MESSAGES = {
  TEACHER_NAME_PROMPT: `👨‍🏫 ¡Perfecto! Vamos a crear tu perfil de profesor.

¿Cuál es tu nombre completo?
*Ejemplo:* María González`,

  TEACHER_DETAILS_PROMPT: `Ahora cuéntame un poco sobre ti. Esta información será visible para los alumnos interesados en tus clases.

*Ejemplo:* "Soy profesor de tango desde hace 10 años, especializado en técnica y musicalidad. Doy clases en el centro de Mar del Plata."`,

  CONFIRMATION_PROMPT: (data: NewTeacherData) => `📋 *CONFIRMACIÓN DE DATOS DE PROFESOR*

👤 *Nombre:* ${data.name}
📝 *Descripción:* ${data.details}

¿Confirmas que todos los datos están correctos?
1 - ✅ Sí, crear mi perfil
2 - ❌ No, quiero modificar algo`,

  SUCCESS: (name: string) => `🎉 ¡Felicitaciones ${name}! 

Tu perfil de profesor ha sido creado exitosamente.

📋 ¿Qué te gustaría hacer?

1 - Crear *clase*
2 - Crear *milonga*
3 - Crear *seminario*
4 - Crear *evento especial*
5 - Crear *profesor* (otra persona)
6 - Modificar un *evento*

0 - Volver al menú principal`,

  ERROR: `❌ Ocurrió un error al crear tu perfil de profesor. 

Por favor intenta nuevamente más tarde o contacta al administrador.`,

  RESTART: `🔄 Perfecto, empecemos de nuevo.

¿Cuál es tu nombre completo?
*Ejemplo:* María González`,

  // Nuevos mensajes para crear profesor de otra persona
  CREATE_OTHER_TEACHER_PHONE: `📱 ¿Cuál es el número de teléfono del profesor?

*Formato:* 2236028315 (sin 0, ni 15, ni +54)
*Ejemplo:* 2236028315

_Envía "0" para volver_`,

  CREATE_OTHER_TEACHER_NAME: `👤 ¿Cuál es el nombre completo del profesor?

*Ejemplo:* Juan Pérez

_Envía "0" para volver_`,

  CREATE_OTHER_TEACHER_DETAILS: `📝 Descripción del profesor (opcional)

Esta información será visible para los alumnos.

*Ejemplo:* "Profesor de tango especializado en milonga."

Escribe "." para omitir

_Envía "0" para volver_`,

  CREATE_OTHER_TEACHER_CONFIRMATION: (data: NewTeacherData) => `📋 *CONFIRMACIÓN DE NUEVO PROFESOR*

📱 *Teléfono:* +549${data.phone}
👤 *Nombre:* ${data.name}
📝 *Descripción:* ${data.details || 'Sin descripción'}

¿Confirmas que todos los datos están correctos?
1 - ✅ Sí, crear profesor
2 - ❌ No, quiero modificar algo`,

  CREATE_OTHER_TEACHER_SUCCESS: (name: string) => `🎉 ¡Profesor ${name} creado exitosamente!

Ahora cuando esa persona entre al sistema será reconocida automáticamente.

¿Qué te gustaría hacer?

1 - Crear *clase*
2 - Crear *milonga*
3 - Crear *seminario*
4 - Crear *evento especial*
5 - Crear *profesor* (otra persona)
6 - Modificar un *evento*

0 - Volver al menú principal`
}

// Validaciones helper
const validateInput = {
  name: (input: string) => input.trim().length >= 2,
  details: (input: string) => input.trim().length >= 10,
  phone: (input: string) => {
    const cleaned = input.trim().replace(/\D/g, '')
    return cleaned.length === 10 && cleaned.startsWith('2')
  }
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
    case ChatState.NEW_TEACHER_DETAILS:
      return handleTeacherDetails(userStates, phoneNumber, messageContent)
    case ChatState.NEW_TEACHER_CONFIRMATION:
      return handleTeacherConfirmation(userStates, phoneNumber, messageContent)
    
    // Nuevos estados para crear profesor de otra persona
    case ChatState.CREATE_OTHER_TEACHER_PHONE:
      return handleOtherTeacherPhone(userStates, phoneNumber, messageContent)
    case ChatState.CREATE_OTHER_TEACHER_NAME:
      return handleOtherTeacherName(userStates, phoneNumber, messageContent)
    case ChatState.CREATE_OTHER_TEACHER_DETAILS:
      return handleOtherTeacherDetails(userStates, phoneNumber, messageContent)
    case ChatState.CREATE_OTHER_TEACHER_CONFIRMATION:
      return handleOtherTeacherConfirmation(userStates, phoneNumber, messageContent)
    
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
  userStates.set(phoneNumber, ChatState.NEW_TEACHER_DETAILS)

  return WhatsAppService.sendTextMessage(
    phoneNumber,
    `✅ Nombre registrado: *${name}*\n\n${MESSAGES.TEACHER_DETAILS_PROMPT}`
  )
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
      `❓ Por favor responde:\n1 - Sí, crear mi perfil\n2 - No, modificar datos`
    )
  }
}

async function createTeacher(
  userStates: Map<string, ChatState>,
  phoneNumber: string
) {
  const finalTeacherData = tempData.get(phoneNumber) as NewTeacherData

  try {
    const newTeacher = await DatabaseService.createTeacherProfile(phoneNumber, {
      name: finalTeacherData.name!,
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

async function handleOtherTeacherPhone(
  userStates: Map<string, ChatState>,
  phoneNumber: string,
  messageContent: string
) {
  const normalizedMessage = messageContent.trim().toLowerCase()
  
  if (normalizedMessage === '0' || normalizedMessage === 'volver') {
    userStates.set(phoneNumber, ChatState.SPECIAL_MENU)
    return WhatsAppService.sendTextMessage(phoneNumber, `Volviendo al menú principal...`)
  }

  const phone = messageContent.trim()
  
  if (!validateInput.phone(phone)) {
    return sendError(
      phoneNumber, 
      'Formato de teléfono inválido. Debe tener 10 dígitos y comenzar con 2.',
      '2236028315'
    )
  }

  const fullPhone = `549${phone}`
  const existingUser = await DatabaseService.getUserByPhone(fullPhone)
  if (existingUser) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❌ Ya existe un profesor con ese número de teléfono.

*Nombre:* ${existingUser.name || 'Sin nombre'}

¿Intentar con otro número?

_Envía "0" para volver_`
    )
  }

  const teacherData = tempData.get(phoneNumber) || {}
  teacherData.phone = phone
  tempData.set(phoneNumber, teacherData)
  userStates.set(phoneNumber, ChatState.CREATE_OTHER_TEACHER_NAME)

  return WhatsAppService.sendTextMessage(
    phoneNumber,
    `✅ Teléfono: *+549${phone}*\n\n${MESSAGES.CREATE_OTHER_TEACHER_NAME}`
  )
}

async function handleOtherTeacherName(
  userStates: Map<string, ChatState>,
  phoneNumber: string,
  messageContent: string
) {
  const normalizedMessage = messageContent.trim().toLowerCase()
  
  if (normalizedMessage === '0' || normalizedMessage === 'volver') {
    userStates.set(phoneNumber, ChatState.CREATE_OTHER_TEACHER_PHONE)
    return WhatsAppService.sendTextMessage(phoneNumber, MESSAGES.CREATE_OTHER_TEACHER_PHONE)
  }

  const name = messageContent.trim()
  
  if (!validateInput.name(name)) {
    return sendError(phoneNumber, 'El nombre debe tener al menos 2 caracteres.', 'Juan Pérez')
  }

  const teacherData = tempData.get(phoneNumber) as NewTeacherData
  teacherData.name = name
  tempData.set(phoneNumber, teacherData)
  userStates.set(phoneNumber, ChatState.CREATE_OTHER_TEACHER_DETAILS)

  return WhatsAppService.sendTextMessage(
    phoneNumber,
    `✅ Nombre: *${name}*\n\n${MESSAGES.CREATE_OTHER_TEACHER_DETAILS}`
  )
}

async function handleOtherTeacherDetails(
  userStates: Map<string, ChatState>,
  phoneNumber: string,
  messageContent: string
) {
  const normalizedMessage = messageContent.trim().toLowerCase()
  
  if (normalizedMessage === '0' || normalizedMessage === 'volver') {
    userStates.set(phoneNumber, ChatState.CREATE_OTHER_TEACHER_NAME)
    return WhatsAppService.sendTextMessage(phoneNumber, MESSAGES.CREATE_OTHER_TEACHER_NAME)
  }

  const details = messageContent.trim()
  const teacherData = tempData.get(phoneNumber) as NewTeacherData

  if (details === '.' || details === '-') {
    // Permite omitir con "." o "-"
    teacherData.details = undefined
    tempData.set(phoneNumber, teacherData)
    userStates.set(phoneNumber, ChatState.CREATE_OTHER_TEACHER_CONFIRMATION)
    return WhatsAppService.sendTextMessage(phoneNumber, MESSAGES.CREATE_OTHER_TEACHER_CONFIRMATION(teacherData))
  } else if (details.length < 5) {
    return sendError(
      phoneNumber, 
      'La descripción debe tener al menos 5 caracteres o escribir "." para omitir.',
      '"Profesor de tango especializado en milonga."'
    )
  } else {
    teacherData.details = details
    tempData.set(phoneNumber, teacherData)
    userStates.set(phoneNumber, ChatState.CREATE_OTHER_TEACHER_CONFIRMATION)
    return WhatsAppService.sendTextMessage(phoneNumber, MESSAGES.CREATE_OTHER_TEACHER_CONFIRMATION(teacherData))
  }
}

async function handleOtherTeacherConfirmation(
  userStates: Map<string, ChatState>,
  phoneNumber: string,
  messageContent: string
) {
  const normalizedMessage = messageContent.trim().toLowerCase()

  if (['1', 'si', 'sí', 'confirmo', 'crear'].includes(normalizedMessage)) {
    return await createOtherTeacher(userStates, phoneNumber)
  } else if (['2', 'no', 'modificar'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.CREATE_OTHER_TEACHER_PHONE)
    return WhatsAppService.sendTextMessage(phoneNumber, `🔄 Empecemos de nuevo.\n\n${MESSAGES.CREATE_OTHER_TEACHER_PHONE}`)
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Por favor responde:\n1 - Sí, crear profesor\n2 - No, modificar datos`
    )
  }
}

async function createOtherTeacher(
  userStates: Map<string, ChatState>,
  phoneNumber: string
) {
  const finalTeacherData = tempData.get(phoneNumber) as NewTeacherData

  try {
    const fullPhone = `+549${finalTeacherData.phone}`
    const newTeacher = await DatabaseService.createTeacherProfile(fullPhone, {
      name: finalTeacherData.name!,
      details: finalTeacherData.details
    })

    tempData.delete(phoneNumber)

    if (newTeacher) {
      userStates.set(phoneNumber, ChatState.SPECIAL_MENU)
      return WhatsAppService.sendTextMessage(phoneNumber, MESSAGES.CREATE_OTHER_TEACHER_SUCCESS(finalTeacherData.name!))
    } else {
      userStates.set(phoneNumber, ChatState.START)
      return WhatsAppService.sendTextMessage(phoneNumber, MESSAGES.ERROR)
    }
  } catch (error) {
    console.error('Error creating other teacher:', error)
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

export const startOtherTeacherCreation = async (
  userStates: Map<string, ChatState>,
  phoneNumber: string
) => {
  userStates.set(phoneNumber, ChatState.CREATE_OTHER_TEACHER_PHONE)
  tempData.set(phoneNumber, {})
  return WhatsAppService.sendTextMessage(phoneNumber, MESSAGES.CREATE_OTHER_TEACHER_PHONE)
}