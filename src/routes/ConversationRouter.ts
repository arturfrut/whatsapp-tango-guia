import { WhatsAppService } from '../services/whatsapp'
import { DatabaseService } from '../services/database'
import { StateManager } from '../modules/common/StateManager'
import { EventHandler } from '../modules/event/EventHandler'
import { EventBuilder } from '../modules/event/EventBuilder'
import { TeacherHandler } from '../modules/teacher/TeacherHandler'
import { MenuHandler } from '../modules/menu/MenuHandler'
import {
  ChatState,
  ConversationContext,
  NewEventData,
  NewTeacherData,
  TempEventData,
  EventType
} from '../modules/common/types'

// Global state management
const userStates = new Map<string, ChatState>()
const eventTempData = new Map<string, NewEventData>()
const teacherTempData = new Map<string, NewTeacherData>()
const menuTempData = new Map<string, TempEventData>()

// Handler instances
const eventHandler = new EventHandler()
const teacherHandler = new TeacherHandler()
const menuHandler = new MenuHandler()

// Secret word for special access
const secretWord = process.env.SECRETWORD

export async function handleConversation(
  phoneNumber: string,
  messageContent: string
): Promise<void> {
  const normalizedMessage = messageContent.trim().toLowerCase()
  const currentState = userStates.get(phoneNumber) || ChatState.START

  console.log(`🔄 ConversationRouter - Phone: ${phoneNumber}, State: ${currentState}, Message: "${messageContent}"`)

  // Handle secret word access
  if (normalizedMessage === secretWord) {
    await handleSecretWordAccess(phoneNumber)
    return
  }

  // Create conversation context
  const context: ConversationContext = {
    phoneNumber,
    messageContent,
    currentState,
    normalizedMessage
  }

  try {
    // Route to appropriate handler based on current state
    if (eventHandler.canHandle(currentState)) {
      await handleEventFlow(context)
    } else if (teacherHandler.canHandle(currentState)) {
      await handleTeacherFlow(context)
    } else if (menuHandler.canHandle(currentState)) {
      await handleMenuFlow(context)
    } else {
      // Fallback to start
      console.warn(`⚠️ Unknown state: ${currentState}, resetting to START`)
      await resetToStart(phoneNumber)
    }
  } catch (error) {
    console.error('❌ Error in ConversationRouter:', error)
    await WhatsAppService.sendTextMessage(
      phoneNumber,
      "😅 Algo salió mal, volvamos a empezar."
    )
    await resetToStart(phoneNumber)
  }
}

// =============================================
// SECRET WORD ACCESS
// =============================================

async function handleSecretWordAccess(phoneNumber: string): Promise<void> {
  try {
    const existingUser = await DatabaseService.getUserByPhone(phoneNumber)

    if (existingUser && existingUser.role === 'teacher') {
      console.log(`Usuario profesor conocido: ${existingUser.name} (${existingUser.role})`)
      const welcomeName = existingUser.name || 'Profesor'
      await WhatsAppService.sendTextMessage(
        phoneNumber,
        `¡Hola! ${welcomeName} Entraste al menú secreto`
      )
      userStates.set(phoneNumber, ChatState.SPECIAL_MENU)
      await WhatsAppService.sendTextMessage(phoneNumber, getSpecialMenuMessage())
    } else if (existingUser && existingUser.role !== 'normal_query') {
      console.log(`Usuario especial: ${existingUser.name} (${existingUser.role})`)
      const welcomeName = existingUser.name || 'Usuario'
      await WhatsAppService.sendTextMessage(
        phoneNumber,
        `¡Hola! ${welcomeName} Entraste al menú secreto`
      )
      userStates.set(phoneNumber, ChatState.SPECIAL_MENU)
      await WhatsAppService.sendTextMessage(phoneNumber, getSpecialMenuMessage())
    } else {
      console.log('Primera vez o usuario normal, iniciando creación de profesor')
      await WhatsAppService.sendTextMessage(
        phoneNumber,
        `¡Hola! Es la primera vez que entras, vamos a crear tu usuario.`
      )
      userStates.set(phoneNumber, ChatState.NEW_TEACHER_NAME)
      teacherTempData.set(phoneNumber, {})
      await WhatsAppService.sendTextMessage(phoneNumber, getTeacherNamePrompt())
    }
  } catch (error) {
    console.error('Error verificando usuario:', error)
    await WhatsAppService.sendTextMessage(
      phoneNumber,
      `¡Hola! Es la primera vez que entras, vamos a crear tu usuario.`
    )
    userStates.set(phoneNumber, ChatState.NEW_TEACHER_NAME)
    teacherTempData.set(phoneNumber, {})
    await WhatsAppService.sendTextMessage(phoneNumber, getTeacherNamePrompt())
  }
}

