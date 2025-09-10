import { WhatsAppService } from '../../services/whatsapp'
import { ValidationUtils } from './ValidationUtils'
import { MessageUtils } from './MessageUtils'
import { 
  ChatState, 
  ConversationContext, 
  HandlerResponse, 
  ValidationResult 
} from './types'

export abstract class BaseHandler {
  
  // =============================================
  // ABSTRACT METHODS - MUST BE IMPLEMENTED
  // =============================================
  
  abstract canHandle(state: ChatState): boolean
  abstract handle(context: ConversationContext): Promise<HandlerResponse>

  // =============================================
  // COMMON VALIDATION HELPERS
  // =============================================
  
  protected async validateAndRespond(
    phoneNumber: string,
    input: string,
    validationType: 'date' | 'time' | 'phone' | 'name' | 'description' | 'price',
    options?: any
  ): Promise<{ isValid: boolean; value?: string }> {
    
    let result: ValidationResult
    
    switch (validationType) {
      case 'date':
        result = ValidationUtils.validateDate(input, options)
        break
      case 'time':
        result = ValidationUtils.validateTime(input, options)
        break
      case 'phone':
        result = ValidationUtils.validatePhone(input, options)
        break
      case 'name':
        result = ValidationUtils.validateName(input, options?.minLength)
        break
      case 'description':
        result = ValidationUtils.validateDescription(input, options?.minLength)
        break
      case 'price':
        result = ValidationUtils.validatePrice(input)
        break
      default:
        result = { isValid: false, error: 'Tipo de validación no reconocido' }
    }

    if (!result.isValid) {
      await this.sendValidationError(phoneNumber, result.error!, options?.example)
      return { isValid: false }
    }

    return { isValid: true, value: result.value }
  }

  // =============================================
  // COMMON STATE MANAGEMENT
  // =============================================
  
  protected updateState(
    userStates: Map<string, ChatState>,
    phoneNumber: string,
    newState: ChatState
  ): void {
    userStates.set(phoneNumber, newState)
  }

  protected getCurrentState(
    userStates: Map<string, ChatState>,
    phoneNumber: string
  ): ChatState | undefined {
    return userStates.get(phoneNumber)
  }

  // =============================================
  // COMMON MESSAGE SENDING
  // =============================================
  
  protected async sendMessage(phoneNumber: string, message: string): Promise<void> {
    await WhatsAppService.sendTextMessage(phoneNumber, message)
  }

  protected async sendValidationError(
    phoneNumber: string, 
    error: string, 
    example?: string
  ): Promise<void> {
    const message = MessageUtils.getValidationErrorMessage(error, example)
    await this.sendMessage(phoneNumber, message)
  }

  protected async sendInvalidOption(
    phoneNumber: string, 
    validOptions?: string
  ): Promise<void> {
    const message = MessageUtils.getInvalidOptionMessage(validOptions)
    await this.sendMessage(phoneNumber, message)
  }

  protected async sendGenericError(phoneNumber: string): Promise<void> {
    const message = MessageUtils.getGenericErrorMessage()
    await this.sendMessage(phoneNumber, message)
  }

  // =============================================
  // COMMON INPUT PROCESSING
  // =============================================
  
  protected normalizeInput(input: string): string {
    return input.trim().toLowerCase()
  }

  protected isGoBackCommand(normalizedInput: string): boolean {
    return ['0', 'volver'].includes(normalizedInput)
  }

  protected isExitCommand(normalizedInput: string): boolean {
    return ['salir', 'cancelar'].includes(normalizedInput)
  }

  protected isConfirmCommand(normalizedInput: string): boolean {
    return ['1', 'si', 'sí', 'confirmo', 'crear'].includes(normalizedInput)
  }

  protected isDeclineCommand(normalizedInput: string): boolean {
    return ['2', 'no', 'modificar'].includes(normalizedInput)
  }

  // =============================================
  // COMMON OPTION VALIDATION
  // =============================================
  
  protected validateMenuOption(
    input: string, 
    validOptions: string[]
  ): { isValid: boolean; option?: string } {
    const normalized = this.normalizeInput(input)
    
    if (validOptions.includes(normalized)) {
      return { isValid: true, option: normalized }
    }
    
    return { isValid: false }
  }

  protected validateNumericOption(
    input: string, 
    min: number, 
    max: number
  ): { isValid: boolean; value?: number } {
    const normalized = this.normalizeInput(input)
    const num = parseInt(normalized)
    
    if (!isNaN(num) && num >= min && num <= max) {
      return { isValid: true, value: num }
    }
    
    return { isValid: false }
  }

