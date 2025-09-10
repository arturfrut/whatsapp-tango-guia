import { ValidationUtils } from '../common/ValidationUtils'
import { ValidationResult } from '../common/types'
import {
  EventType,
  ClassLevel,
  NewEventData,
  EventValidationOptions,
  EventCreationError
} from './types'

export class EventValidator {
  
  // =============================================
  // MAIN EVENT VALIDATION
  // =============================================
  
  static validateEventType(input: string): ValidationResult {
    const normalizedInput = input.trim().toLowerCase()
    
    const eventTypeMap: Record<string, EventType> = {
      '1': 'class',
      'clase': 'class',
      '2': 'milonga',
      'milonga': 'milonga',
      '3': 'seminar',
      'seminario': 'seminar',
      '4': 'special_event',
      'evento especial': 'special_event',
      'especial': 'special_event'
    }

    if (eventTypeMap[normalizedInput]) {
      return {
        isValid: true,
        value: eventTypeMap[normalizedInput]
      }
    }

    return {
      isValid: false,
      error: 'Tipo de evento inválido. Opciones: 1-Clase, 2-Milonga, 3-Seminario, 4-Evento Especial'
    }
  }

  static validateEventTitle(
    input: string, 
    options: EventValidationOptions = {}
  ): ValidationResult {
    const { minTitleLength = 3 } = options
    
    return ValidationUtils.validateName(input, minTitleLength)
  }

  static validateEventVenue(input: string): ValidationResult {
    const trimmed = input.trim()
    
    if (trimmed.length < 2) {
      return {
        isValid: false,
        error: 'El nombre del lugar debe ser más específico'
      }
    }

    return {
      isValid: true,
      value: trimmed
    }
  }

  static validateEventAddress(input: string): ValidationResult {
    const trimmed = input.trim()
    
    if (trimmed.length < 5) {
      return {
        isValid: false,
        error: 'La dirección debe ser más completa'
      }
    }

    return {
      isValid: true,
      value: trimmed
    }
  }

  // =============================================
  // CLASS-SPECIFIC VALIDATION
  // =============================================
  
  static validateClassSingleOrMultiple(input: string): ValidationResult {
    const normalizedInput = input.trim().toLowerCase()
    
    if (['1', 'una', 'unica', 'única', 'sola'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'single'
      }
    } else if (['2', 'varias', 'multiples', 'múltiples'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'multiple'
      }
    }

    return {
      isValid: false,
      error: 'Opción inválida. Responde: 1-Una sola clase, 2-Varias clases'
    }
  }

  static validateClassLevel(input: string): ValidationResult {
    const normalizedInput = input.trim().toLowerCase()
    
    const levelMap: Record<string, ClassLevel | 'skip'> = {
      '1': 'beginner',
      'principiante': 'beginner',
      '2': 'intermediate',
      'intermedio': 'intermediate',
      '3': 'advanced',
      'avanzado': 'advanced',
      '4': 'all_levels',
      'todos': 'all_levels',
      '5': 'skip',
      '.': 'skip'
    }

    if (levelMap[normalizedInput]) {
      return {
        isValid: true,
        value: levelMap[normalizedInput] as string
      }
    }

    return {
      isValid: false,
      error: 'Nivel inválido. Opciones: 1-Principiante, 2-Intermedio, 3-Avanzado, 4-Todos, 5-Omitir'
    }
  }

  static validateClassAddAnother(input: string): ValidationResult {
    const normalizedInput = input.trim().toLowerCase()
    
    if (['1', 'si', 'sí', 'agregar', 'otra'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'yes'
      }
    } else if (['2', 'no', 'continuar'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'no'
      }
    }

    return {
      isValid: false,
      error: 'Opción inválida. Responde: 1-Sí agregar otra, 2-No continuar'
    }
  }

  static validateClassPractice(input: string): ValidationResult {
    const normalizedInput = input.trim().toLowerCase()
    
    if (['1', 'si', 'sí', 'hay'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'yes'
      }
    } else if (['2', 'no'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'no'
      }
    }

    return {
      isValid: false,
      error: 'Opción inválida. Responde: 1-Sí hay práctica, 2-No hay práctica'
    }
  }

  // =============================================
  // MILONGA-SPECIFIC VALIDATION
  // =============================================
  
