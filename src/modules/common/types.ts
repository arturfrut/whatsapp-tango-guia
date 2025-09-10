import { ChatState } from '../../types/processTangoConversation'

export interface ValidationResult {
  isValid: boolean
  value?: string
  error?: string
}

export interface ConversationContext {
  phoneNumber: string
  messageContent: string
  currentState: ChatState
  normalizedMessage: string
}

export interface HandlerResponse {
  success: boolean
  nextState?: ChatState
  error?: string
}

export {
  ChatState,
  EventType,
  ClassLevel,
  NewEventData,
  NewTeacherData,
  TempEventData,
  CompleteEventData,
  User,
  TangoEvent,
  OrganizerType
} from '../../types/processTangoConversation'

export interface DateValidationOptions {
  allowRelativeDates?: boolean  
  minYear?: number
  maxYear?: number
}

export interface TimeValidationOptions {
  format24Hour?: boolean
  allowAMPM?: boolean
  allowSpecialFormats?: boolean  
}

export interface PhoneValidationOptions {
  countryCode?: string
  minLength?: number
  maxLength?: number
  mustStartWith?: string
}