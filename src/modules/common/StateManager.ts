import { ChatState } from './types'

export class StateManager {
  
  // =============================================
  // STATE TRANSITION MAPS
  // =============================================
  
  // Event creation flow - back navigation
  private static readonly EVENT_BACK_TRANSITIONS: Partial<Record<ChatState, ChatState>> = {
    [ChatState.CREATE_EVENT_TITLE]: ChatState.SPECIAL_MENU,
    [ChatState.CREATE_EVENT_VENUE]: ChatState.CREATE_EVENT_TITLE,
    [ChatState.CREATE_EVENT_ADDRESS]: ChatState.CREATE_EVENT_VENUE,
    [ChatState.CREATE_EVENT_DATE]: ChatState.CREATE_EVENT_ADDRESS,
    
    // Class flow
    [ChatState.CREATE_CLASS_SINGLE_OR_MULTIPLE]: ChatState.CREATE_EVENT_DATE,
    [ChatState.CREATE_CLASS_TIME]: ChatState.CREATE_CLASS_SINGLE_OR_MULTIPLE,
    [ChatState.CREATE_CLASS_LEVEL]: ChatState.CREATE_CLASS_TIME,
    [ChatState.CREATE_CLASS_ADD_ANOTHER]: ChatState.CREATE_CLASS_LEVEL,
    [ChatState.CREATE_CLASS_PRACTICE]: ChatState.CREATE_CLASS_ADD_ANOTHER,
    [ChatState.CREATE_CLASS_PRACTICE_TIME]: ChatState.CREATE_CLASS_PRACTICE,
    
    // Milonga flow
    [ChatState.CREATE_MILONGA_TIME]: ChatState.CREATE_EVENT_DATE,
    [ChatState.CREATE_MILONGA_PRE_CLASS]: ChatState.CREATE_MILONGA_TIME,
    [ChatState.CREATE_MILONGA_PRE_CLASS_DETAILS]: ChatState.CREATE_MILONGA_PRE_CLASS,
    [ChatState.CREATE_MILONGA_SHOW]: ChatState.CREATE_MILONGA_PRE_CLASS_DETAILS,
    
    // Special event flow
    [ChatState.CREATE_SPECIAL_TIME]: ChatState.CREATE_EVENT_DATE,
    
    // Organizer flow
    [ChatState.CREATE_EVENT_ORGANIZERS]: ChatState.CREATE_CLASS_PRACTICE,
    [ChatState.CREATE_EVENT_ORGANIZER_SELF]: ChatState.CREATE_EVENT_ORGANIZERS,
    [ChatState.CREATE_EVENT_ORGANIZER_ADDITIONAL]: ChatState.CREATE_EVENT_ORGANIZER_SELF,
    [ChatState.CREATE_EVENT_ORGANIZER_SEARCH]: ChatState.CREATE_EVENT_ORGANIZERS,
    [ChatState.CREATE_EVENT_ORGANIZER_SELECT]: ChatState.CREATE_EVENT_ORGANIZER_SEARCH,
    [ChatState.CREATE_EVENT_ORGANIZER_ONE_TIME]: ChatState.CREATE_EVENT_ORGANIZER_SEARCH,
    
    // Final flow
    [ChatState.CREATE_EVENT_RECURRENCE]: ChatState.CREATE_EVENT_ORGANIZER_ADDITIONAL,
    [ChatState.CREATE_EVENT_CONTACT]: ChatState.CREATE_EVENT_RECURRENCE,
    [ChatState.CREATE_EVENT_CONTACT_NUMBER]: ChatState.CREATE_EVENT_CONTACT,
    [ChatState.CREATE_EVENT_REMINDER]: ChatState.CREATE_EVENT_CONTACT,
    [ChatState.CREATE_EVENT_REMINDER_NUMBER]: ChatState.CREATE_EVENT_REMINDER,
    [ChatState.CREATE_EVENT_DESCRIPTION]: ChatState.CREATE_EVENT_REMINDER,
    [ChatState.CREATE_EVENT_PRICING]: ChatState.CREATE_EVENT_DESCRIPTION,
    [ChatState.CREATE_EVENT_PRICING_TYPE]: ChatState.CREATE_EVENT_PRICING,
    [ChatState.CREATE_EVENT_PRICING_DETAILS]: ChatState.CREATE_EVENT_PRICING_TYPE,
    [ChatState.CREATE_EVENT_PRICING_AMOUNT]: ChatState.CREATE_EVENT_PRICING_DETAILS,
    [ChatState.CREATE_EVENT_PRICING_ADD_MORE]: ChatState.CREATE_EVENT_PRICING_AMOUNT,
    [ChatState.CREATE_EVENT_CONFIRMATION]: ChatState.CREATE_EVENT_PRICING_ADD_MORE
  }
  
