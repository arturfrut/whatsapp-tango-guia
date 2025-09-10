
import { EventType, ClassLevel, NewEventData, CompleteEventData } from './types'

export class MessageUtils {
  
  // =============================================
  // MAIN MENU MESSAGES
  // =============================================
  
  static getMainMenuMessage(): string {
    return `Hola! Soy *Mia*! 💃
Sé prácticamente todo lo que hay que saber sobre el tango en Mar del Plata. ¿En qué te puedo ayudar?

1 - Quiero saber las clases o eventos de *hoy*
2 - Quiero saber las clases o eventos de *la semana*
3 - Tengo entre 18 y 35 años y quiero entrar al mundo del tango
4 - Quiero *denunciar algo* o hacer una *recomendación tanguera*`
  }

  static getSpecialMenuMessage(): string {
    return `📋 ¿Qué te gustaría hacer?

1 - Crear *clase*
2 - Crear *milonga*
3 - Crear *seminario*
4 - Crear *evento especial*
5 - Crear *profesor* (otra persona)
6 - Modificar un *evento*

0 - Volver al menú principal`
  }

  static getReturnToMainMenuMessage(): string {
    return `¿Te gustaría saber algo más? 😊

1 - Quiero saber las clases o eventos de *hoy*
2 - Quiero saber las clases o eventos de *la semana*
3 - Tengo entre 18 y 35 años y quiero entrar al mundo del tango
4 - Quiero *denunciar algo* o hacer una *recomendación tanguera*`
  }

  // =============================================
  // ERROR MESSAGES
  // =============================================
  
  static getInvalidOptionMessage(validOptions?: string): string {
    const base = "❓ Opción inválida."
    return validOptions ? `${base} ${validOptions}` : base
  }

  static getValidationErrorMessage(error: string, example?: string): string {
    let message = `❌ ${error}`
    if (example) {
      message += `\n\n*Ejemplo:* ${example}`
    }
    message += `\n\n_Envía "0" para volver_`
    return message
  }

  static getGenericErrorMessage(): string {
    return "😅 Algo salió mal, volvamos a empezar."
  }

  static getBackInstructions(): string {
    return `_Envía "0" para volver o "salir" para cancelar_`
  }

  // =============================================
  // EVENT CREATION MESSAGES
  // =============================================
  
  static getEventTitlePrompt(eventType: EventType): string {
    const typeNames = {
      class: 'clase',
      milonga: 'milonga', 
      seminar: 'seminario',
      special_event: 'evento especial'
    }

    return `📝 *Crear ${typeNames[eventType]}*

¿Cuál es el título?

*Ejemplo:* "Clase de Tango Principiantes" o "Milonga de los Viernes"

${this.getBackInstructions()}`
  }

  static getEventVenuePrompt(title: string): string {
    return `✅ Título: *${title}*

¿Cuál es el nombre del lugar?

*Ejemplo:* "UADE" o "Centro Cultural"

_Envía "0" para volver_`
  }

  static getEventAddressPrompt(venueName: string): string {
    return `✅ Lugar: *${venueName}*

¿Cuál es la dirección completa?

*Ejemplo:* "Magallanes 2025, Mar del Plata"

_Envía "0" para volver_`
  }

  static getEventDatePrompt(address: string): string {
    return `✅ Dirección: *${address}*

¿Qué fecha?

*Formatos:*
• 15/12/2024
• 15-12-2024  
• 15 de diciembre
• mañana
• hoy

_Envía "0" para volver_`
  }

  static getClassSingleOrMultiplePrompt(date: string): string {
    return `✅ Fecha: *${date}*

¿Es clase única o hay varias clases?

1 - Una sola clase
2 - Varias clases

_Envía "0" para volver_`
  }

  static getClassTimePrompt(isFirst: boolean = true): string {
    const prompt = isFirst ? "¿A qué hora es la clase?" : "¿A qué hora es la primera clase?"
    return `${prompt}

*Formato:* 20:30

_Envía "0" para volver_`
  }

  static getClassLevelPrompt(time: string, classNumber?: number): string {
    const classLabel = classNumber ? ` ${classNumber}` : ''
    
    return `✅ Hora clase${classLabel}: *${time}*

¿Cuál es el nivel?

1 - Principiante
2 - Intermedio  
3 - Avanzado
4 - Todos los niveles
5 - . (omitir nivel)

_Envía "0" para volver_`
  }

