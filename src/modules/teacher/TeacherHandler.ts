import { BaseHandler } from '../common/BaseHandler'
import { ValidationUtils } from '../common/ValidationUtils'
import { StateManager } from '../common/StateManager'
import {
  ChatState,
  ConversationContext,
  HandlerResponse
} from '../common/types'

export class TeacherHandler extends BaseHandler {
  
  // State transition maps for teacher creation
  private static readonly BACK_TRANSITIONS: Partial<Record<ChatState, ChatState>> = {
    [ChatState.NEW_TEACHER_NAME]: ChatState.SPECIAL_MENU,
    [ChatState.NEW_TEACHER_DETAILS]: ChatState.NEW_TEACHER_NAME,
    [ChatState.NEW_TEACHER_CONFIRMATION]: ChatState.NEW_TEACHER_DETAILS,
    [ChatState.CREATE_OTHER_TEACHER_PHONE]: ChatState.SPECIAL_MENU,
    [ChatState.CREATE_OTHER_TEACHER_NAME]: ChatState.CREATE_OTHER_TEACHER_PHONE,
    [ChatState.CREATE_OTHER_TEACHER_DETAILS]: ChatState.CREATE_OTHER_TEACHER_NAME,
    [ChatState.CREATE_OTHER_TEACHER_CONFIRMATION]: ChatState.CREATE_OTHER_TEACHER_DETAILS
  }

  // =============================================
  // HANDLER INTERFACE IMPLEMENTATION
  // =============================================
  
  canHandle(state: ChatState): boolean {
    return StateManager.isTeacherCreationState(state)
  }