  // Teacher creation flow - back navigation
  private static readonly TEACHER_BACK_TRANSITIONS: Partial<Record<ChatState, ChatState>> = {
    [ChatState.NEW_TEACHER_NAME]: ChatState.SPECIAL_MENU,
    [ChatState.NEW_TEACHER_DETAILS]: ChatState.NEW_TEACHER_NAME,
    [ChatState.NEW_TEACHER_CONFIRMATION]: ChatState.NEW_TEACHER_DETAILS,
    
    // Other teacher creation
    [ChatState.CREATE_OTHER_TEACHER_PHONE]: ChatState.SPECIAL_MENU,
    [ChatState.CREATE_OTHER_TEACHER_NAME]: ChatState.CREATE_OTHER_TEACHER_PHONE,
    [ChatState.CREATE_OTHER_TEACHER_DETAILS]: ChatState.CREATE_OTHER_TEACHER_NAME,
    [ChatState.CREATE_OTHER_TEACHER_CONFIRMATION]: ChatState.CREATE_OTHER_TEACHER_DETAILS
  }
  
  // Menu flow - back navigation
  private static readonly MENU_BACK_TRANSITIONS: Partial<Record<ChatState, ChatState>> = {
    [ChatState.MENU_TODAY]: ChatState.MAIN_MENU,
    [ChatState.MENU_WEEK]: ChatState.MAIN_MENU,
    [ChatState.MENU_TODAY_DETAILS]: ChatState.MENU_TODAY,
    [ChatState.MENU_WEEK_DETAILS]: ChatState.MENU_WEEK,
    [ChatState.SPECIAL_MENU]: ChatState.MAIN_MENU
  }

  // =============================================
  // STATE CLASSIFICATION
  // =============================================
  
  static readonly EVENT_CREATION_STATES = new Set([
    ChatState.CREATE_EVENT_TITLE,
    ChatState.CREATE_EVENT_VENUE,
    ChatState.CREATE_EVENT_ADDRESS,
    ChatState.CREATE_EVENT_DATE,
    ChatState.CREATE_CLASS_SINGLE_OR_MULTIPLE,
    ChatState.CREATE_CLASS_TIME,
    ChatState.CREATE_CLASS_LEVEL,
    ChatState.CREATE_CLASS_ADD_ANOTHER,
    ChatState.CREATE_CLASS_PRACTICE,
    ChatState.CREATE_CLASS_PRACTICE_TIME,
    ChatState.CREATE_MILONGA_TIME,
    ChatState.CREATE_MILONGA_PRE_CLASS,
    ChatState.CREATE_MILONGA_PRE_CLASS_DETAILS,
    ChatState.CREATE_MILONGA_SHOW,
    ChatState.CREATE_SPECIAL_TIME,
    ChatState.CREATE_EVENT_ORGANIZERS,
    ChatState.CREATE_EVENT_ORGANIZER_SELF,
    ChatState.CREATE_EVENT_ORGANIZER_ADDITIONAL,
    ChatState.CREATE_EVENT_ORGANIZER_SEARCH,
    ChatState.CREATE_EVENT_ORGANIZER_SELECT,
    ChatState.CREATE_EVENT_ORGANIZER_ONE_TIME,
    ChatState.CREATE_EVENT_RECURRENCE,
    ChatState.CREATE_EVENT_CONTACT,
    ChatState.CREATE_EVENT_CONTACT_NUMBER,
    ChatState.CREATE_EVENT_REMINDER,
    ChatState.CREATE_EVENT_REMINDER_NUMBER,
    ChatState.CREATE_EVENT_DESCRIPTION,
    ChatState.CREATE_EVENT_PRICING,
    ChatState.CREATE_EVENT_PRICING_TYPE,
    ChatState.CREATE_EVENT_PRICING_DETAILS,
    ChatState.CREATE_EVENT_PRICING_AMOUNT,
    ChatState.CREATE_EVENT_PRICING_ADD_MORE,
    ChatState.CREATE_EVENT_CONFIRMATION
  ])
  
  static readonly TEACHER_CREATION_STATES = new Set([
    ChatState.NEW_TEACHER_NAME,
    ChatState.NEW_TEACHER_DETAILS,
    ChatState.NEW_TEACHER_CONFIRMATION,
    ChatState.CREATE_OTHER_TEACHER_PHONE,
    ChatState.CREATE_OTHER_TEACHER_NAME,
    ChatState.CREATE_OTHER_TEACHER_DETAILS,
    ChatState.CREATE_OTHER_TEACHER_CONFIRMATION
  ])
  
  static readonly MENU_STATES = new Set([
    ChatState.START,
    ChatState.MAIN_MENU,
    ChatState.SPECIAL_MENU,
    ChatState.MENU_TODAY,
    ChatState.MENU_WEEK,
    ChatState.MENU_TODAY_DETAILS,
    ChatState.MENU_WEEK_DETAILS,
    ChatState.MENU_18_35,
    ChatState.MENU_REPORT
  ])

  // =============================================
  // STATE CLASSIFICATION METHODS
  // =============================================
  
  static isEventCreationState(state: ChatState): boolean {
    return this.EVENT_CREATION_STATES.has(state)
  }
  