  static getClassAddAnotherPrompt(): string {
    return `¿Hay otra clase?

1 - Sí, agregar otra clase
2 - No, continuar

_Envía "0" para volver_`
  }

  static getClassPracticePrompt(): string {
    return `¿Hay práctica después de las clases?

1 - Sí, hay práctica
2 - No hay práctica

_Envía "0" para volver_`
  }

  static getClassPracticeTimePrompt(): string {
    return `¿A qué hora es la práctica?

*Formato:* 23:00

_Envía "0" para volver_`
  }

  // =============================================
  // MILONGA MESSAGES
  // =============================================
  
  static getMilongaTimePrompt(date: string): string {
    return `✅ Fecha: *${date}*

¿A qué hora empieza la milonga?

*Formato:* 20:30

_Envía "0" para volver_`
  }

  static getMilongaPreClassPrompt(time: string): string {
    return `✅ Hora milonga: *${time}*

¿Hay clase previa antes de la milonga?

1 - Sí, hay clase previa
2 - No hay clase previa

_Envía "0" para volver_`
  }

  static getMilongaPreClassTimePrompt(): string {
    return `¿A qué hora es la clase previa?

*Formato:* 19:30

_Envía "0" para volver_`
  }

  static getMilongaShowPrompt(preClassTime?: string): string {
    let message = ""
    if (preClassTime) {
      message += `✅ Clase previa: *${preClassTime}*\n\n`
    }
    
    message += `¿Hay show en la milonga?

1 - Sí, hay show
2 - No hay show

_Envía "0" para volver_`
    
    return message
  }

  static getMilongaShowDetailsPrompt(): string {
    return `¿Quién baila en el show?

*Ejemplo:* "Juan y Belén"

Escribe "." para omitir

_Envía "0" para volver_`
  }

  // =============================================
  // ORGANIZER MESSAGES  
  // =============================================
  
  static getOrganizerSelfPrompt(eventType: EventType): string {
    const eventName = eventType === 'class' ? 'clase' : 'seminario'
    
    return `👨‍🏫 ¿Vas a dar esta ${eventName} vos?

1 - Sí, la doy yo
2 - No, la da otro profesor

_Envía "0" para volver_`
  }

  static getOrganizerSearchPrompt(eventType: EventType): string {
    const organizerType = eventType === 'class' || eventType === 'seminar' ? 'profesor' : 'organizador'
    
    return `👥 ¿Quién es el ${organizerType}?

Escribí el nombre del ${organizerType} para buscar o:
• "nuevo" - Para agregar un ${organizerType} de una sola vez

_Envía "0" para volver_`
  }

  static getOrganizerAdditionalPrompt(organizerName: string): string {
    return `✅ Agregado: *${organizerName}*

¿La das con alguien más?

1 - Sí, agregar otro profesor
2 - No, continuar

_Envía "0" para volver_`
  }

  static getOrganizerSelectPrompt(teachers: Array<{name: string}>, searchTerm: string): string {
    let message = `🔍 Profesores encontrados:\n\n`
    
    teachers.forEach((teacher, index) => {
      message += `${index + 1} - *${teacher.name}*\n`
    })
    
    message += `\n${teachers.length + 1} - Es otra persona (profesor de una vez)\n`
    message += `\n¿Cuál elegís?\n\n_Envía "0" para volver_`
    
    return message
  }

  static getOrganizerOneTimePrompt(): string {
    return `¿Cuál es el nombre del profesor?

*Ejemplo:* "Juan Pérez"

_Envía "0" para volver_`
  }

  // =============================================
  // CONFIRMATION MESSAGES
  // =============================================
  