  async handle(context: ConversationContext): Promise<HandlerResponse> {
    this.logHandlerAction(
      context.phoneNumber,
      'Processing teacher creation',
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
        case ChatState.NEW_TEACHER_NAME:
          return this.handleTeacherName(context)
        case ChatState.NEW_TEACHER_DETAILS:
          return this.handleTeacherDetails(context)
        case ChatState.NEW_TEACHER_CONFIRMATION:
          return this.handleTeacherConfirmation(context)
        case ChatState.CREATE_OTHER_TEACHER_PHONE:
          return this.handleOtherTeacherPhone(context)
        case ChatState.CREATE_OTHER_TEACHER_NAME:
          return this.handleOtherTeacherName(context)
        case ChatState.CREATE_OTHER_TEACHER_DETAILS:
          return this.handleOtherTeacherDetails(context)
        case ChatState.CREATE_OTHER_TEACHER_CONFIRMATION:
          return this.handleOtherTeacherConfirmation(context)
        default:
          return this.handleUnexpectedState(context.phoneNumber, context.currentState)
      }
    } catch (error) {
      return this.handleError(
        context.phoneNumber,
        error as Error,
        `TeacherHandler.handle - State: ${context.currentState}`
      )
    }
  }

  // =============================================
  // NAVIGATION HELPERS
  // =============================================
  
  private async handleGoBackNavigation(context: ConversationContext): Promise<HandlerResponse> {
    const previousState = TeacherHandler.BACK_TRANSITIONS[context.currentState]
    
    if (previousState) {
      this.logStateTransition(context.phoneNumber, context.currentState, previousState)
      
      // Send appropriate message for the previous state
      await this.sendStateMessage(context.phoneNumber, previousState)
      
      return this.createSuccessResponse(previousState)
    }

    // Fallback to special menu
    await this.sendMessage(context.phoneNumber, this.getSpecialMenuMessage())
    return this.createSuccessResponse(ChatState.SPECIAL_MENU)
  }

  private async handleExitNavigation(context: ConversationContext): Promise<HandlerResponse> {
    await this.sendMessage(
      context.phoneNumber,
      "❌ Creación de profesor cancelada.\n\n¿Necesitas algo más?"
    )
    return this.createSuccessResponse(ChatState.START)
  }

  private async sendStateMessage(phoneNumber: string, state: ChatState): Promise<void> {
    switch (state) {
      case ChatState.SPECIAL_MENU:
        await this.sendMessage(phoneNumber, this.getSpecialMenuMessage())
        break
      case ChatState.NEW_TEACHER_NAME:
        await this.sendMessage(phoneNumber, this.getTeacherNamePrompt())
        break
      case ChatState.CREATE_OTHER_TEACHER_PHONE:
        await this.sendMessage(phoneNumber, this.getOtherTeacherPhonePrompt())
        break
      default:
        await this.sendMessage(phoneNumber, "Volviendo al paso anterior...")
    }
  }

  // =============================================
  // STATE HANDLERS - SELF TEACHER CREATION
  // =============================================
  
  private async handleTeacherName(context: ConversationContext): Promise<HandlerResponse> {
    const validation = ValidationUtils.validateName(context.messageContent, 2)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!,
        "María González"
      )
      return this.createErrorResponse(validation.error!)
    }

    const name = validation.value!
    
    await this.sendMessage(
      context.phoneNumber,
      this.getTeacherDetailsPrompt(name)
    )

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.NEW_TEACHER_DETAILS
    )

    return this.createSuccessResponse(ChatState.NEW_TEACHER_DETAILS)
  }

  private async handleTeacherDetails(context: ConversationContext): Promise<HandlerResponse> {
    const validation = ValidationUtils.validateDescription(context.messageContent, 10)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!,
        "Soy profesor de tango desde hace 10 años, especializado en técnica y musicalidad."
      )
      return this.createErrorResponse(validation.error!)
    }

    // Would get name from temp data, for now use placeholder
    await this.sendMessage(
      context.phoneNumber,
      this.getTeacherConfirmationPrompt("Profesor", validation.value!)
    )

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.NEW_TEACHER_CONFIRMATION
    )

    return this.createSuccessResponse(ChatState.NEW_TEACHER_CONFIRMATION)
  }

  private async handleTeacherConfirmation(context: ConversationContext): Promise<HandlerResponse> {
    if (this.isConfirmCommand(context.normalizedMessage)) {
      // Teacher creation confirmed - would save to database
      await this.sendMessage(
        context.phoneNumber,
        this.getTeacherSuccessMessage("Profesor") // Would get real name from temp data
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.SPECIAL_MENU
      )

      return this.createSuccessResponse(ChatState.SPECIAL_MENU)
    } else if (this.isDeclineCommand(context.normalizedMessage)) {
      // Restart teacher creation
      await this.sendMessage(
        context.phoneNumber,
        this.getTeacherRestartMessage()
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.NEW_TEACHER_NAME
      )

      return this.createSuccessResponse(ChatState.NEW_TEACHER_NAME)
    } else {
      await this.sendInvalidOption(
        context.phoneNumber,
        "1 - Sí, crear mi perfil\n2 - No, modificar datos"
      )
      return this.createErrorResponse("Invalid confirmation option")
    }
  }

  // =============================================
  // STATE HANDLERS - OTHER TEACHER CREATION
  // =============================================
  
  private async handleOtherTeacherPhone(context: ConversationContext): Promise<HandlerResponse> {
    const validation = ValidationUtils.validatePhone(context.messageContent, {
      minLength: 10,
      maxLength: 10,
      mustStartWith: '2'
    })
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!,
        "2236028315"
      )
      return this.createErrorResponse(validation.error!)
    }

    const phone = validation.value!
    
    // Would check if teacher already exists in database
    // For now, assume they don't exist
    
    await this.sendMessage(
      context.phoneNumber,
      this.getOtherTeacherNamePrompt(phone)
    )

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.CREATE_OTHER_TEACHER_NAME
    )

    return this.createSuccessResponse(ChatState.CREATE_OTHER_TEACHER_NAME)
  }

  private async handleOtherTeacherName(context: ConversationContext): Promise<HandlerResponse> {
    const validation = ValidationUtils.validateName(context.messageContent, 2)
    
    if (!validation.isValid) {
      await this.sendValidationError(
        context.phoneNumber,
        validation.error!,
        "Juan Pérez"
      )
      return this.createErrorResponse(validation.error!)
    }

    const name = validation.value!
    
    await this.sendMessage(
      context.phoneNumber,
      this.getOtherTeacherDetailsPrompt(name)
    )

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.CREATE_OTHER_TEACHER_DETAILS
    )

    return this.createSuccessResponse(ChatState.CREATE_OTHER_TEACHER_DETAILS)
  }

  private async handleOtherTeacherDetails(context: ConversationContext): Promise<HandlerResponse> {
    const input = context.messageContent.trim()
    
    if (input === '.' || input === '-') {
      // Allow skipping details
      await this.sendMessage(
        context.phoneNumber,
        this.getOtherTeacherConfirmationPrompt("2236028315", "Juan Pérez", undefined) // Would get from temp data
      )
    } else if (input.length < 5) {
      await this.sendValidationError(
        context.phoneNumber,
        'La descripción debe tener al menos 5 caracteres o escribir "." para omitir.',
        "Profesor de tango especializado en milonga."
      )
      return this.createErrorResponse("Description too short")
    } else {
      await this.sendMessage(
        context.phoneNumber,
        this.getOtherTeacherConfirmationPrompt("2236028315", "Juan Pérez", input) // Would get from temp data
      )
    }

    this.logStateTransition(
      context.phoneNumber,
      context.currentState,
      ChatState.CREATE_OTHER_TEACHER_CONFIRMATION
    )

    return this.createSuccessResponse(ChatState.CREATE_OTHER_TEACHER_CONFIRMATION)
  }

  private async handleOtherTeacherConfirmation(context: ConversationContext): Promise<HandlerResponse> {
    if (this.isConfirmCommand(context.normalizedMessage)) {
      // Other teacher creation confirmed - would save to database
      await this.sendMessage(
        context.phoneNumber,
        this.getOtherTeacherSuccessMessage("Juan Pérez") // Would get real name from temp data
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.SPECIAL_MENU
      )

      return this.createSuccessResponse(ChatState.SPECIAL_MENU)
    } else if (this.isDeclineCommand(context.normalizedMessage)) {
      // Restart other teacher creation
      await this.sendMessage(
        context.phoneNumber,
        `🔄 Empecemos de nuevo.\n\n${this.getOtherTeacherPhonePrompt()}`
      )

      this.logStateTransition(
        context.phoneNumber,
        context.currentState,
        ChatState.CREATE_OTHER_TEACHER_PHONE
      )

      return this.createSuccessResponse(ChatState.CREATE_OTHER_TEACHER_PHONE)
    } else {
      await this.sendInvalidOption(
        context.phoneNumber,
        "1 - Sí, crear profesor\n2 - No, modificar datos"
      )
      return this.createErrorResponse("Invalid confirmation option")
    }
  }

  // =============================================
  // MESSAGE TEMPLATES
  // =============================================
  
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

  private getTeacherNamePrompt(): string {
    return `👨‍🏫 ¡Perfecto! Vamos a crear tu perfil de profesor.

¿Cuál es tu nombre completo?
*Ejemplo:* María González`
  }

  private getTeacherDetailsPrompt(name: string): string {
    return `✅ Nombre registrado: *${name}*

Ahora cuéntame un poco sobre ti. Esta información será visible para los alumnos interesados en tus clases.

*Ejemplo:* "Soy profesor de tango desde hace 10 años, especializado en técnica y musicalidad. Doy clases en el centro de Mar del Plata."`
  }

  private getTeacherConfirmationPrompt(name: string, details: string): string {
    return `📋 *CONFIRMACIÓN DE DATOS DE PROFESOR*

👤 *Nombre:* ${name}
📝 *Descripción:* ${details}

¿Confirmas que todos los datos están correctos?
1 - ✅ Sí, crear mi perfil
2 - ❌ No, quiero modificar algo`
  }

  private getTeacherSuccessMessage(name: string): string {
    return `🎉 ¡Felicitaciones ${name}! 

Tu perfil de profesor ha sido creado exitosamente.

${this.getSpecialMenuMessage()}`
  }

  private getTeacherRestartMessage(): string {
    return `🔄 Perfecto, empecemos de nuevo.

¿Cuál es tu nombre completo?
*Ejemplo:* María González`
  }

  private getOtherTeacherPhonePrompt(): string {
    return `📱 ¿Cuál es el número de teléfono del profesor?

*Formato:* 2236028315 (sin 0, ni 15, ni +54)
*Ejemplo:* 2236028315

_Envía "0" para volver_`
  }

  private getOtherTeacherNamePrompt(phone: string): string {
    return `✅ Teléfono: *+549${phone}*

👤 ¿Cuál es el nombre completo del profesor?

*Ejemplo:* Juan Pérez

_Envía "0" para volver_`
  }

  private getOtherTeacherDetailsPrompt(name: string): string {
    return `✅ Nombre: *${name}*

📝 Descripción del profesor (opcional)

Esta información será visible para los alumnos.

*Ejemplo:* "Profesor de tango especializado en milonga."

Escribe "." para omitir

_Envía "0" para volver_`
  }

  private getOtherTeacherConfirmationPrompt(phone: string, name: string, details?: string): string {
    return `📋 *CONFIRMACIÓN DE NUEVO PROFESOR*

📱 *Teléfono:* +549${phone}
👤 *Nombre:* ${name}
📝 *Descripción:* ${details || 'Sin descripción'}

¿Confirmas que todos los datos están correctos?
1 - ✅ Sí, crear profesor
2 - ❌ No, quiero modificar algo`
  }

  private getOtherTeacherSuccessMessage(name: string): string {
    return `🎉 ¡Profesor ${name} creado exitosamente!

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
}