  static isTeacherCreationState(state: ChatState): boolean {
    return this.TEACHER_CREATION_STATES.has(state)
  }
  
  static isMenuState(state: ChatState): boolean {
    return this.MENU_STATES.has(state)
  }

  // =============================================
  // NAVIGATION METHODS
  // =============================================
  
  static getPreviousState(currentState: ChatState): ChatState | undefined {
    // Try event creation flow first
    if (this.EVENT_BACK_TRANSITIONS[currentState]) {
      return this.EVENT_BACK_TRANSITIONS[currentState]
    }
    
    // Try teacher creation flow
    if (this.TEACHER_BACK_TRANSITIONS[currentState]) {
      return this.TEACHER_BACK_TRANSITIONS[currentState]
    }
    
    // Try menu flow
    if (this.MENU_BACK_TRANSITIONS[currentState]) {
      return this.MENU_BACK_TRANSITIONS[currentState]
    }
    
    return undefined
  }
  
  static getDefaultBackState(currentState: ChatState): ChatState {
    if (this.isEventCreationState(currentState)) {
      return ChatState.SPECIAL_MENU
    }
    
    if (this.isTeacherCreationState(currentState)) {
      return ChatState.SPECIAL_MENU
    }
    
    return ChatState.MAIN_MENU
  }

  // =============================================
  // FLOW VALIDATION
  // =============================================
  
  static isValidTransition(fromState: ChatState, toState: ChatState): boolean {
    if (this.isMenuState(toState)) {
      return true
    }
    
    const expectedPrevious = this.getPreviousState(toState)
    if (expectedPrevious === fromState) {
      return true
    }
    
    if (this.isEventCreationState(fromState) && this.isEventCreationState(toState)) {
      return true
    }
    
    if (this.isTeacherCreationState(fromState) && this.isTeacherCreationState(toState)) {
      return true
    }
    
    return false
  }

  // =============================================
  // FLOW HELPERS
  // =============================================
  
  static getFlowType(state: ChatState): 'event' | 'teacher' | 'menu' | 'unknown' {
    if (this.isEventCreationState(state)) return 'event'
    if (this.isTeacherCreationState(state)) return 'teacher'
    if (this.isMenuState(state)) return 'menu'
    return 'unknown'
  }
  
  static getFlowStartState(flowType: 'event' | 'teacher' | 'menu'): ChatState {
    switch (flowType) {
      case 'event': return ChatState.SPECIAL_MENU
      case 'teacher': return ChatState.NEW_TEACHER_NAME
      case 'menu': return ChatState.MAIN_MENU
    }
  }
  
  static isFlowComplete(state: ChatState): boolean {
    return [
      ChatState.CREATE_EVENT_CONFIRMATION,
      ChatState.NEW_TEACHER_CONFIRMATION,
      ChatState.CREATE_OTHER_TEACHER_CONFIRMATION
    ].includes(state)
  }

  // =============================================
  // SPECIAL NAVIGATION CASES
  // =============================================
  
  static handleSpecialNavigation(
    currentState: ChatState,
    input: string
  ): ChatState | null {
    const normalizedInput = input.trim().toLowerCase()
    
    // Global commands
    if (normalizedInput === 'salir' || normalizedInput === 'cancelar') {
      return ChatState.START
    }
    
    // Back command
    if (normalizedInput === '0' || normalizedInput === 'volver') {
      return this.getPreviousState(currentState) || this.getDefaultBackState(currentState)
    }
    
    return null
  }

  // =============================================
  // STATE UTILITIES
  // =============================================
  
  static getStateDescription(state: ChatState): string {
    const descriptions: Partial<Record<ChatState, string>> = {
      [ChatState.START]: 'Inicio',
      [ChatState.MAIN_MENU]: 'Menú Principal',
      [ChatState.SPECIAL_MENU]: 'Menú Especial',
      [ChatState.CREATE_EVENT_TITLE]: 'Creando Evento - Título',
      [ChatState.CREATE_EVENT_VENUE]: 'Creando Evento - Lugar',
      [ChatState.CREATE_EVENT_DATE]: 'Creando Evento - Fecha',
      [ChatState.NEW_TEACHER_NAME]: 'Creando Profesor - Nombre',
      [ChatState.NEW_TEACHER_DETAILS]: 'Creando Profesor - Detalles',
      [ChatState.MENU_TODAY]: 'Eventos de Hoy',
      [ChatState.MENU_WEEK]: 'Eventos de la Semana'
    }
    
    return descriptions[state] || `Estado: ${state}`
  }
  
  static logStateTransition(
    phoneNumber: string,
    fromState: ChatState | undefined,
    toState: ChatState,
    trigger?: string
  ): void {
    const fromDesc = fromState ? this.getStateDescription(fromState) : 'undefined'
    const toDesc = this.getStateDescription(toState)
    const triggerInfo = trigger ? ` (trigger: ${trigger})` : ''
    
    console.log(`🔄 State: ${phoneNumber} | ${fromDesc} → ${toDesc}${triggerInfo}`)
  }
}