  // =============================================
  // COMMON DATA HELPERS
  // =============================================
  
  protected updateTempData<T>(
    tempDataMap: Map<string, T>,
    phoneNumber: string,
    updateFn: (data: T) => T
  ): void {
    const currentData = tempDataMap.get(phoneNumber)
    if (currentData) {
      const updatedData = updateFn(currentData)
      tempDataMap.set(phoneNumber, updatedData)
    }
  }

  protected getTempData<T>(
    tempDataMap: Map<string, T>,
    phoneNumber: string
  ): T | undefined {
    return tempDataMap.get(phoneNumber)
  }

  protected clearTempData<T>(
    tempDataMap: Map<string, T>,
    phoneNumber: string
  ): void {
    tempDataMap.delete(phoneNumber)
  }

  // =============================================
  // ERROR HANDLING HELPERS
  // =============================================
  
  protected async handleError(
    phoneNumber: string,
    error: Error,
    context: string
  ): Promise<HandlerResponse> {
    console.error(`Error in ${context}:`, error)
    await this.sendGenericError(phoneNumber)
    return { success: false, error: error.message }
  }

  protected async handleUnexpectedState(
    phoneNumber: string,
    state: ChatState
  ): Promise<HandlerResponse> {
    console.error(`Unexpected state: ${state} for phone: ${phoneNumber}`)
    await this.sendGenericError(phoneNumber)
    return { success: false, error: `Unexpected state: ${state}` }
  }

  // =============================================
  // LOGGING HELPERS
  // =============================================
  
  protected logHandlerAction(
    phoneNumber: string,
    action: string,
    state?: ChatState,
    data?: any
  ): void {
    console.log(`🔄 ${this.constructor.name} - ${action} - Phone: ${phoneNumber}${state ? `, State: ${state}` : ''}${data ? `, Data: ${JSON.stringify(data)}` : ''}`)
  }

  protected logStateTransition(
    phoneNumber: string,
    fromState: ChatState | undefined,
    toState: ChatState
  ): void {
    console.log(`🔄 State transition - Phone: ${phoneNumber}, From: ${fromState || 'undefined'}, To: ${toState}`)
  }

  // =============================================
  // UTILITY METHODS
  // =============================================
  
  protected createContext(
    phoneNumber: string,
    messageContent: string,
    currentState: ChatState
  ): ConversationContext {
    return {
      phoneNumber,
      messageContent,
      currentState,
      normalizedMessage: this.normalizeInput(messageContent)
    }
  }

  protected createSuccessResponse(nextState?: ChatState): HandlerResponse {
    return {
      success: true,
      nextState
    }
  }

  protected createErrorResponse(error: string): HandlerResponse {
    return {
      success: false,
      error
    }
  }

  // =============================================
  // NAVIGATION HELPERS
  // =============================================
  
  protected async handleGoBack(
    userStates: Map<string, ChatState>,
    phoneNumber: string,
    backStateMap: Partial<Record<ChatState, ChatState>>,
    defaultState: ChatState = ChatState.START
  ): Promise<HandlerResponse> {
    const currentState = this.getCurrentState(userStates, phoneNumber)
    const previousState = currentState ? backStateMap[currentState] : undefined
    
    if (previousState) {
      this.updateState(userStates, phoneNumber, previousState)
      this.logStateTransition(phoneNumber, currentState, previousState)
      // Note: The caller should handle sending the appropriate message for the previous state
      return this.createSuccessResponse(previousState)
    } else {
      this.updateState(userStates, phoneNumber, defaultState)
      this.logStateTransition(phoneNumber, currentState, defaultState)
      return this.createSuccessResponse(defaultState)
    }
  }

  protected async handleExit(
    userStates: Map<string, ChatState>,
    tempDataMaps: Array<Map<string, any>>,
    phoneNumber: string,
    exitMessage?: string
  ): Promise<HandlerResponse> {
    tempDataMaps.forEach(map => this.clearTempData(map, phoneNumber))
    
    this.updateState(userStates, phoneNumber, ChatState.START)
    
    const message = exitMessage || "❌ Operación cancelada.\n\n¿Necesitas algo más?"
    await this.sendMessage(phoneNumber, message)
    
    this.logHandlerAction(phoneNumber, 'Exit operation')
    
    return this.createSuccessResponse(ChatState.START)
  }
}