export function parseDate(dateInput: string): string | null {
  try {
    const normalizedInput = dateInput.toLowerCase().trim()
    const today = new Date()

    if (normalizedInput === 'hoy') {
      return formatDate(today)
    }

    if (normalizedInput === 'mañana') {
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return formatDate(tomorrow)
    }

    const dateRegex1 = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/
    const match1 = normalizedInput.match(dateRegex1)
    if (match1) {
      const day = parseInt(match1[1], 10)
      const month = parseInt(match1[2], 10)
      const year = parseInt(match1[3], 10)

      if (isValidDate(day, month, year)) {
        return `${year}-${month.toString().padStart(2, '0')}-${day
          .toString()
          .padStart(2, '0')}`
      }
    }

    const monthNames: Record<string, number> = {
      enero: 1,
      febrero: 2,
      marzo: 3,
      abril: 4,
      mayo: 5,
      junio: 6,
      julio: 7,
      agosto: 8,
      septiembre: 9,
      octubre: 10,
      noviembre: 11,
      diciembre: 12
    }

    const dateRegex2 = /^(\d{1,2})\s+de\s+(\w+)$/
    const match2 = normalizedInput.match(dateRegex2)
    if (match2) {
      const day = parseInt(match2[1], 10)
      const monthName = match2[2].toLowerCase()
      const month = monthNames[monthName]

      if (month && isValidDate(day, month, today.getFullYear())) {
        return `${today.getFullYear()}-${month
          .toString()
          .padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      }
    }

    return null
  } catch (error) {
    console.error('Error parsing date:', error)
    return null
  }
}

export function parseTime(timeInput: string): string | null {
  try {
    const normalizedInput = timeInput.toLowerCase().trim()

    const timeRegex1 = /^(\d{1,2}):(\d{2})$/
    const match1 = normalizedInput.match(timeRegex1)
    if (match1) {
      const hour = parseInt(match1[1], 10)
      const minute = parseInt(match1[2], 10)

      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        return `${hour.toString().padStart(2, '0')}:${minute
          .toString()
          .padStart(2, '0')}`
      }
    }

    const timeRegex2 = /^(\d{1,2})\.(\d{2})$/
    const match2 = normalizedInput.match(timeRegex2)
    if (match2) {
      const hour = parseInt(match2[1], 10)
      const minute = parseInt(match2[2], 10)

      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        return `${hour.toString().padStart(2, '0')}:${minute
          .toString()
          .padStart(2, '0')}`
      }
    }

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
        return `${hour.toString().padStart(2, '0')}:${minute
          .toString()
          .padStart(2, '0')}`
      }
    }

    const specialCases: Record<string, string> = {
      '8 y media': '20:30',
      '9 y media': '21:30',
      '7 y media': '19:30',
      '8 y cuarto': '20:15',
      '9 y cuarto': '21:15'
    }

    if (specialCases[normalizedInput]) {
      return specialCases[normalizedInput]
    }

    return null
  } catch (error) {
    console.error('Error parsing time:', error)
    return null
  }
}

function isValidDate(day: number, month: number, year: number): boolean {
  try {
    if (month < 1 || month > 12) return false
    if (day < 1 || day > 31) return false
    if (year < 2024 || year > 2030) return false

    const date = new Date(year, month - 1, day)
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    )
  } catch (error) {
    console.error('Error validating date:', error)
    return false
  }
}

function formatDate(date: Date): string {
  try {
    return `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
  } catch (error) {
    console.error('Error formatting date:', error)
    return ''
  }
}

export function returnToMainMenu(): string {
  return `¿Te gustaría saber algo más? 😊

1 - Quiero saber las clases o eventos de *hoy*
2 - Quiero saber las clases o eventos de *la semana*
3 - Tengo entre 18 y 35 años y quiero entrar al mundo tanguero
4 - Quiero *denunciar algo* o hacer una *recomendación tanguera*`
}

export function getMainMenuMessage(): string {
  return `Hola! Soy *Mia*! 💃
Sé prácticamente todo lo que hay que saber sobre el tango en Mar del Plata. ¿En qué te puedo ayudar?

1 - Quiero saber las clases o eventos de *hoy*
2 - Quiero saber las clases o eventos de *la semana*
3 - Tengo entre 18 y 35 años y quiero entrar al mundo tanguero
4 - Quiero *denunciar algo* o hacer una *recomendación tanguera*`
}