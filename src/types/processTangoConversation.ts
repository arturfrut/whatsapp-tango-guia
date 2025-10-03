export enum ChatState {
  START = 'START',
  MAIN_MENU = 'MAIN_MENU',
  MENU_TODAY = 'MENU_TODAY',
  MENU_WEEK = 'MENU_WEEK',
  MENU_TODAY_DETAILS = 'MENU_TODAY_DETAILS',
  MENU_WEEK_DETAILS = 'MENU_WEEK_DETAILS',
  MENU_18_35 = 'MENU_18_35',
  MENU_REPORT = 'MENU_REPORT',
  SECRET_CODE = 'SECRET_CODE',
  NEW_TEACHER = 'NEW_TEACHER',
  SPECIAL_MENU = 'SPECIAL_MENU',

  NEW_TEACHER_NAME = 'NEW_TEACHER_NAME',
  NEW_TEACHER_DETAILS = 'NEW_TEACHER_DETAILS',
  NEW_TEACHER_CONFIRMATION = 'NEW_TEACHER_CONFIRMATION',

  CREATE_OTHER_TEACHER_PHONE = 'CREATE_OTHER_TEACHER_PHONE',
  CREATE_OTHER_TEACHER_NAME = 'CREATE_OTHER_TEACHER_NAME',
  CREATE_OTHER_TEACHER_DETAILS = 'CREATE_OTHER_TEACHER_DETAILS',
  CREATE_OTHER_TEACHER_CONFIRMATION = 'CREATE_OTHER_TEACHER_CONFIRMATION',

  // Nuevos estados para IA
  AI_EVENT_INPUT = 'AI_EVENT_INPUT',
  AI_EVENT_VALIDATION = 'AI_EVENT_VALIDATION',
  AI_EVENT_CORRECTION = 'AI_EVENT_CORRECTION',
  AI_EVENT_TEACHER_SEARCH = 'AI_EVENT_TEACHER_SEARCH',
  AI_EVENT_TEACHER_SELECT = 'AI_EVENT_TEACHER_SELECT',
  AI_EVENT_TEACHER_CREATE = 'AI_EVENT_TEACHER_CREATE'
}

export interface NewTeacherData {
  name?: string
  details?: string
  phone?: string
}

export type ClassLevel = 'beginner' | 'intermediate' | 'advanced' | 'all_levels'

export type EventType = 'class' | 'seminar' | 'milonga' | 'special_event'

export type OrganizerType = 'teacher' | 'special_user'

export interface EventClass {
  id: string
  event_id: string
  class_name?: string
  start_time: string
  end_time?: string
  class_level?: ClassLevel
  class_order: number
  created_at: string
}

// Practice session
export interface EventPractice {
  id: string
  event_id: string
  practice_time: string
  practice_end_time?: string
  created_at: string
}

// Event organizers/teachers
export interface EventOrganizer {
  id: string
  event_id: string
  user_id?: string
  organizer_type: OrganizerType
  is_primary: boolean
  is_one_time_teacher: boolean
  one_time_teacher_name?: string
  created_at: string
  // Relations
  user?: {
    id: string
    name?: string
    phone_number: string
  }
}

// Pricing options
export interface EventPricing {
  id: string
  event_id: string
  price_type: string
  price: number
  description?: string
  created_at: string
}

// Seminar day
export interface SeminarDay {
  id: string
  event_id: string
  day_number: number
  date: string
  theme?: string
  created_at: string
}

// Pre-milonga class
export interface MilongaPreClass {
  id: string
  event_id: string
  class_time: string
  class_end_time?: string
  class_level?: ClassLevel
  milonga_start_time?: string
  created_at: string
}

// Seminar day classes
export interface SeminarDayClass {
  id: string
  seminar_day_id: string
  class_name: string
  start_time: string
  end_time?: string
  class_level?: ClassLevel
  class_order: number
  created_at: string
}

export interface TangoEvent {
  id: string
  title: string
  event_type: EventType
  description?: string
  venue_name: string
  address: string
  contact_phone?: string
  reminder_phone?: string
  date: string
  has_weekly_recurrence: boolean
  avatar_image_url?: string
  images?: string[]
  show_description?: string
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface NewEventData {
  // Basic info
  event_type?: EventType
  title?: string
  venue_name?: string
  address?: string
  date?: string
  description?: string
  has_weekly_recurrence?: boolean
  contact_phone?: string
  reminder_phone?: string
  show_description?: string
  classes?: {
    class_name?: string
    start_time: string
    end_time?: string
    class_level?: ClassLevel
  }[]

  // Practice
  practice?: {
    practice_time: string
    practice_end_time?: string
  }

  // Organizers
  organizers?: {
    user_id?: string
    organizer_type: OrganizerType
    is_primary: boolean
    is_one_time_teacher: boolean
    one_time_teacher_name?: string
  }[]

  // Pricing
  pricing?: {
    price_type: string
    price: number
    description?: string
  }[]

  // Seminar specific
  seminar_days?: {
    day_number: number
    date: string
    theme?: string
    classes: {
      class_name: string
      start_time: string
      end_time?: string
      class_level?: ClassLevel
    }[]
  }[]

  // Milonga specific
  milonga_time?: string
  pre_class?: {
    class_time: string
    milonga_start_time?: string
    class_end_time?: string
    class_level?: ClassLevel
    organizers?: string[]
  }
}

// Nueva interfaz para respuesta de IA
export interface AIEventExtraction {
  extractedData: Partial<NewEventData>
  confidence: number
  missingFields: string[]
  validationMessage: string
  needsHumanInput: boolean
  followUpQuestions?: string[]
  teacherNames?: string[]
}

export enum UserRole {
  TEACHER = 'teacher',
  NORMAL_QUERY = 'normal_query',
  SPECIAL_STUDENT = 'special_student',
  ADMINISTRATOR = 'administrator',
  SPECIAL_GUEST = 'special_guest'
}

export interface User {
  id: string
  phone_number: string
  role: UserRole
  name?: string
  password_hash?: string
  details?: string
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at?: string
}

// Complete event with all relations
export interface CompleteEventData extends TangoEvent {
  classes?: EventClass[]
  practice?: EventPractice
  organizers?: EventOrganizer[]
  pricing?: EventPricing[]
  seminar_days?: (SeminarDay & {
    classes?: SeminarDayClass[]
  })[]
  milonga_pre_class?: MilongaPreClass
}

export interface TempEventData {
  events: any[]
  context: 'today' | 'week'
}

export interface TeacherSearchResult {
  id: string
  name: string
  phone_number: string
  details?: string
}



export interface AIEventDataStore {
  extraction: AIEventExtraction
  originalInput: string
  teacherSearchResults?: Array<{
    searchedName: string
    results: Array<{
      id?: string
      name?: string
      phone_number?: string
      details?: string
    }>
  }>
  currentTeacherIndex?: number
  selectedTeachers?: Array<{
    user_id?: string
    organizer_type: 'teacher' | 'special_user'
    is_primary: boolean
    is_one_time_teacher: boolean
    one_time_teacher_name?: string
  }>
}