import { BaseHandler } from '../common/BaseHandler'
import { StateManager } from '../common/StateManager'
import {
  ChatState,
  ConversationContext,
  HandlerResponse
} from '../common/types'

export class MenuHandler extends BaseHandler {
  
  // State transition maps for menu navigation
  private static readonly BACK_TRANSITIONS: Partial<Record<ChatState, ChatState>> = {
    [ChatState.MENU_TODAY]: ChatState.MAIN_MENU,
    [ChatState.MENU_WEEK]: ChatState.MAIN_MENU,
    [ChatState.MENU_TODAY_DETAILS]: ChatState.MENU_TODAY,
    [ChatState.MENU_WEEK_DETAILS]: ChatState.MENU_WEEK,
    [ChatState.MENU_18_35]: ChatState.MAIN_MENU,
    [ChatState.MENU_REPORT]: ChatState.MAIN_MENU
  }

  // =============================================
  // HANDLER INTERFACE IMPLEMENTATION
  // =============================================
  
  canHandle(state: ChatState): boolean {
    return StateManager.isMenuState(state)
  }

  async handle(context: ConversationContext): Promise<HandlerResponse> {
    this.logHandlerAction(
      context.phoneNumber,
      'Processing menu navigation',
      context.currentState,
      context.messageContent
    )

    // Handle global navigation commands
    if (this.isGoBackCommand(context.normalizedMessage)) {
      return this.handleGoBackNavigation(context)
    }

    // Route to specific state handler
    try {
      switch (context.currentState) {
        case ChatState.START:
          return this.handleStart(context)
        case ChatState.MAIN_MENU:
          return this.handleMainMenu(context)
        case ChatState.SPECIAL_MENU:
          return this.handleSpecialMenu(context)
        case ChatState.MENU_TODAY:
          return this.handleMenuToday(context)
        case ChatState.MENU_WEEK:
          return this.handleMenuWeek(context)
        case ChatState.MENU_TODAY_DETAILS:
          return this.handleTodayDetails(context)
        case ChatState.MENU_WEEK_DETAILS:
          return this.handleWeekDetails(context)
        case ChatState.MENU_18_35:
          return this.handleMenu18_35(context)
        case ChatState.MENU_REPORT:
          return this.handleMenuReport(context)
        default:
          return this.handleUnexpectedState(context.phoneNumber, context.currentState)
      }
    } catch (error) {
      return this.handleError(
        context.phoneNumber,
        error as Error,
        `MenuHandler.handle - State: ${context.currentState}`
      )
    }
  }

  // =============================================
  // NAVIGATION HELPERS
  // =============================================
  
  private async handleGoBackNavigation(context: ConversationContext): Promise<HandlerResponse> {
    const previousState = MenuHandler.BACK_TRANSITIONS[context.currentState]
    
    if (previousState) {
      this.logStateTransition(context.phoneNumber, context.currentState, previousState)
      
      // Send appropriate message for the previous state
      await this.sendStateMessage(context.phoneNumber, previousState)
      
      return this.createSuccessResponse(previousState)
    }

    // Fallback to main menu
    await this.sendMessage(context.phoneNumber, this.getMainMenuMessage())
    return this.createSuccessResponse(ChatState.MAIN_MENU)
  }

  private async sendStateMessage(phoneNumber: string, state: ChatState): Promise<void> {
    switch (state) {
      case ChatState.MAIN_MENU:
        await this.sendMessage(phoneNumber, this.getMainMenuMessage())
        break
      case ChatState.MENU_TODAY:
        await this.sendMessage(phoneNumber, "Cargando eventos de hoy...")
        break
      case ChatState.MENU_WEEK:
        await this.sendMessage(phoneNumber, "Cargando eventos de la semana...")
        break
      default:
        await this.sendMessage(phoneNumber, "Volviendo al menú anterior...")
    }
  }

  // =============================================
  // STATE HANDLERS - BASIC MENU FLOW
  // =============================================
  
  private async handleStart(context: ConversationContext): Promise<HandlerResponse> {
    await this.sendMessage(context.phoneNumber, this.getMainMenuMessage())

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.MAIN_MENU
    )