  static getEventConfirmation(eventData: NewEventData): string {
    const eventTypeNames = {
      class: 'Clase',
      milonga: 'Milonga', 
      seminar: 'Seminario',
      special_event: 'Evento Especial'
    }

    const levelNames = {
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      all_levels: 'Todos los niveles'
    }

    let message = `📋 *CONFIRMACIÓN DEL EVENTO*\n\n`
    message += `🎭 *Tipo:* ${eventTypeNames[eventData.event_type!]}\n`
    message += `📝 *Título:* ${eventData.title}\n`
    message += `🏢 *Lugar:* ${eventData.venue_name}\n`
    message += `📍 *Dirección:* ${eventData.address}\n`
    message += `📅 *Fecha:* ${eventData.date}\n`

    if (eventData.classes && eventData.classes.length > 0) {
      eventData.classes.forEach((cls, index) => {
        const classNum = eventData.classes!.length > 1 ? ` ${index + 1}` : ''
        message += `🕐 *Clase${classNum}:* ${cls.start_time}`
        if (cls.class_level) {
          message += ` (${levelNames[cls.class_level]})`
        }
        message += `\n`
      })
    }

    if (eventData.organizers && eventData.organizers.length > 0) {
      const organizerNames = eventData.organizers.map(org => {
        return org.one_time_teacher_name || 'Profesor registrado'
      })
      message += `👥 *Profesores:* ${organizerNames.join(', ')}\n`
    }

    if (eventData.pricing && eventData.pricing.length > 0) {
      message += `💰 *Precios:*\n`
      eventData.pricing.forEach(price => {
        message += `   • ${price.description}: ${
          price.price === 0 ? 'Gratuito' : `${price.price}`
        }\n`
      })
    }

    message += `\n¿Confirmas que todos los datos están correctos?\n`
    message += `1 - ✅ Sí, crear el evento\n`
    message += `2 - ❌ No, quiero modificar algo\n\n`
    message += `_Envía "0" para volver o "salir" para cancelar_`

    return message
  }

  static getEventSuccessMessage(eventData: NewEventData): string {
    const eventTypeName = {
      class: 'clase',
      milonga: 'milonga', 
      seminar: 'seminario',
      special_event: 'evento especial'
    }[eventData.event_type!]

    let message = `🎉 ¡Excelente! Tu ${eventTypeName} *"${eventData.title}"* ha sido creada exitosamente.\n\n`

    if (eventData.has_weekly_recurrence) {
      message += `🔔 Recordatorio: Mensualmente te llegará una notificación para confirmar si seguís organizando esta actividad.\n\n`
    }

    message += `📋 ¿Te gustaría crear otra actividad?\n\n`
    message += `1 - Crear *clase*\n`
    message += `2 - Crear *milonga*\n`
    message += `3 - Crear *seminario*\n`
    message += `4 - Crear *evento especial*\n`
    message += `5 - Modificar un *evento*`

    return message
  }

  // =============================================
  // TEACHER CREATION MESSAGES
  // =============================================
  
  static getTeacherNamePrompt(): string {
    return `👨‍🏫 ¡Perfecto! Vamos a crear tu perfil de profesor.

¿Cuál es tu nombre completo?
*Ejemplo:* María González`
  }

  static getTeacherDetailsPrompt(name: string): string {
    return `✅ Nombre registrado: *${name}*

Ahora cuéntame un poco sobre ti. Esta información será visible para los alumnos interesados en tus clases.

*Ejemplo:* "Soy profesor de tango desde hace 10 años, especializado en técnica y musicalidad. Doy clases en el centro de Mar del Plata."`
  }

  static getTeacherConfirmation(name: string, details: string): string {
    return `📋 *CONFIRMACIÓN DE DATOS DE PROFESOR*

👤 *Nombre:* ${name}
📝 *Descripción:* ${details}

¿Confirmas que todos los datos están correctos?
1 - ✅ Sí, crear mi perfil
2 - ❌ No, quiero modificar algo`
  }

  static getTeacherSuccessMessage(name: string): string {
    return `🎉 ¡Felicitaciones ${name}! 

Tu perfil de profesor ha sido creado exitosamente.

${this.getSpecialMenuMessage()}`
  }

  // =============================================
  // EVENT DISPLAY MESSAGES
  // =============================================
  