// =============================================
// FLOW HANDLERS
// =============================================

async function handleEventFlow(context: ConversationContext): Promise<void> {
  const result = await eventHandler.handle(context)
  
  if (result.success && result.nextState) {
    const prevState = context.currentState
    const nextState = result.nextState
    
    // Update state
    userStates.set(context.phoneNumber, nextState)
    
    // Handle data updates based on state transitions
    await updateEventData(context, prevState, nextState)
    
    // Handle special transitions
    if (nextState === ChatState.START) {
      eventTempData.delete(context.phoneNumber)
    }
    
    StateManager.logStateTransition(context.phoneNumber, prevState, nextState, 'EventHandler')
  } else {
    console.error(`EventHandler failed: ${result.error}`)
  }
}

async function handleTeacherFlow(context: ConversationContext): Promise<void> {
  const result = await teacherHandler.handle(context)
  
  if (result.success && result.nextState) {
    const prevState = context.currentState
    const nextState = result.nextState
    
    // Update state
    userStates.set(context.phoneNumber, nextState)
    
    // Handle data updates based on state transitions
    await updateTeacherData(context, prevState, nextState)
    
    // Handle special transitions
    if (nextState === ChatState.START) {
      teacherTempData.delete(context.phoneNumber)
    }
    
    StateManager.logStateTransition(context.phoneNumber, prevState, nextState, 'TeacherHandler')
  } else {
    console.error(`TeacherHandler failed: ${result.error}`)
  }
}

async function handleMenuFlow(context: ConversationContext): Promise<void> {
  const result = await menuHandler.handle(context)
  
  if (result.success && result.nextState) {
    const prevState = context.currentState
    const nextState = result.nextState
    
    // Update state
    userStates.set(context.phoneNumber, nextState)
    
    // Handle special menu transitions
    await handleMenuTransitions(context, prevState, nextState)
    
    StateManager.logStateTransition(context.phoneNumber, prevState, nextState, 'MenuHandler')
  } else {
    console.error(`MenuHandler failed: ${result.error}`)
  }
}

// =============================================
// DATA MANAGEMENT - EVENT FLOW
// =============================================

async function updateEventData(
  context: ConversationContext,
  prevState: ChatState,
  nextState: ChatState
): Promise<void> {
  let eventData = eventTempData.get(context.phoneNumber)

  switch (prevState) {
    case ChatState.SPECIAL_MENU:
      if (nextState === ChatState.CREATE_EVENT_TITLE) {
        // Extract event type from message
        const eventType = extractEventTypeFromMessage(context.messageContent)
        if (eventType) {
          eventData = EventBuilder.createNewEvent(eventType)
          eventTempData.set(context.phoneNumber, eventData)
        }
      }
      break

    case ChatState.CREATE_EVENT_TITLE:
      if (eventData) {
        eventData = EventBuilder.setTitle(eventData, context.messageContent.trim())
        eventTempData.set(context.phoneNumber, eventData)
      }
      break

    case ChatState.CREATE_EVENT_VENUE:
      if (eventData) {
        eventData = EventBuilder.setVenue(eventData, context.messageContent.trim())
        eventTempData.set(context.phoneNumber, eventData)
      }
      break

    case ChatState.CREATE_EVENT_ADDRESS:
      if (eventData) {
        eventData = EventBuilder.setAddress(eventData, context.messageContent.trim())
        eventTempData.set(context.phoneNumber, eventData)
      }
      break

    case ChatState.CREATE_EVENT_DATE:
      if (eventData) {
        // Date would be validated by the handler, so we trust the parsed value
        const parsedDate = parseDateFromMessage(context.messageContent)
        if (parsedDate) {
          eventData = EventBuilder.setDate(eventData, parsedDate)
          eventTempData.set(context.phoneNumber, eventData)
        }
      }
      break

    case ChatState.CREATE_CLASS_TIME:
      if (eventData) {
        const parsedTime = parseTimeFromMessage(context.messageContent)
        if (parsedTime) {
          const currentIndex = EventBuilder.getCurrentClassIndex(eventData)
          if (!eventData.classes || eventData.classes.length <= currentIndex) {
            eventData = EventBuilder.addClass(eventData, { start_time: parsedTime })
          } else {
            eventData = EventBuilder.updateCurrentClass(eventData, { start_time: parsedTime })
          }
          eventTempData.set(context.phoneNumber, eventData)
        }
      }
      break

    case ChatState.CREATE_EVENT_CONFIRMATION:
      if (nextState === ChatState.SPECIAL_MENU && context.normalizedMessage.includes('1')) {
        // Confirmed - save to database
        await saveEventToDatabase(context.phoneNumber, eventData!)
        eventTempData.delete(context.phoneNumber)
      }
      break
  }
}

