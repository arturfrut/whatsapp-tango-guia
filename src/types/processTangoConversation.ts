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

  // Estados para crear nuevo profesor
  NEW_TEACHER_NAME = 'NEW_TEACHER_NAME',
  NEW_TEACHER_PASSWORD = 'NEW_TEACHER_PASSWORD',
  NEW_TEACHER_DETAILS = 'NEW_TEACHER_DETAILS',
  NEW_TEACHER_CONFIRMATION = 'NEW_TEACHER_CONFIRMATION',

  CREATE_EVENT_INSTRUCTOR_SELECTION = 'CREATE_EVENT_INSTRUCTOR_SELECTION',
  CREATE_EVENT_INSTRUCTOR_INPUT = 'CREATE_EVENT_INSTRUCTOR_INPUT',
  CREATE_EVENT_INSTRUCTOR_LIST = 'CREATE_EVENT_INSTRUCTOR_LIST',
  CREATE_EVENT_INSTRUCTOR_SELECTION_LIST = 'CREATE_EVENT_INSTRUCTOR_SELECTION_LIST',
  CREATE_EVENT_INSTRUCTOR_LIST_SELECTION = 'CREATE_EVENT_INSTRUCTOR_LIST_SELECTION',
  CREATE_EVENT_INSTRUCTOR_NOT_FOUND = 'CREATE_EVENT_INSTRUCTOR_NOT_FOUND',

  // Estados para crear eventos
  CREATE_EVENT_TYPE = 'CREATE_EVENT_TYPE',
  CREATE_EVENT_TITLE = 'CREATE_EVENT_TITLE',
  CREATE_EVENT_DESCRIPTION = 'CREATE_EVENT_DESCRIPTION',
  CREATE_EVENT_LEVEL = 'CREATE_EVENT_LEVEL',
  CREATE_EVENT_PRICE = 'CREATE_EVENT_PRICE',
  CREATE_EVENT_ADDRESS = 'CREATE_EVENT_ADDRESS',
  CREATE_EVENT_DATE = 'CREATE_EVENT_DATE',
  CREATE_EVENT_TIME = 'CREATE_EVENT_TIME',
  CREATE_EVENT_RECURRENCE = 'CREATE_EVENT_RECURRENCE',
  CREATE_EVENT_DAY_OF_WEEK = 'CREATE_EVENT_DAY_OF_WEEK',
  CREATE_EVENT_CONFIRMATION = 'CREATE_EVENT_CONFIRMATION'
}

export interface NewTeacherData {
  name?: string
  password?: string
  details?: string
}

export interface NewEventData {
  event_type?: string
  title?: string
  description?: string
  class_level?: string
  price?: number
  address?: string
  date?: string
  time?: string
  has_recurrence?: boolean
  day_of_week?: string
  instructor_type?: 'self' | 'other'
  selected_instructor_id?: string
  selected_instructor_name?: string
  instructor_search_results?: Array<{
    id: string
    name: string
    phone: string
  }>
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
