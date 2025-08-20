export enum ChatState {
  START = 'START',
  MAIN_MENU = 'MAIN_MENU',
  MENU_TODAY = 'MENU_TODAY',
  MENU_WEEK = 'MENU_WEEK',
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

// Interfaces para datos temporales
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
}