// =============================================
// DATA MANAGEMENT - TEACHER FLOW
// =============================================

async function updateTeacherData(
  context: ConversationContext,
  prevState: ChatState,
  nextState: ChatState
): Promise<void> {
  let teacherData = teacherTempData.get(context.phoneNumber) || {}

  switch (prevState) {
    case ChatState.NEW_TEACHER_NAME:
      teacherData.name = context.messageContent.trim()
      teacherTempData.set(context.phoneNumber, teacherData)
      break

    case ChatState.NEW_TEACHER_DETAILS:
      teacherData.details = context.messageContent.trim()
      teacherTempData.set(context.phoneNumber, teacherData)
      break

    case ChatState.CREATE_OTHER_TEACHER_PHONE:
      teacherData.phone = context.messageContent.trim()
      teacherTempData.set(context.phoneNumber, teacherData)
      break

    case ChatState.CREATE_OTHER_TEACHER_NAME:
      teacherData.name = context.messageContent.trim()
      teacherTempData.set(context.phoneNumber, teacherData)
      break

    case ChatState.CREATE_OTHER_TEACHER_DETAILS:
      if (context.messageContent.trim() !== '.' && context.messageContent.trim() !== '-') {
        teacherData.details = context.messageContent.trim()
      }
      teacherTempData.set(context.phoneNumber, teacherData)
      break

    case ChatState.NEW_TEACHER_CONFIRMATION:
      if (nextState === ChatState.SPECIAL_MENU && context.normalizedMessage.includes('1')) {
        // Confirmed - save to database
        await saveTeacherToDatabase(context.phoneNumber, teacherData, false)
        teacherTempData.delete(context.phoneNumber)
      }
      break

    case ChatState.CREATE_OTHER_TEACHER_CONFIRMATION:
      if (nextState === ChatState.SPECIAL_MENU && context.normalizedMessage.includes('1')) {
        // Confirmed - save to database
        await saveTeacherToDatabase(context.phoneNumber, teacherData, true)
        teacherTempData.delete(context.phoneNumber)
      }
      break
  }
}

// =============================================
// MENU TRANSITIONS
// =============================================

async function handleMenuTransitions(
  context: ConversationContext,
  prevState: ChatState,
  nextState: ChatState
): Promise<void> {
  switch (nextState) {
    case ChatState.MENU_TODAY:
      await loadAndDisplayTodayEvents(context.phoneNumber)
      break

    case ChatState.MENU_WEEK:
      await loadAndDisplayWeekEvents(context.phoneNumber)
      break

    case ChatState.CREATE_EVENT_TITLE:
      // Initialize event creation based on special menu selection
      const eventType = extractEventTypeFromSpecialMenu(context.messageContent)
      if (eventType) {
        const eventData = EventBuilder.createNewEvent(eventType)
        eventTempData.set(context.phoneNumber, eventData)
      }
      break

    case ChatState.CREATE_OTHER_TEACHER_PHONE:
      // Initialize other teacher creation
      teacherTempData.set(context.phoneNumber, {})
      break
  }
}

// =============================================
// DATABASE OPERATIONS
// =============================================

async function saveEventToDatabase(phoneNumber: string, eventData: NewEventData): Promise<void> {
  try {
    const savedEvent = await DatabaseService.createTangoEvent(phoneNumber, eventData)
    if (savedEvent) {
      console.log(`✅ Event saved: ${savedEvent.id}`)
    } else {
      console.error('❌ Failed to save event')
      await WhatsAppService.sendTextMessage(
        phoneNumber,
        "❌ Ocurrió un error al crear tu evento. Por favor intenta nuevamente."
      )
    }
  } catch (error) {
    console.error('❌ Error saving event:', error)
    await WhatsAppService.sendTextMessage(
      phoneNumber,
      "❌ Ocurrió un error al crear tu evento. Por favor intenta nuevamente."
    )
  }
}

