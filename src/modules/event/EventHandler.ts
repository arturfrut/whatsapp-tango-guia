import { BaseHandler } from '../common/BaseHandler'
import { ValidationUtils } from '../common/ValidationUtils'
import { StateManager } from '../common/StateManager'
import { EventValidator } from './EventValidator'
import { EventMessages } from './EventMessages'
import { EventBuilder } from './EventBuilder'
import {
  ChatState,
  ConversationContext,
  HandlerResponse,
  NewEventData
} from './types'

export class EventHandler extends BaseHandler {
  
  // State transition maps for this handler
  private static readonly BACK_TRANSITIONS: Partial<Record<ChatState, ChatState>> = {
    [ChatState.CREATE_EVENT_TITLE]: ChatState.SPECIAL_MENU,
    [ChatState.CREATE_EVENT_VENUE]: ChatState.CREATE_EVENT_TITLE,
    [ChatState.CREATE_EVENT_ADDRESS]: ChatState.CREATE_EVENT_VENUE,
    [ChatState.CREATE_EVENT_DATE]: ChatState.CREATE_EVENT_ADDRESS,
    [ChatState.CREATE_CLASS_SINGLE_OR_MULTIPLE]: ChatState.CREATE_EVENT_DATE,
    [ChatState.CREATE_MILONGA_TIME]: ChatState.CREATE_EVENT_DATE,
    [ChatState.CREATE_SPECIAL_TIME]: ChatState.CREATE_EVENT_DATE
  }

  // =============================================
  // HANDLER INTERFACE IMPLEMENTATION
  // =============================================
  
  canHandle(state: ChatState): boolean {
    return StateManager.isEventCreationState(state)
  }

  async handle(context: ConversationContext): Promise<HandlerResponse> {
    this.logHandlerAction(
      context.phoneNumber,
      'Processing event creation',
      context.currentState,
      context.messageContent
    )

    // Handle global navigation commands
    if (this.isGoBackCommand(context.normalizedMessage)) {
      return this.handleGoBackNavigation(context)
    }

    if (this.isExitCommand(context.normalizedMessage)) {
      return this.handleExitNavigation(context)
    }

    // Route to specific state handler
    try {
      switch (context.currentState) {
        case ChatState.SPECIAL_MENU:
          return this.handleSpecialMenu(context)
        case ChatState.CREATE_EVENT_TITLE:
          return this.handleEventTitle(context)
        case ChatState.CREATE_EVENT_VENUE:
          return this.handleEventVenue(context)
        case ChatState.CREATE_EVENT_ADDRESS:
          return this.handleEventAddress(context)
        case ChatState.CREATE_EVENT_DATE:
          return this.handleEventDate(context)
        case ChatState.CREATE_CLASS_SINGLE_OR_MULTIPLE:
          return this.handleClassSingleOrMultiple(context)
        case ChatState.CREATE_MILONGA_TIME:
          return this.handleMilongaTime(context)
        case ChatState.CREATE_SPECIAL_TIME:
          return this.handleSpecialTime(context)
        default:
          return this.handleUnexpectedState(context.phoneNumber, context.currentState)
      }
    } catch (error) {
      return this.handleError(
        context.phoneNumber,
        error as Error,
        `EventHandler.handle - State: ${context.currentState}`
      )
    }
  }

  // =============================================
  // NAVIGATION HELPERS
  // =============================================
  
  private async handleGoBackNavigation(context: ConversationContext): Promise<HandlerResponse> {
    const previousState = EventHandler.BACK_TRANSITIONS[context.currentState]
    
    if (previousState) {
      this.logStateTransition(context.phoneNumber, context.currentState, previousState)
      
      // Send appropriate message for the previous state
      await this.sendStateMessage(context.phoneNumber, previousState)
      
      return this.createSuccessResponse(previousState)
    }

    // Fallback to special menu
    await this.sendMessage(context.phoneNumber, EventMessages.getEventTypePrompt())
    return this.createSuccessResponse(ChatState.SPECIAL_MENU)
  }

  private async handleExitNavigation(context: ConversationContext): Promise<HandlerResponse> {
    // Clear temp data would happen in the router
    await this.sendMessage(context.phoneNumber, EventMessages.getEventCancellationMessage())
    return this.createSuccessResponse(ChatState.START)
  }