  static validateMilongaPreClass(input: string): ValidationResult {
    const normalizedInput = input.trim().toLowerCase()
    
    if (['1', 'si', 'sí', 'hay'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'yes'
      }
    } else if (['2', 'no'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'no'
      }
    }

    return {
      isValid: false,
      error: 'Opción inválida. Responde: 1-Sí hay clase previa, 2-No hay clase previa'
    }
  }

  static validateMilongaShow(input: string): ValidationResult {
    const normalizedInput = input.trim().toLowerCase()
    
    if (['1', 'si', 'sí', 'hay'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'yes'
      }
    } else if (['2', 'no'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'no'
      }
    } else if (input.trim() === '.') {
      return {
        isValid: true,
        value: 'skip'
      }
    } else if (input.trim().length > 0 && !['1', '2'].includes(normalizedInput)) {
      // They provided show description
      return {
        isValid: true,
        value: input.trim()
      }
    }

    return {
      isValid: false,
      error: 'Opción inválida. Responde: 1-Sí hay show, 2-No hay show, o describe el show'
    }
  }

  // =============================================
  // ORGANIZER VALIDATION
  // =============================================
  
  static validateOrganizerSelf(input: string): ValidationResult {
    const normalizedInput = input.trim().toLowerCase()
    
    if (['1', 'si', 'sí', 'yo'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'yes'
      }
    } else if (['2', 'no', 'otro'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'no'
      }
    }

    return {
      isValid: false,
      error: 'Opción inválida. Responde: 1-Sí la doy yo, 2-No la da otro'
    }
  }

  static validateOrganizerAdditional(input: string): ValidationResult {
    const normalizedInput = input.trim().toLowerCase()
    
    if (['1', 'si', 'sí', 'agregar'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'yes'
      }
    } else if (['2', 'no', 'continuar'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'no'
      }
    }

    return {
      isValid: false,
      error: 'Opción inválida. Responde: 1-Sí agregar otro, 2-No continuar'
    }
  }

  static validateOrganizerSearch(input: string): ValidationResult {
    const searchTerm = input.trim()

    if (searchTerm.toLowerCase() === 'nuevo') {
      return {
        isValid: true,
        value: 'new'
      }
    }

    if (searchTerm.length < 2) {
      return {
        isValid: false,
        error: 'El nombre debe tener al menos 2 caracteres'
      }
    }

    return {
      isValid: true,
      value: searchTerm
    }
  }

  static validateOrganizerSelect(
    input: string, 
    maxOptions: number
  ): ValidationResult {
    const selection = parseInt(input.trim())

    if (isNaN(selection) || selection < 1 || selection > maxOptions) {
      return {
        isValid: false,
        error: `Número inválido. Elegí una opción del 1 al ${maxOptions}`
      }
    }

    return {
      isValid: true,
      value: selection.toString()
    }
  }

  // =============================================
  // GENERAL EVENT SETTINGS
  // =============================================
  
  static validateEventRecurrence(input: string): ValidationResult {
    const normalizedInput = input.trim().toLowerCase()
    
    if (['1', 'si', 'sí', 'repite', 'semanalmente'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'yes'
      }
    } else if (['2', 'no', 'una vez', 'unica'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'no'
      }
    }

    return {
      isValid: false,
      error: 'Opción inválida. Responde: 1-Sí se repite, 2-No es única'
    }
  }

  static validateEventContact(input: string): ValidationResult {
    const normalizedInput = input.trim().toLowerCase()
    
    if (['1', 'mi numero', 'mi número'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'own'
      }
    } else if (['2', 'otro', 'otro numero', 'otro número'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'other'
      }
    } else if (['3', '.', 'no', 'omitir'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'skip'
      }
    }

    return {
      isValid: false,
      error: 'Opción inválida. Responde: 1-Mi número, 2-Otro número, 3-Omitir'
    }
  }

  static validateEventReminder(input: string): ValidationResult {
    const normalizedInput = input.trim().toLowerCase()
    
    if (['1', 'si', 'sí', 'mi numero', 'mi número'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'own'
      }
    } else if (['2', 'otro', 'otro numero', 'otro número'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'other'
      }
    } else if (['3', '.', 'no', 'sin'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'skip'
      }
    }

    return {
      isValid: false,
      error: 'Opción inválida. Responde: 1-Mi número, 2-Otro número, 3-Sin recordatorios'
    }
  }