async function saveTeacherToDatabase(
  phoneNumber: string,
  teacherData: NewTeacherData,
  isOtherTeacher: boolean
): Promise<void> {
  try {
    const targetPhone = isOtherTeacher ? `+549${teacherData.phone}` : phoneNumber
    const savedTeacher = await DatabaseService.createTeacherProfile(targetPhone, {
      name: teacherData.name!,
      details: teacherData.details
    })

    if (savedTeacher) {
      console.log(`✅ Teacher saved: ${savedTeacher.id}`)
    } else {
      console.error('❌ Failed to save teacher')
      await WhatsAppService.sendTextMessage(
        phoneNumber,
        "❌ Ocurrió un error al crear el profesor. Por favor intenta nuevamente."
      )
    }
  } catch (error) {
    console.error('❌ Error saving teacher:', error)
    await WhatsAppService.sendTextMessage(
      phoneNumber,
      "❌ Ocurrió un error al crear el profesor. Por favor intenta nuevamente."
    )
  }
}

// =============================================
// EVENT LOADING AND DISPLAY
// =============================================

async function loadAndDisplayTodayEvents(phoneNumber: string): Promise<void> {
  try {
    // This would use the existing logic from showEvents.ts
    // For now, just send a placeholder
    await WhatsAppService.sendTextMessage(
      phoneNumber,
      "🎉 Cargando eventos de hoy...\n\n(Integración con showEvents.ts pendiente)"
    )
  } catch (error) {
    console.error('Error loading today events:', error)
    await WhatsAppService.sendTextMessage(
      phoneNumber,
      "❌ Error cargando eventos de hoy"
    )
  }
}

async function loadAndDisplayWeekEvents(phoneNumber: string): Promise<void> {
  try {
    // This would use the existing logic from showEvents.ts
    await WhatsAppService.sendTextMessage(
      phoneNumber,
      "🗓️ Cargando eventos de la semana...\n\n(Integración con showEvents.ts pendiente)"
    )
  } catch (error) {
    console.error('Error loading week events:', error)
    await WhatsAppService.sendTextMessage(
      phoneNumber,
      "❌ Error cargando eventos de la semana"
    )
  }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

function extractEventTypeFromMessage(message: string): EventType | undefined {
  const normalized = message.trim().toLowerCase()
  const eventTypeMap: Record<string, EventType> = {
    '1': 'class',
    'clase': 'class',
    '2': 'milonga',
    'milonga': 'milonga',
    '3': 'seminar',
    'seminario': 'seminar',
    '4': 'special_event',
    'evento especial': 'special_event',
    'especial': 'special_event'
  }
  return eventTypeMap[normalized]
}

function extractEventTypeFromSpecialMenu(message: string): EventType | undefined {
  const option = parseInt(message.trim())
  const typeMap: Record<number, EventType> = {
    1: 'class',
    2: 'milonga',
    3: 'seminar',
    4: 'special_event'
  }
  return typeMap[option]
}

function parseDateFromMessage(message: string): string | undefined {
  // This would use ValidationUtils.validateDate and return the parsed value
  // For now, return a placeholder
  return message.trim()
}

function parseTimeFromMessage(message: string): string | undefined {
  // This would use ValidationUtils.validateTime and return the parsed value
  return message.trim()
}

async function resetToStart(phoneNumber: string): Promise<void> {
  userStates.set(phoneNumber, ChatState.START)
  eventTempData.delete(phoneNumber)
  teacherTempData.delete(phoneNumber)
  menuTempData.delete(phoneNumber)
  
  await WhatsAppService.sendTextMessage(phoneNumber, getMainMenuMessage())
}

// =============================================
// MESSAGE TEMPLATES
// =============================================

function getMainMenuMessage(): string {
  return `Hola! Soy *Mia*! 💃
Sé prácticamente todo lo que hay que saber sobre el tango en Mar del Plata. ¿En qué te puedo ayudar?

1 - Quiero saber las clases o eventos de *hoy*
2 - Quiero saber las clases o eventos de *la semana*
3 - Tengo entre 18 y 35 años y quiero entrar al mundo del tango
4 - Quiero *denunciar algo* o hacer una *recomendación tanguera*`
}

function getSpecialMenuMessage(): string {
  return `📋 ¿Qué te gustaría hacer?

1 - Crear *clase*
2 - Crear *milonga*
3 - Crear *seminario*
4 - Crear *evento especial*
5 - Crear *profesor* (otra persona)
6 - Modificar un *evento*

0 - Volver al menú principal`
}

function getTeacherNamePrompt(): string {
  return `👨‍🏫 ¡Perfecto! Vamos a crear tu perfil de profesor.

¿Cuál es tu nombre completo?
*Ejemplo:* María González`
}