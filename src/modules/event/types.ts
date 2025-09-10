import { NewEventData } from './types'
import { OrganizerType } from './types'
import { EventType } from './types'
import { ClassLevel } from './types'

// Re-export common types
export {
  EventType,
  ClassLevel,
  NewEventData,
  CompleteEventData,
  TangoEvent,
  OrganizerType,
    ChatState,
  ConversationContext,
  HandlerResponse,
} from '../common/types'

// Event-specific types - now matching the exact structure of NewEventData
export interface EventCreationContext {
  phoneNumber: string
  eventData: NewEventData
  currentClassIndex?: number
}

export interface ClassCreationData {
  class_name?: string
  start_time: string
  end_time?: string
  class_level?: ClassLevel
}

export interface PracticeCreationData {
  practice_time: string
  practice_end_time?: string
}

export interface MilongaPreClassData {
  class_time: string
  class_end_time?: string
  class_level?: ClassLevel
  milonga_start_time: string
}

// Use the exact same structure as in NewEventData.organizers
export interface OrganizerCreationData {
  user_id?: string
  organizer_type: OrganizerType
  is_primary: boolean
  is_one_time_teacher: boolean
  one_time_teacher_name?: string
}

// Use the exact same structure as in NewEventData.pricing
export interface PricingCreationData {
  price_type: string
  price: number
  description?: string
}

// Event creation flow states
export interface EventFlowState {
  step: 'title' | 'venue' | 'address' | 'date' | 'time' | 'details' | 'organizers' | 'pricing' | 'confirmation'
  eventType: EventType
  data: Partial<NewEventData>
}

// Validation options for events
export interface EventValidationOptions {
  requireTitle?: boolean
  minTitleLength?: number
  requireVenue?: boolean
  requireAddress?: boolean
  requireDate?: boolean
  requireTime?: boolean
  allowPastDates?: boolean
}

// Event type specific validation
export interface ClassValidationOptions extends EventValidationOptions {
  requireLevel?: boolean
  allowMultipleClasses?: boolean
  requirePractice?: boolean
}

export interface MilongaValidationOptions extends EventValidationOptions {
  requirePreClass?: boolean
  requireShow?: boolean
  requireMilongaTime?: boolean
}

export interface SpecialEventValidationOptions extends EventValidationOptions {
  requireDescription?: boolean
}

// Search and selection types
export interface TeacherSearchResult {
  id: string
  name: string
  phone_number?: string
  details?: string
}

export interface EventCreationError {
  field: string
  message: string
  code: string
}

// Event display types
export interface EventDisplayData {
  id: string
  title: string
  eventType: EventType
  venue: string
  address: string
  date: string
  timeDisplay: string
  organizerName: string
  pricing?: string
  hasRecurrence: boolean
}

export interface EventListItem {
  index: number
  title: string
  time: string
  organizer: string
  address: string
}

// Event type mappings
export const EVENT_TYPE_NAMES: Record<EventType, string> = {
  class: 'clase',
  milonga: 'milonga',
  seminar: 'seminario',
  special_event: 'evento especial'
}

export const CLASS_LEVEL_NAMES: Record<ClassLevel, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  all_levels: 'Todos los niveles'
}

// Event creation step validation
export type EventCreationStep = 
  | 'type_selection'
  | 'title'
  | 'venue'
  | 'address'
  | 'date'
  | 'class_config'
  | 'class_time'
  | 'class_level'
  | 'milonga_time'
  | 'milonga_preclass'
  | 'milonga_show'
  | 'special_time'
  | 'organizers'
  | 'recurrence'
  | 'contact'
  | 'description'
  | 'pricing'
  | 'confirmation'

// Helper type for organizer options
export interface OrganizerOption {
  type: 'self' | 'search' | 'new' | 'additional'
  label: string
  value: string
}

// Pricing types
export type PricingType = 
  | 'general'
  | 'class_only'
  | 'practice_only'
  | 'class_and_practice'
  | 'milonga_only'
  | 'class_and_milonga'
  | 'custom'

export interface PricingOption {
  type: PricingType
  description: string
  price: number
}