    return this.createSuccessResponse(ChatState.MAIN_MENU)
  }

  private async handleMainMenu(context: ConversationContext): Promise<HandlerResponse> {
    const option = this.validateNumericOption(context.messageContent, 1, 4)

    if (!option.isValid) {
      await this.sendInvalidOption(
        context.phoneNumber,
        "Elegí una opción del menú (1-4)"
      )
      return this.createErrorResponse("Invalid menu option")
    }

    switch (option.value!) {
      case 1:
        // Today's events
        await this.sendMessage(context.phoneNumber, "🎉 Cargando eventos de hoy...")
        
        this.logStateTransition(
          context.phoneNumber,
          context.currentState,
          ChatState.MENU_TODAY
        )
        
        return this.createSuccessResponse(ChatState.MENU_TODAY)

      case 2:
        // Week's events
        await this.sendMessage(context.phoneNumber, "🗓️ Cargando eventos de la semana...")
        
        this.logStateTransition(
          context.phoneNumber,
          context.currentState,
          ChatState.MENU_WEEK
        )
        
        return this.createSuccessResponse(ChatState.MENU_WEEK)

      case 3:
        // 18-35 menu
        await this.sendMessage(context.phoneNumber, this.get18_35MenuMessage())
        
        this.logStateTransition(
          context.phoneNumber,
          context.currentState,
          ChatState.MENU_18_35
        )
        
        return this.createSuccessResponse(ChatState.MENU_18_35)

      case 4:
        // Report menu
        await this.sendMessage(context.phoneNumber, this.getReportMenuMessage())
        
        this.logStateTransition(
          context.phoneNumber,
          context.currentState,
          ChatState.MENU_REPORT
        )
        
        return this.createSuccessResponse(ChatState.MENU_REPORT)

      default:
        await this.sendInvalidOption(context.phoneNumber, "Opción no válida")
        return this.createErrorResponse("Invalid option")
    }
  }

  private async handleSpecialMenu(context: ConversationContext): Promise<HandlerResponse> {
    const option = this.validateNumericOption(context.messageContent, 0, 6)

    if (!option.isValid) {
      await this.sendInvalidOption(
        context.phoneNumber,
        "Elegí una opción del menú (0-6)"
      )
      return this.createErrorResponse("Invalid special menu option")
    }

    switch (option.value!) {
      case 0:
        // Back to main menu
        await this.sendMessage(context.phoneNumber, this.getMainMenuMessage())
        
        this.logStateTransition(
          context.phoneNumber,
          context.currentState,
          ChatState.MAIN_MENU
        )
        
        return this.createSuccessResponse(ChatState.MAIN_MENU)

      case 1:
      case 2:
      case 3:
      case 4:
        // Event creation - these will be handled by EventHandler
        // MenuHandler just validates and passes control
        this.logStateTransition(
          context.phoneNumber,
          context.currentState,
          ChatState.CREATE_EVENT_TITLE
        )
        
        return this.createSuccessResponse(ChatState.CREATE_EVENT_TITLE)

      case 5:
        // Create other teacher - handled by TeacherHandler
        this.logStateTransition(
          context.phoneNumber,
          context.currentState,
          ChatState.CREATE_OTHER_TEACHER_PHONE
        )
        
        return this.createSuccessResponse(ChatState.CREATE_OTHER_TEACHER_PHONE)

      case 6:
        // Modify event (in development)
        await this.sendMessage(context.phoneNumber, "🛠️ Modificar evento (en desarrollo)...")
        return this.createSuccessResponse(context.currentState)

      default:
        await this.sendInvalidOption(context.phoneNumber, "Opción no válida")
        return this.createErrorResponse("Invalid option")
    }
  }

  // =============================================
  // STATE HANDLERS - EVENT VIEWING
  // =============================================
  
  private async handleMenuToday(context: ConversationContext): Promise<HandlerResponse> {
    // This state would typically load and display today's events
    // The actual event loading would be done by the router with database calls
    // For now, simulate the response structure
    
    const option = this.validateNumericOption(context.messageContent, 0, 10) // max events

    if (context.normalizedMessage === '0') {
      await this.sendMessage(context.phoneNumber, this.getMainMenuMessage())
      
      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.MAIN_MENU
      )
      
      return this.createSuccessResponse(ChatState.MAIN_MENU)
    }

    if (option.isValid && option.value! > 0) {
      // User selected an event to view details
      await this.sendMessage(
        context.phoneNumber,
        `Mostrando detalles del evento ${option.value}...` // Would show actual event details
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.MENU_TODAY_DETAILS
      )

      return this.createSuccessResponse(ChatState.MENU_TODAY_DETAILS)
    }

    // Invalid selection
    await this.sendInvalidOption(
      context.phoneNumber,
      "Elegí un número de evento válido o presiona 0 para volver"
    )
    return this.createErrorResponse("Invalid event selection")
  }

  private async handleMenuWeek(context: ConversationContext): Promise<HandlerResponse> {
    // Similar to handleMenuToday but for week's events
    const option = this.validateNumericOption(context.messageContent, 0, 20) // max events

    if (context.normalizedMessage === '0') {
      await this.sendMessage(context.phoneNumber, this.getMainMenuMessage())
      
      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.MAIN_MENU
      )
      
      return this.createSuccessResponse(ChatState.MAIN_MENU)
    }

    if (option.isValid && option.value! > 0) {
      await this.sendMessage(
        context.phoneNumber,
        `Mostrando detalles del evento ${option.value} de la semana...`
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.MENU_WEEK_DETAILS
      )

      return this.createSuccessResponse(ChatState.MENU_WEEK_DETAILS)
    }

    await this.sendInvalidOption(
      context.phoneNumber,
      "Elegí un número de evento válido o presiona 0 para volver"
    )
    return this.createErrorResponse("Invalid event selection")
  }

  private async handleTodayDetails(context: ConversationContext): Promise<HandlerResponse> {
    // Handle actions in event details view
    const option = this.validateNumericOption(context.messageContent, 0, 10)

    if (context.normalizedMessage === '0') {
      await this.sendMessage(context.phoneNumber, "Volviendo a eventos de hoy...")
      
      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.MENU_TODAY
      )
      
      return this.createSuccessResponse(ChatState.MENU_TODAY)
    }

    if (option.isValid && option.value! > 0) {
      // User selected another event or action
      await this.sendMessage(
        context.phoneNumber,
        `Mostrando detalles del evento ${option.value}...`
      )
      // Stay in same state
      return this.createSuccessResponse(context.currentState)
    }

    await this.sendMessage(
      context.phoneNumber,
      this.getReturnToMainMenuMessage()
    )
    
    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.MAIN_MENU
    )
    
    return this.createSuccessResponse(ChatState.MAIN_MENU)
  }

  private async handleWeekDetails(context: ConversationContext): Promise<HandlerResponse> {
    // Similar to handleTodayDetails but for week events
    const option = this.validateNumericOption(context.messageContent, 0, 20)

    if (context.normalizedMessage === '0') {
      await this.sendMessage(context.phoneNumber, "Volviendo a eventos de la semana...")
      
      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.MENU_WEEK
      )
      
      return this.createSuccessResponse(ChatState.MENU_WEEK)
    }

    if (option.isValid && option.value! > 0) {
      await this.sendMessage(
        context.phoneNumber,
        `Mostrando detalles del evento ${option.value} de la semana...`
      )
      return this.createSuccessResponse(context.currentState)
    }

    await this.sendMessage(
      context.phoneNumber,
      this.getReturnToMainMenuMessage()
    )
    
    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.MAIN_MENU
    )
    
    return this.createSuccessResponse(ChatState.MAIN_MENU)
  }

  // =============================================
  // STATE HANDLERS - SPECIAL MENUS
  // =============================================
  
  private async handleMenu18_35(context: ConversationContext): Promise<HandlerResponse> {
    // Handle 18-35 years old menu (in development)
    await this.sendMessage(
      context.phoneNumber,
      "🚧 Menú para 18-35 años en desarrollo...\n\n" + this.getReturnToMainMenuMessage()
    )

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.MAIN_MENU
    )

    return this.createSuccessResponse(ChatState.MAIN_MENU)
  }

  private async handleMenuReport(context: ConversationContext): Promise<HandlerResponse> {
    // Handle report/complaint menu (in development)
    await this.sendMessage(
      context.phoneNumber,
      "🚧 Menú de reportes en desarrollo...\n\n" + this.getReturnToMainMenuMessage()
    )

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.MAIN_MENU
    )

    return this.createSuccessResponse(ChatState.MAIN_MENU)
  }

  // =============================================
  // MESSAGE TEMPLATES
  // =============================================
  
  private getMainMenuMessage(): string {
    return `Hola! Soy *Mia*! 💃
Sé prácticamente todo lo que hay que saber sobre el tango en Mar del Plata. ¿En qué te puedo ayudar?

1 - Quiero saber las clases o eventos de *hoy*
2 - Quiero saber las clases o eventos de *la semana*
3 - Tengo entre 18 y 35 años y quiero entrar al mundo del tango
4 - Quiero *denunciar algo* o hacer una *recomendación tanguera*`
  }

  private getSpecialMenuMessage(): string {
    return `📋 ¿Qué te gustaría hacer?

1 - Crear *clase*
2 - Crear *milonga*
3 - Crear *seminario*
4 - Crear *evento especial*
5 - Crear *profesor* (otra persona)
6 - Modificar un *evento*

0 - Volver al menú principal`
  }

  private get18_35MenuMessage(): string {
    return `🎯 *Menú para jóvenes (18-35 años)*

¡Perfecto! Estás en la edad ideal para comenzar o profundizar en el tango.

🚧 Este menú especializado está en desarrollo...

Mientras tanto, podés ver todas las actividades disponibles en el menú principal.

${this.getReturnToMainMenuMessage()}`
  }

  private getReportMenuMessage(): string {
    return `📢 *Reportes y Recomendaciones*

¿Querés reportar algo o hacer una recomendación sobre el tango en Mar del Plata?

🚧 Este sistema está en desarrollo...

Por ahora podés contactarnos directamente para cualquier consulta.

${this.getReturnToMainMenuMessage()}`
  }

  private getReturnToMainMenuMessage(): string {
    return `¿Te gustaría saber algo más? 😊

1 - Quiero saber las clases o eventos de *hoy*
2 - Quiero saber las clases o eventos de *la semana*
3 - Tengo entre 18 y 35 años y quiero entrar al mundo del tango
4 - Quiero *denunciar algo* o hacer una *recomendación tanguera*`
  }
}