  static getEventDetails(event: CompleteEventData): string {
    const eventTypeLabels: Record<string, string> = {
      class: 'Clase',
      milonga: 'Milonga',
      seminar: 'Seminario', 
      special_event: 'Evento Especial'
    }

    const levelLabels: Record<string, string> = {
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      all_levels: 'Todos los niveles'
    }

    const primaryOrganizer = event.organizers?.find(org => org.is_primary)
    const organizerName = primaryOrganizer?.one_time_teacher_name || 
                         primaryOrganizer?.user?.name || 
                         'Por confirmar'

    let message = `🎭 *${event.title}*\n\n`

    if (event.description) {
      message += `📝 *Descripción:*\n${event.description}\n\n`
    }

    message += `🎪 *Tipo:* ${eventTypeLabels[event.event_type] || event.event_type}\n`
    message += `🏢 *Lugar:* ${event.venue_name}\n`

    if (event.classes && event.classes.length > 0) {
      if (event.classes.length === 1) {
        message += `🕒 *Horario:* ${event.classes[0].start_time}\n`
        if (event.classes[0].class_level) {
          message += `📊 *Nivel:* ${levelLabels[event.classes[0].class_level]}\n`
        }
      } else {
        message += `🕒 *Horarios:*\n`
        event.classes.forEach((cls, index) => {
          message += `   Clase ${index + 1}: ${cls.start_time}`
          if (cls.class_level) {
            message += ` (${levelLabels[cls.class_level]})`
          }
          message += `\n`
        })
      }
    }

    if (event.practice) {
      message += `💃 *Práctica:* ${event.practice.practice_time}\n`
    }

    if (event.milonga_pre_class) {
      message += `📚 *Clase previa:* ${event.milonga_pre_class.class_time}\n`
      message += `🎵 *Milonga:* ${event.milonga_pre_class.milonga_start_time}\n`
    }

    if (event.show_description) {
      message += `🎭 *Show:* ${event.show_description}\n`
    }

    if (event.pricing && event.pricing.length > 0) {
      if (event.pricing.length === 1) {
        const price = event.pricing[0]
        message += `💰 *Precio:* ${price.price === 0 ? 'Gratuito' : `$${price.price}`}\n`
      } else {
        message += `💰 *Precios:*\n`
        event.pricing.forEach(price => {
          message += `   ${price.description}: ${
            price.price === 0 ? 'Gratuito' : `$${price.price}`
          }\n`
        })
      }
    } else {
      message += `💰 *Precio:* Consultar\n`
    }

    message += `👤 *Profesor/Organizador:* ${organizerName}\n`

    if (event.has_weekly_recurrence) {
      message += `🔄 *Se repite:* Semanalmente\n`
    }

    message += `📍 *Dirección:* ${event.address}\n`

    if (event.contact_phone) {
      message += `📞 *Contacto:* ${event.contact_phone}\n`
    }

    return message
  }

  static getNoEventsMessage(timeframe: 'today' | 'week'): string {
    const period = timeframe === 'today' ? 'hoy' : 'esta semana'
    return `🙁 No hay actividades programadas para ${period}.`
  }

  static getEventsListHeader(timeframe: 'today' | 'week'): string {
    return timeframe === 'today' 
      ? `🎉 Estas son las actividades de *hoy*:\n\n`
      : `🗓️ Estas son las actividades de *la semana*:\n\n`
  }

  // =============================================
  // PRICING MESSAGES
  // =============================================
  
  static getPricingPrompt(): string {
    return `💰 *Precios* *(opcional)*

¿Quieres agregar información de precios?

1 - Sí, agregar precios
2 - No, omitir precios

_Envía "0" para volver_`
  }

  static getPricingTypePrompt(): string {
    return `💰 ¿Quieres poner un único precio o una lista de precios?

1 - Un único precio
2 - Lista de precios (recomendado)

_Envía "0" para volver_`
  }

  static getPricingDetailPrompt(priceNumber?: number): string {
    const number = priceNumber ? ` ${priceNumber}` : ''
    
    return `💰 *Precio${number}*

¿Cuál es el detalle del precio?

*Ejemplos:*
• "Solo clase principiante"
• "Clase + práctica"
• "Entrada general"

_Envía "0" para volver_`
  }

  static getPricingAmountPrompt(detail: string): string {
    return `✅ Detalle: *${detail}*

¿Cuál es el precio?

*Formato:* Solo el número
*Ejemplo:* 5000

Escribe "gratis" para precio gratuito

_Envía "0" para volver_`
  }
}