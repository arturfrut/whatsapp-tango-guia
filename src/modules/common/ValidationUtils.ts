import { 
  ValidationResult, 
  DateValidationOptions, 
  TimeValidationOptions, 
  PhoneValidationOptions 
} from './types'

export class ValidationUtils {
  
  static validateDate(
    input: string, 
    options: DateValidationOptions = {}
  ): ValidationResult {
    const {
      allowRelativeDates = true,
      minYear = 2024,
      maxYear = 2030
    } = options
    
    try {
      const normalizedInput = input.toLowerCase().trim()
      const today = new Date()

      if (allowRelativeDates) {
        if (normalizedInput === 'hoy') {
          return {
            isValid: true,
            value: this.formatDate(today)
          }
        }

        if (normalizedInput === 'mañana') {
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          return {
            isValid: true,
            value: this.formatDate(tomorrow)
          }
        }
      }

      const dateRegex1 = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/
      const match1 = normalizedInput.match(dateRegex1)
      if (match1) {
        const day = parseInt(match1[1], 10)
        const month = parseInt(match1[2], 10)
        const year = parseInt(match1[3], 10)

        if (this.isValidDateComponents(day, month, year, minYear, maxYear)) {
          return {
            isValid: true,
            value: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
          }
        }
      }

      const monthNames: Record<string, number> = {
        enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
        julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12
      }

      const dateRegex2 = /^(\d{1,2})\s+de\s+(\w+)$/
      const match2 = normalizedInput.match(dateRegex2)
      if (match2) {
        const day = parseInt(match2[1], 10)
        const monthName = match2[2].toLowerCase()
        const month = monthNames[monthName]

        if (month && this.isValidDateComponents(day, month, today.getFullYear(), minYear, maxYear)) {
          return {
            isValid: true,
            value: `${today.getFullYear()}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
          }
        }
      }

      return {
        isValid: false,
        error: 'Formato de fecha inválido. Use: DD/MM/YYYY, DD-MM-YYYY, DD de mes, hoy, o mañana'
      }

    } catch (error) {
      return {
        isValid: false,
        error: 'Error procesando la fecha'
      }
    }
  }
  
  static validateTime(
    input: string, 
    options: TimeValidationOptions = {}
  ): ValidationResult {
    const {
      format24Hour = true,
      allowAMPM = true,
      allowSpecialFormats = true
    } = options
    
    try {
      const normalizedInput = input.toLowerCase().trim()

      if (format24Hour) {
        const timeRegex1 = /^(\d{1,2}):(\d{2})$/
        const match1 = normalizedInput.match(timeRegex1)
        if (match1) {
          const hour = parseInt(match1[1], 10)
          const minute = parseInt(match1[2], 10)

          if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
            return {
              isValid: true,
              value: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
            }
          }
        }

        const timeRegex2 = /^(\d{1,2})\.(\d{2})$/
        const match2 = normalizedInput.match(timeRegex2)
        if (match2) {
          const hour = parseInt(match2[1], 10)
          const minute = parseInt(match2[2], 10)

          if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
            return {
              isValid: true,
              value: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
            }
          }
        }
      }

      if (allowAMPM) {
        const timeRegex3 = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/
        const match3 = normalizedInput.match(timeRegex3)
        if (match3) {
          let hour = parseInt(match3[1], 10)
          const minute = parseInt(match3[2] || '0', 10)
          const ampm = match3[3]

          if (ampm === 'pm' && hour !== 12) {
            hour += 12
          } else if (ampm === 'am' && hour === 12) {
            hour = 0
          }

          if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
            return {
              isValid: true,
              value: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
            }
          }
        }
      }

      if (allowSpecialFormats) {
        const specialCases: Record<string, string> = {
          '8 y media': '20:30',
          '9 y media': '21:30',
          '7 y media': '19:30',
          '8 y cuarto': '20:15',
          '9 y cuarto': '21:15'
        }

        if (specialCases[normalizedInput]) {
          return {
            isValid: true,
            value: specialCases[normalizedInput]
          }
        }
      }

      return {
        isValid: false,
        error: 'Formato de hora inválido. Use: HH:MM, HH.MM, HH:MM AM/PM'
      }

    } catch (error) {
      return {
        isValid: false,
        error: 'Error procesando la hora'
      }
    }
  }

  static validatePhone(
    input: string, 
    options: PhoneValidationOptions = {}
  ): ValidationResult {
    const {
      countryCode = '+549',
      minLength = 8,
      maxLength = 15,
      mustStartWith = '2'
    } = options
    
    try {
      const cleaned = input.trim().replace(/\D/g, '') // Remove non-digits
      
      if (cleaned.length < minLength || cleaned.length > maxLength) {
        return {
          isValid: false,
          error: `El número debe tener entre ${minLength} y ${maxLength} dígitos`
        }
      }

      if (mustStartWith && !cleaned.startsWith(mustStartWith)) {
        return {
          isValid: false,
          error: `El número debe comenzar con ${mustStartWith}`
        }
      }

      return {
        isValid: true,
        value: cleaned
      }

    } catch (error) {
      return {
        isValid: false,
        error: 'Error procesando el número de teléfono'
      }
    }
  }

  static validateName(input: string, minLength: number = 2): ValidationResult {
    const trimmed = input.trim()
    
    if (trimmed.length < minLength) {
      return {
        isValid: false,
        error: `El nombre debe tener al menos ${minLength} caracteres`
      }
    }

    return {
      isValid: true,
      value: trimmed
    }
  }

  static validateDescription(input: string, minLength: number = 10): ValidationResult {
    const trimmed = input.trim()
    
    if (trimmed.length < minLength) {
      return {
        isValid: false,
        error: `La descripción debe tener al menos ${minLength} caracteres`
      }
    }

    return {
      isValid: true,
      value: trimmed
    }
  }

  static validatePrice(input: string): ValidationResult {
    const normalizedMessage = input.trim().toLowerCase()

    if (['gratis', 'gratuito', 'free', '0'].includes(normalizedMessage)) {
      return {
        isValid: true,
        value: '0'
      }
    }

    const parsedPrice = parseFloat(normalizedMessage.replace(/[^\d.]/g, ''))
    
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return {
        isValid: false,
        error: 'Precio inválido. Use solo números o "gratis"'
      }
    }

    return {
      isValid: true,
      value: parsedPrice.toString()
    }
  }

  
  private static isValidDateComponents(
    day: number, 
    month: number, 
    year: number, 
    minYear: number, 
    maxYear: number
  ): boolean {
    if (month < 1 || month > 12) return false
    if (day < 1 || day > 31) return false
    if (year < minYear || year > maxYear) return false

    const date = new Date(year, month - 1, day)
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    )
  }

  private static formatDate(date: Date): string {
    return `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
  }
}