  // =============================================
  // PRICING VALIDATION
  // =============================================
  
  static validateEventPricing(input: string): ValidationResult {
    const normalizedInput = input.trim().toLowerCase()
    
    if (['1', 'si', 'sí', 'agregar'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'yes'
      }
    } else if (['2', 'no', 'omitir', '.'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'no'
      }
    }

    return {
      isValid: false,
      error: 'Opción inválida. Responde: 1-Sí agregar precios, 2-No omitir'
    }
  }

  static validatePricingType(input: string): ValidationResult {
    const normalizedInput = input.trim().toLowerCase()
    
    if (['1', 'unico', 'único', 'uno'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'single'
      }
    } else if (['2', 'lista', 'multiples', 'múltiples'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'multiple'
      }
    }

    return {
      isValid: false,
      error: 'Opción inválida. Responde: 1-Un único precio, 2-Lista de precios'
    }
  }

  static validatePricingDetail(input: string): ValidationResult {
    const trimmed = input.trim()
    
    if (trimmed.length < 2) {
      return {
        isValid: false,
        error: 'El detalle debe ser más específico'
      }
    }

    return {
      isValid: true,
      value: trimmed
    }
  }

  static validatePricingAddMore(input: string): ValidationResult {
    const normalizedInput = input.trim().toLowerCase()
    
    if (['1', 'si', 'sí', 'agregar', 'otro'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'yes'
      }
    } else if (['2', 'no', 'continuar'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'no'
      }
    }

    return {
      isValid: false,
      error: 'Opción inválida. Responde: 1-Sí agregar otro, 2-No continuar'
    }
  }

  // =============================================
  // CONFIRMATION VALIDATION
  // =============================================
  
  static validateEventConfirmation(input: string): ValidationResult {
    const normalizedInput = input.trim().toLowerCase()
    
    if (['1', 'si', 'sí', 'confirmo', 'crear'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'confirm'
      }
    } else if (['2', 'no', 'modificar'].includes(normalizedInput)) {
      return {
        isValid: true,
        value: 'modify'
      }
    }

    return {
      isValid: false,
      error: 'Opción inválida. Responde: 1-Sí crear evento, 2-No modificar'
    }
  }

  // =============================================
  // COMPLETE EVENT VALIDATION
  // =============================================
  
  static validateCompleteEvent(eventData: NewEventData): EventCreationError[] {
    const errors: EventCreationError[] = []

    // Required fields validation
    if (!eventData.title) {
      errors.push({
        field: 'title',
        message: 'El título es obligatorio',
        code: 'TITLE_REQUIRED'
      })
    }

    if (!eventData.venue_name) {
      errors.push({
        field: 'venue_name',
        message: 'El nombre del lugar es obligatorio',
        code: 'VENUE_REQUIRED'
      })
    }

    if (!eventData.address) {
      errors.push({
        field: 'address',
        message: 'La dirección es obligatoria',
        code: 'ADDRESS_REQUIRED'
      })
    }

    if (!eventData.date) {
      errors.push({
        field: 'date',
        message: 'La fecha es obligatoria',
        code: 'DATE_REQUIRED'
      })
    }

    if (!eventData.event_type) {
      errors.push({
        field: 'event_type',
        message: 'El tipo de evento es obligatorio',
        code: 'EVENT_TYPE_REQUIRED'
      })
    }

    // Event type specific validation
    if (eventData.event_type === 'class') {
      if (!eventData.classes || eventData.classes.length === 0) {
        errors.push({
          field: 'classes',
          message: 'Las clases son obligatorias para eventos de tipo clase',
          code: 'CLASSES_REQUIRED'
        })
      }
    }

    if (eventData.event_type === 'milonga') {
      if (!eventData.classes || eventData.classes.length === 0) {
        errors.push({
          field: 'classes',
          message: 'La hora de milonga es obligatoria',
          code: 'MILONGA_TIME_REQUIRED'
        })
      }
    }

    // Organizers validation
    if (!eventData.organizers || eventData.organizers.length === 0) {
      errors.push({
        field: 'organizers',
        message: 'Al menos un organizador es obligatorio',
        code: 'ORGANIZERS_REQUIRED'
      })
    }

    return errors
  }
}