  private async sendStateMessage(phoneNumber: string, state: ChatState): Promise<void> {
    // This would need access to temp data to send proper messages
    // For now, send a generic back message
    switch (state) {
      case ChatState.SPECIAL_MENU:
        await this.sendMessage(phoneNumber, EventMessages.getEventTypePrompt())
        break
      case ChatState.CREATE_EVENT_TITLE:
        await this.sendMessage(phoneNumber, "¿Cuál es el título del evento?")
        break
      // Add more cases as needed
      default:
        await this.sendMessage(phoneNumber, "Volviendo al paso anterior...")
    }
  }

  // =============================================
  // STATE HANDLERS - BASIC FLOW
  // =============================================
  
  private async handleSpecialMenu(context: ConversationContext): Promise<HandlerResponse> {
    const validation = EventValidator.validateEventType(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!,
        "1-Clase, 2-Milonga, 3-Seminario, 4-Evento especial"
      )
      return this.createErrorResponse(validation.error!)
    }

    // For this iteration, we'll assume temp data management happens in the router
    // The handler just validates and responds
    const eventType = validation.value as any
    
    await this.sendMessage(
      context.phoneNumber,
      EventMessages.getTitlePrompt(eventType)
    )

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.CREATE_EVENT_TITLE
    )

    return this.createSuccessResponse(ChatState.CREATE_EVENT_TITLE)
  }

  private async handleEventTitle(context: ConversationContext): Promise<HandlerResponse> {
    const validation = EventValidator.validateEventTitle(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!,
        "Clase de Tango Principiantes"
      )
      return this.createErrorResponse(validation.error!)
    }

    const title = validation.value!
    
    await this.sendMessage(
      context.phoneNumber,
      EventMessages.getVenuePrompt(title)
    )

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.CREATE_EVENT_VENUE
    )

    return this.createSuccessResponse(ChatState.CREATE_EVENT_VENUE)
  }

  private async handleEventVenue(context: ConversationContext): Promise<HandlerResponse> {
    const validation = EventValidator.validateEventVenue(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!,
        "UADE o Centro Cultural"
      )
      return this.createErrorResponse(validation.error!)
    }

    const venueName = validation.value!
    
    await this.sendMessage(
      context.phoneNumber,
      EventMessages.getAddressPrompt(venueName)
    )

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.CREATE_EVENT_ADDRESS
    )

    return this.createSuccessResponse(ChatState.CREATE_EVENT_ADDRESS)
  }

  private async handleEventAddress(context: ConversationContext): Promise<HandlerResponse> {
    const validation = EventValidator.validateEventAddress(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!,
        "Magallanes 2025, Mar del Plata"
      )
      return this.createErrorResponse(validation.error!)
    }

    const address = validation.value!
    
    await this.sendMessage(
      context.phoneNumber,
      EventMessages.getDatePrompt(address)
    )

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.CREATE_EVENT_DATE
    )

    return this.createSuccessResponse(ChatState.CREATE_EVENT_DATE)
  }

  private async handleEventDate(context: ConversationContext): Promise<HandlerResponse> {
    const validation = ValidationUtils.validateDate(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!,
        "15/12/2024, mañana, hoy"
      )
      return this.createErrorResponse(validation.error!)
    }

    const date = validation.value!
    
    // The next state depends on the event type
    // For this basic implementation, we'll assume we need to get event type from temp data
    // This would be handled by the router in the full implementation
    
    // For now, let's assume it's a class and go to class configuration
    await this.sendMessage(
      context.phoneNumber,
      EventMessages.getClassSingleOrMultiplePrompt(date)
    )

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.CREATE_CLASS_SINGLE_OR_MULTIPLE
    )

    return this.createSuccessResponse(ChatState.CREATE_CLASS_SINGLE_OR_MULTIPLE)
  }

  // =============================================
  // STATE HANDLERS - CLASS FLOW
  // =============================================
  
  private async handleClassTime(context: ConversationContext): Promise<HandlerResponse> {
    const validation = ValidationUtils.validateTime(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!,
        "20:30"
      )
      return this.createErrorResponse(validation.error!)
    }

    const classTime = validation.value!
    
    // For now, assume this is the first class (classNumber would come from temp data)
    await this.sendMessage(
      context.phoneNumber,
      EventMessages.getClassLevelPrompt(classTime)
    )

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.CREATE_CLASS_LEVEL
    )

    return this.createSuccessResponse(ChatState.CREATE_CLASS_LEVEL)
  }

  private async handleClassLevel(context: ConversationContext): Promise<HandlerResponse> {
    const validation = EventValidator.validateClassLevel(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!
      )
      return this.createErrorResponse(validation.error!)
    }

    const level = validation.value!
    
    // Determine next state based on whether this is first class creation
    // In real implementation, this would check temp data
    const isFirstClassCreation = true // Would come from temp data
    
    if (isFirstClassCreation) {
      await this.sendMessage(
        context.phoneNumber,
        EventMessages.getClassAddAnotherPrompt()
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.CREATE_CLASS_ADD_ANOTHER
      )

      return this.createSuccessResponse(ChatState.CREATE_CLASS_ADD_ANOTHER)
    } else {
      // If already have multiple classes, go to practice
      await this.sendMessage(
        context.phoneNumber,
        EventMessages.getClassPracticePrompt()
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.CREATE_CLASS_PRACTICE
      )

      return this.createSuccessResponse(ChatState.CREATE_CLASS_PRACTICE)
    }
  }

  private async handleClassAddAnother(context: ConversationContext): Promise<HandlerResponse> {
    const validation = EventValidator.validateClassAddAnother(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!
      )
      return this.createErrorResponse(validation.error!)
    }

    if (validation.value === 'yes') {
      // Add another class - would need temp data to get current class count
      const nextClassNumber = 2 // Would come from temp data
      
      await this.sendMessage(
        context.phoneNumber,
        EventMessages.getClassTimePrompt(false, nextClassNumber)
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.CREATE_CLASS_TIME
      )

      return this.createSuccessResponse(ChatState.CREATE_CLASS_TIME)
    } else {
      // Continue to practice
      await this.sendMessage(
        context.phoneNumber,
        EventMessages.getClassPracticePrompt()
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.CREATE_CLASS_PRACTICE
      )

      return this.createSuccessResponse(ChatState.CREATE_CLASS_PRACTICE)
    }
  }

  private async handleClassPractice(context: ConversationContext): Promise<HandlerResponse> {
    const validation = EventValidator.validateClassPractice(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!
      )
      return this.createErrorResponse(validation.error!)
    }

    if (validation.value === 'yes') {
      await this.sendMessage(
        context.phoneNumber,
        EventMessages.getClassPracticeTimePrompt()
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.CREATE_CLASS_PRACTICE_TIME
      )

      return this.createSuccessResponse(ChatState.CREATE_CLASS_PRACTICE_TIME)
    } else {
      // No practice, go to organizers
      await this.sendMessage(
        context.phoneNumber,
        "Continuando con organizadores..."
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.CREATE_EVENT_ORGANIZERS
      )

      return this.createSuccessResponse(ChatState.CREATE_EVENT_ORGANIZERS)
    }
  }

  private async handleClassPracticeTime(context: ConversationContext): Promise<HandlerResponse> {
    const validation = ValidationUtils.validateTime(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!,
        "23:00"
      )
      return this.createErrorResponse(validation.error!)
    }

    // Practice time saved, continue to organizers
    await this.sendMessage(
      context.phoneNumber,
      "✅ Práctica configurada. Continuando con organizadores..."
    )

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.CREATE_EVENT_ORGANIZERS
    )

    return this.createSuccessResponse(ChatState.CREATE_EVENT_ORGANIZERS)
  }

  // =============================================
  // STATE HANDLERS - MILONGA FLOW
  // =============================================
  
  private async handleMilongaPreClass(context: ConversationContext): Promise<HandlerResponse> {
    const validation = EventValidator.validateMilongaPreClass(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!
      )
      return this.createErrorResponse(validation.error!)
    }

    if (validation.value === 'yes') {
      await this.sendMessage(
        context.phoneNumber,
        EventMessages.getMilongaPreClassTimePrompt()
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.CREATE_MILONGA_PRE_CLASS_DETAILS
      )

      return this.createSuccessResponse(ChatState.CREATE_MILONGA_PRE_CLASS_DETAILS)
    } else {
      await this.sendMessage(
        context.phoneNumber,
        EventMessages.getMilongaShowPrompt()
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.CREATE_MILONGA_SHOW
      )

      return this.createSuccessResponse(ChatState.CREATE_MILONGA_SHOW)
    }
  }

  private async handleMilongaPreClassDetails(context: ConversationContext): Promise<HandlerResponse> {
    const validation = ValidationUtils.validateTime(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!,
        "19:30"
      )
      return this.createErrorResponse(validation.error!)
    }

    const preClassTime = validation.value!
    
    await this.sendMessage(
      context.phoneNumber,
      EventMessages.getMilongaShowPrompt(preClassTime)
    )

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.CREATE_MILONGA_SHOW
    )

    return this.createSuccessResponse(ChatState.CREATE_MILONGA_SHOW)
  }

  private async handleMilongaShow(context: ConversationContext): Promise<HandlerResponse> {
    const validation = EventValidator.validateMilongaShow(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!
      )
      return this.createErrorResponse(validation.error!)
    }

    if (validation.value === 'yes') {
      await this.sendMessage(
        context.phoneNumber,
        EventMessages.getMilongaShowDetailsPrompt()
      )
      // Stay in the same state to get show details
      return this.createSuccessResponse(context.currentState)
    } else if (validation.value === 'no' || validation.value === 'skip') {
      // Continue to organizers
      await this.sendMessage(
        context.phoneNumber,
        "Continuando con organizadores..."
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.CREATE_EVENT_ORGANIZERS
      )

      return this.createSuccessResponse(ChatState.CREATE_EVENT_ORGANIZERS)
    } else {
      // They provided show description
      await this.sendMessage(
        context.phoneNumber,
        `✅ Show: ${validation.value}. Continuando con organizadores...`
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.CREATE_EVENT_ORGANIZERS
      )

      return this.createSuccessResponse(ChatState.CREATE_EVENT_ORGANIZERS)
    }
  }
  
  private async handleClassSingleOrMultiple(context: ConversationContext): Promise<HandlerResponse> {
    const validation = EventValidator.validateClassSingleOrMultiple(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!
      )
      return this.createErrorResponse(validation.error!)
    }

    const isSingle = validation.value === 'single'
    
    // Send appropriate message based on single vs multiple
    const message = isSingle 
      ? EventMessages.getClassTimePrompt(true)
      : EventMessages.getClassTimePrompt(false)
    
    await this.sendMessage(context.phoneNumber, message)

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.CREATE_CLASS_TIME
    )

    return this.createSuccessResponse(ChatState.CREATE_CLASS_TIME)
  }

  private async handleMilongaTime(context: ConversationContext): Promise<HandlerResponse> {
    const validation = ValidationUtils.validateTime(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!,
        "20:30"
      )
      return this.createErrorResponse(validation.error!)
    }

    const milongaTime = validation.value!
    
    await this.sendMessage(
      context.phoneNumber,
      EventMessages.getMilongaPreClassPrompt(milongaTime)
    )

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.CREATE_MILONGA_PRE_CLASS
    )

    return this.createSuccessResponse(ChatState.CREATE_MILONGA_PRE_CLASS)
  }

  private async handleSpecialTime(context: ConversationContext): Promise<HandlerResponse> {
    const validation = ValidationUtils.validateTime(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!,
        "20:30"
      )
      return this.createErrorResponse(validation.error!)
    }

    // For special events, after time we go to organizers
    // This would be handled by the router with proper temp data management
    
    await this.sendMessage(
      context.phoneNumber,
      "✅ Hora configurada. Continuando con organizadores..."
    )

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.CREATE_EVENT_ORGANIZERS
    )

    return this.createSuccessResponse(ChatState.CREATE_EVENT_ORGANIZERS)
  }

  // =============================================
  // STATE HANDLERS - ORGANIZER FLOW
  // =============================================
  
  private async handleEventOrganizers(context: ConversationContext): Promise<HandlerResponse> {
    // This method would check if user is teacher and event type to determine message
    // For now, assume generic organizer search
    await this.sendMessage(
      context.phoneNumber,
      EventMessages.getOrganizerSearchPrompt('class') // Would get from temp data
    )

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.CREATE_EVENT_ORGANIZER_SEARCH
    )

    return this.createSuccessResponse(ChatState.CREATE_EVENT_ORGANIZER_SEARCH)
  }

  private async handleOrganizerSelf(context: ConversationContext): Promise<HandlerResponse> {
    const validation = EventValidator.validateOrganizerSelf(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!
      )
      return this.createErrorResponse(validation.error!)
    }

    if (validation.value === 'yes') {
      // Add self as organizer, show added message
      await this.sendMessage(
        context.phoneNumber,
        EventMessages.getOrganizerSelfAddedPrompt("Usuario") // Would get real name from temp data
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.CREATE_EVENT_ORGANIZER_ADDITIONAL
      )

      return this.createSuccessResponse(ChatState.CREATE_EVENT_ORGANIZER_ADDITIONAL)
    } else {
      // Search for other teacher
      await this.sendMessage(
        context.phoneNumber,
        EventMessages.getOrganizerSearchPrompt('class')
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.CREATE_EVENT_ORGANIZER_SEARCH
      )

      return this.createSuccessResponse(ChatState.CREATE_EVENT_ORGANIZER_SEARCH)
    }
  }

  private async handleOrganizerAdditional(context: ConversationContext): Promise<HandlerResponse> {
    const validation = EventValidator.validateOrganizerAdditional(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!
      )
      return this.createErrorResponse(validation.error!)
    }

    if (validation.value === 'yes') {
      await this.sendMessage(
        context.phoneNumber,
        EventMessages.getOrganizerSearchPrompt('class')
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.CREATE_EVENT_ORGANIZER_SEARCH
      )

      return this.createSuccessResponse(ChatState.CREATE_EVENT_ORGANIZER_SEARCH)
    } else {
      // Continue to recurrence
      await this.sendMessage(
        context.phoneNumber,
        EventMessages.getRecurrencePrompt('class') // Would get from temp data
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.CREATE_EVENT_RECURRENCE
      )

      return this.createSuccessResponse(ChatState.CREATE_EVENT_RECURRENCE)
    }
  }

  private async handleOrganizerSearch(context: ConversationContext): Promise<HandlerResponse> {
    const validation = EventValidator.validateOrganizerSearch(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!
      )
      return this.createErrorResponse(validation.error!)
    }

    if (validation.value === 'new') {
      await this.sendMessage(
        context.phoneNumber,
        EventMessages.getOrganizerOneTimePrompt()
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.CREATE_EVENT_ORGANIZER_ONE_TIME
      )

      return this.createSuccessResponse(ChatState.CREATE_EVENT_ORGANIZER_ONE_TIME)
    } else {
      // Search term provided - would search database and show results
      // For now, simulate no results found
      await this.sendMessage(
        context.phoneNumber,
        EventMessages.getOrganizerNotFoundPrompt()
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.CREATE_EVENT_ORGANIZER_ONE_TIME
      )

      return this.createSuccessResponse(ChatState.CREATE_EVENT_ORGANIZER_ONE_TIME)
    }
  }

  private async handleOrganizerSelect(context: ConversationContext): Promise<HandlerResponse> {
    // This would validate selection from search results
    const validation = EventValidator.validateOrganizerSelect(context.messageContent, 3) // maxOptions from temp data
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!
      )
      return this.createErrorResponse(validation.error!)
    }

    // Add selected organizer and continue
    await this.sendMessage(
      context.phoneNumber,
      EventMessages.getOrganizerAddedPrompt("Profesor seleccionado")
    )

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.CREATE_EVENT_ORGANIZER_ADDITIONAL
    )

    return this.createSuccessResponse(ChatState.CREATE_EVENT_ORGANIZER_ADDITIONAL)
  }

  private async handleOrganizerOneTime(context: ConversationContext): Promise<HandlerResponse> {
    const validation = ValidationUtils.validateName(context.messageContent, 3)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!,
        "Juan Pérez"
      )
      return this.createErrorResponse(validation.error!)
    }

    const teacherName = validation.value!
    
    await this.sendMessage(
      context.phoneNumber,
      EventMessages.getOrganizerAddedPrompt(teacherName)
    )

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.CREATE_EVENT_ORGANIZER_ADDITIONAL
    )

    return this.createSuccessResponse(ChatState.CREATE_EVENT_ORGANIZER_ADDITIONAL)
  }

  // =============================================
  // STATE HANDLERS - FINAL FLOW
  // =============================================
  
  private async handleEventRecurrence(context: ConversationContext): Promise<HandlerResponse> {
    const validation = EventValidator.validateEventRecurrence(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!
      )
      return this.createErrorResponse(validation.error!)
    }

    // Continue to contact regardless of recurrence choice
    await this.sendMessage(
      context.phoneNumber,
      EventMessages.getContactPrompt(context.phoneNumber)
    )

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.CREATE_EVENT_CONTACT
    )

    return this.createSuccessResponse(ChatState.CREATE_EVENT_CONTACT)
  }

  private async handleEventContact(context: ConversationContext): Promise<HandlerResponse> {
    const validation = EventValidator.validateEventContact(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!
      )
      return this.createErrorResponse(validation.error!)
    }

    if (validation.value === 'other') {
      await this.sendMessage(
        context.phoneNumber,
        EventMessages.getContactNumberPrompt()
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.CREATE_EVENT_CONTACT_NUMBER
      )

      return this.createSuccessResponse(ChatState.CREATE_EVENT_CONTACT_NUMBER)
    } else {
      // Continue to reminder (own number or skip)
      await this.sendMessage(
        context.phoneNumber,
        EventMessages.getReminderPrompt(context.phoneNumber)
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.CREATE_EVENT_REMINDER
      )

      return this.createSuccessResponse(ChatState.CREATE_EVENT_REMINDER)
    }
  }

  private async handleEventContactNumber(context: ConversationContext): Promise<HandlerResponse> {
    const validation = ValidationUtils.validatePhone(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!,
        "2234567890"
      )
      return this.createErrorResponse(validation.error!)
    }

    // Continue to reminder
    await this.sendMessage(
      context.phoneNumber,
      EventMessages.getReminderPrompt(context.phoneNumber)
    )

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.CREATE_EVENT_REMINDER
    )

    return this.createSuccessResponse(ChatState.CREATE_EVENT_REMINDER)
  }

  private async handleEventReminder(context: ConversationContext): Promise<HandlerResponse> {
    const validation = EventValidator.validateEventReminder(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!
      )
      return this.createErrorResponse(validation.error!)
    }

    if (validation.value === 'other') {
      await this.sendMessage(
        context.phoneNumber,
        EventMessages.getReminderNumberPrompt()
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.CREATE_EVENT_REMINDER_NUMBER
      )

      return this.createSuccessResponse(ChatState.CREATE_EVENT_REMINDER_NUMBER)
    } else {
      // Continue to description
      await this.sendMessage(
        context.phoneNumber,
        EventMessages.getDescriptionPrompt()
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.CREATE_EVENT_DESCRIPTION
      )

      return this.createSuccessResponse(ChatState.CREATE_EVENT_DESCRIPTION)
    }
  }

  private async handleEventReminderNumber(context: ConversationContext): Promise<HandlerResponse> {
    const validation = ValidationUtils.validatePhone(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!,
        "2234567890"
      )
      return this.createErrorResponse(validation.error!)
    }

    // Continue to description
    await this.sendMessage(
      context.phoneNumber,
      EventMessages.getDescriptionPrompt()
    )

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.CREATE_EVENT_DESCRIPTION
    )

    return this.createSuccessResponse(ChatState.CREATE_EVENT_DESCRIPTION)
  }

  private async handleEventDescription(context: ConversationContext): Promise<HandlerResponse> {
    // Description is optional, any input is valid (including ".")
    await this.sendMessage(
      context.phoneNumber,
      EventMessages.getPricingPrompt()
    )

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.CREATE_EVENT_PRICING
    )

    return this.createSuccessResponse(ChatState.CREATE_EVENT_PRICING)
  }

  private async handleEventPricing(context: ConversationContext): Promise<HandlerResponse> {
    const validation = EventValidator.validateEventPricing(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!
      )
      return this.createErrorResponse(validation.error!)
    }

    if (validation.value === 'yes') {
      await this.sendMessage(
        context.phoneNumber,
        EventMessages.getPricingTypePrompt()
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.CREATE_EVENT_PRICING_TYPE
      )

      return this.createSuccessResponse(ChatState.CREATE_EVENT_PRICING_TYPE)
    } else {
      // Skip pricing, go to confirmation
      // Would need to create confirmation message with temp data
      await this.sendMessage(
        context.phoneNumber,
        "Mostrando confirmación del evento..." // Placeholder
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.CREATE_EVENT_CONFIRMATION
      )

      return this.createSuccessResponse(ChatState.CREATE_EVENT_CONFIRMATION)
    }
  }

  private async handleEventPricingType(context: ConversationContext): Promise<HandlerResponse> {
    const validation = EventValidator.validatePricingType(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!
      )
      return this.createErrorResponse(validation.error!)
    }

    // Continue to pricing details
    await this.sendMessage(
      context.phoneNumber,
      EventMessages.getPricingDetailPrompt()
    )

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.CREATE_EVENT_PRICING_DETAILS
    )

    return this.createSuccessResponse(ChatState.CREATE_EVENT_PRICING_DETAILS)
  }

  private async handleEventPricingDetails(context: ConversationContext): Promise<HandlerResponse> {
    const validation = EventValidator.validatePricingDetail(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!,
        "Solo clase principiante"
      )
      return this.createErrorResponse(validation.error!)
    }

    const detail = validation.value!
    
    await this.sendMessage(
      context.phoneNumber,
      EventMessages.getPricingAmountPrompt(detail)
    )

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.CREATE_EVENT_PRICING_AMOUNT
    )

    return this.createSuccessResponse(ChatState.CREATE_EVENT_PRICING_AMOUNT)
  }

  private async handleEventPricingAmount(context: ConversationContext): Promise<HandlerResponse> {
    const validation = ValidationUtils.validatePrice(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!,
        "5000 o 'gratis'"
      )
      return this.createErrorResponse(validation.error!)
    }

    // Continue to add more pricing
    await this.sendMessage(
      context.phoneNumber,
      EventMessages.getPricingAddMorePrompt([]) // Would pass current prices from temp data
    )

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.CREATE_EVENT_PRICING_ADD_MORE
    )

    return this.createSuccessResponse(ChatState.CREATE_EVENT_PRICING_ADD_MORE)
  }

  private async handleEventPricingAddMore(context: ConversationContext): Promise<HandlerResponse> {
    const validation = EventValidator.validatePricingAddMore(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!
      )
      return this.createErrorResponse(validation.error!)
    }

    if (validation.value === 'yes') {
      // Add another price
      const nextPriceNumber = 2 // Would come from temp data
      await this.sendMessage(
        context.phoneNumber,
        EventMessages.getPricingDetailPrompt(nextPriceNumber)
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.CREATE_EVENT_PRICING_DETAILS
      )

      return this.createSuccessResponse(ChatState.CREATE_EVENT_PRICING_DETAILS)
    } else {
      // Continue to confirmation
      await this.sendMessage(
        context.phoneNumber,
        "Mostrando confirmación del evento..." // Placeholder
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.CREATE_EVENT_CONFIRMATION
      )

      return this.createSuccessResponse(ChatState.CREATE_EVENT_CONFIRMATION)
    }
  }

  private async handleEventConfirmation(context: ConversationContext): Promise<HandlerResponse> {
    const validation = EventValidator.validateEventConfirmation(context.messageContent)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!
      )
      return this.createErrorResponse(validation.error!)
    }

    if (validation.value === 'confirm') {
      // Event creation confirmed - would save to database
      await this.sendMessage(
        context.phoneNumber,
        "¡Evento creado exitosamente!" // Would use EventMessages.getEventSuccessMessage with temp data
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.SPECIAL_MENU
      )

      return this.createSuccessResponse(ChatState.SPECIAL_MENU)
    } else {
      // Modify event - restart
      await this.sendMessage(
        context.phoneNumber,
        EventMessages.getEventModifyMessage()
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.CREATE_EVENT_TITLE
      )

      return this.createSuccessResponse(ChatState.CREATE_EVENT_TITLE)
    }
  }
}