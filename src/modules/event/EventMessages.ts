import { 
  EventType, 
  NewEventData, 
  TeacherSearchResult,
  EVENT_TYPE_NAMES,
  CLASS_LEVEL_NAMES
} from './types'

export class EventMessages {
  
  // =============================================
  // EVENT TYPE SELECTION
  // =============================================
  
  static getEventTypePrompt(): string {
    return `📋 ¿Qué te gustaría hacer?

1 - Crear *clase*
2 - Crear *milonga*
3 - Crear *seminario*
4 - Crear *evento especial*
5 - Crear *profesor* (otra persona)
6 - Modificar un *evento*

0 - Volver al menú principal`
  }

  // =============================================
  // BASIC EVENT INFO
  // =============================================
  
  static getTitlePrompt(eventType: EventType): string {
    return `📝 *Crear ${EVENT_TYPE_NAMES[eventType]}*

¿Cuál es el título?

*Ejemplo:* "Clase de Tango Principiantes" o "Milonga de los Viernes"

_Envía "0" para volver o "salir" para cancelar_`
  }

  static getVenuePrompt(title: string): string {
    return `✅ Título: *${title}*

¿Cuál es el nombre del lugar?

*Ejemplo:* "UADE" o "Centro Cultural"

_Envía "0" para volver_`
  }

  static getAddressPrompt(venueName: string): string {
    return `✅ Lugar: *${venueName}*

¿Cuál es la dirección completa?

*Ejemplo:* "Magallanes 2025, Mar del Plata"

_Envía "0" para volver_`
  }

  static getDatePrompt(address: string): string {
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

  // =============================================
  // CLASS-SPECIFIC MESSAGES
  // =============================================
  
  static getClassSingleOrMultiplePrompt(date: string): string {
    return `✅ Fecha: *${date}*

¿Es clase única o hay varias clases?

1 - Una sola clase
2 - Varias clases

_Envía "0" para volver_`
  }

  static getClassTimePrompt(isFirstClass: boolean, classNumber?: number): string {
    let prompt: string
    
    if (isFirstClass && !classNumber) {
      prompt = "¿A qué hora es la clase?"
    } else if (classNumber) {
      prompt = `¿A qué hora es la clase ${classNumber}?`
    } else {
      prompt = "¿A qué hora es la primera clase?"
    }

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
  // MILONGA-SPECIFIC MESSAGES
  // =============================================
  
  static getMilongaTimePrompt(date: string): string {
    return `✅ Fecha: *${date}*

¿A qué hora empieza la milonga?

*Formato:* 20:30

_Envía "0" para volver_`
  }

  static getMilongaPreClassPrompt(milongaTime: string): string {
    return `✅ Hora milonga: *${milongaTime}*

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
  // SPECIAL EVENT MESSAGES
  // =============================================
  
  static getSpecialEventTimePrompt(date: string): string {
    return `✅ Fecha: *${date}*

¿A qué hora?

*Formato:* 20:30

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
    const organizerType = (eventType === 'class' || eventType === 'seminar') ? 'profesor' : 'organizador'
    
    return `👥 ¿Quién es el ${organizerType}?

Escribí el nombre del ${organizerType} para buscar o:
• "nuevo" - Para agregar un ${organizerType} de una sola vez

_Envía "0" para volver_`
  }

  static getOrganizerSelfAddedPrompt(organizerName: string): string {
    return `✅ Agregado: *${organizerName}*

¿La das con alguien más?

1 - Sí, agregar otro profesor
2 - No, continuar

_Envía "0" para volver_`
  }

  static getOrganizerAdditionalPrompt(): string {
    return `¿Hay otro profesor más?

1 - Sí, agregar otro
2 - No, continuar

_Envía "0" para volver_`
  }

  static getOrganizerSearchResultsPrompt(teachers: TeacherSearchResult[]): string {
    let message = `🔍 Profesores encontrados:\n\n`
    
    teachers.forEach((teacher, index) => {
      message += `${index + 1} - *${teacher.name}*\n`
    })
    
    message += `\n${teachers.length + 1} - Es otra persona (profesor de una vez)\n`
    message += `\n¿Cuál elegís?\n\n_Envía "0" para volver_`
    
    return message
  }

  static getOrganizerNotFoundPrompt(): string {
    return `❌ No se encontraron profesores con ese nombre.

¿Es un profesor de una sola vez?
Escribí el nombre completo:

*Ejemplo:* "Juan Pérez"

_Envía "0" para volver_`
  }

  static getOrganizerOneTimePrompt(): string {
    return `¿Cuál es el nombre completo del profesor?

*Ejemplo:* "Juan Pérez"

_Envía "0" para volver_`
  }

  static getOrganizerAddedPrompt(organizerName: string): string {
    return `✅ Agregado: *${organizerName}*

¿Hay otro profesor más?

1 - Sí, agregar otro
2 - No, continuar

_Envía "0" para volver_`
  }

  // =============================================
  // EVENT SETTINGS MESSAGES
  // =============================================
  
  static getRecurrencePrompt(eventType: EventType): string {
    const eventTypeName = EVENT_TYPE_NAMES[eventType]
    
    return `🔄 ¿Esta ${eventTypeName} se repite todas las semanas?

*Recordá que mensualmente te llegará un recordatorio para confirmar si seguís organizando.*

1 - Sí, se repite semanalmente
2 - No, es solo esta vez

_Envía "0" para volver_`
  }

  static getContactPrompt(phoneNumber: string): string {
    return `📞 ¿Agregar número de contacto?

1 - Usar mi número (${phoneNumber})
2 - Usar otro número
3 - . (no agregar contacto)

_Envía "0" para volver_`
  }

  static getContactNumberPrompt(): string {
    return `📞 ¿Cuál es el número de contacto?

*Ejemplo:* 2234567890

_Envía "0" para volver_`
  }

  static getReminderPrompt(phoneNumber: string): string {
    return `🔔 ¿Usar este número para recordatorios?

1 - Sí, usar mi número (${phoneNumber})
2 - Usar otro número
3 - . (sin recordatorios)

_Envía "0" para volver_`
  }

  static getReminderNumberPrompt(): string {
    return `🔔 ¿Cuál es el número para recordatorios?

*Ejemplo:* 2234567890

_Envía "0" para volver_`
  }

  static getDescriptionPrompt(): string {
    return `💬 Descripción del evento *(opcional)*

Incluye detalles importantes para los participantes.

*Ejemplo:* "Clase enfocada en técnica básica y musicalidad."

Escribe "." para omitir

_Envía "0" para volver_`
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

  static getPricingAddMorePrompt(currentPrices: Array<{description: string, price: number}>): string {
    let message = ''
    
    if (currentPrices.length > 0) {
      message += '\n*Precios agregados:*\n'
      currentPrices.forEach((p, index) => {
        message += `${index + 1}. ${p.description}: ${p.price === 0 ? 'Gratuito' : `$${p.price}`}\n`
      })
    }

    message += `
¿Deseas agregar otro precio?

1 - Sí, agregar otro precio
2 - No, continuar con el evento

_Envía "0" para volver_`

    return message
  }

  // =============================================
  // CONFIRMATION MESSAGES
  // =============================================
  
  static getEventConfirmation(eventData: NewEventData): string {
    let message = `📋 *CONFIRMACIÓN DEL EVENTO*\n\n`
    message += `🎭 *Tipo:* ${EVENT_TYPE_NAMES[eventData.event_type!]}\n`
    message += `📝 *Título:* ${eventData.title}\n`
    message += `🏢 *Lugar:* ${eventData.venue_name}\n`
    message += `📍 *Dirección:* ${eventData.address}\n`
    message += `📅 *Fecha:* ${eventData.date}\n`

    // Classes information
    if (eventData.classes && eventData.classes.length > 0) {
      eventData.classes.forEach((cls, index) => {
        const classNum = eventData.classes!.length > 1 ? ` ${index + 1}` : ''
        message += `🕐 *Clase${classNum}:* ${cls.start_time}`
        if (cls.class_level) {
          message += ` (${CLASS_LEVEL_NAMES[cls.class_level]})`
        }
        message += `\n`
      })
    }

    // Practice information
    if (eventData.practice) {
      message += `💃 *Práctica:* ${eventData.practice.practice_time}\n`
    }

    // Milonga pre-class information
    if (eventData.pre_class) {
      message += `📚 *Clase previa:* ${eventData.pre_class.class_time}\n`
      message += `🎵 *Milonga:* ${eventData.pre_class.milonga_start_time}\n`
    }

    // Show information
    if (eventData.show_description) {
      message += `🎭 *Show:* ${eventData.show_description}\n`
    }

    // Organizers information
    if (eventData.organizers && eventData.organizers.length > 0) {
      const organizerNames = eventData.organizers.map(org => {
        return org.one_time_teacher_name || 'Profesor registrado'
      })
      message += `👥 *Profesores:* ${organizerNames.join(', ')}\n`
    }

    // Pricing information
    if (eventData.pricing && eventData.pricing.length > 0) {
      message += `💰 *Precios:*\n`
      eventData.pricing.forEach(price => {
        message += `   • ${price.description}: ${
          price.price === 0 ? 'Gratuito' : `$${price.price}`
        }\n`
      })
    }

    // Recurrence information
    if (eventData.has_weekly_recurrence) {
      message += `🔄 *Se repite:* Semanalmente\n`
    }

    // Contact information
    if (eventData.contact_phone) {
      message += `📞 *Contacto:* ${eventData.contact_phone}\n`
    }

    // Description
    if (eventData.description) {
      message += `📝 *Descripción:* ${eventData.description}\n`
    }

    message += `\n¿Confirmas que todos los datos están correctos?\n`
    message += `1 - ✅ Sí, crear el evento\n`
    message += `2 - ❌ No, quiero modificar algo\n\n`
    message += `_Envía "0" para volver o "salir" para cancelar_`

    return message
  }

  static getEventSuccessMessage(eventData: NewEventData): string {
    const eventTypeName = EVENT_TYPE_NAMES[eventData.event_type!]

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

  static getEventCreationErrorMessage(): string {
    return `❌ Ocurrió un error al crear tu evento.

Por favor intenta nuevamente más tarde.`
  }

  static getEventCancellationMessage(): string {
    return `❌ Creación de evento cancelada.

¿Necesitas algo más?`
  }

  static getEventModifyMessage(): string {
    return `🔄 Perfecto, empecemos de nuevo.

¿Cuál es el título del evento?

_Envía "0" para volver o "salir" para cancelar_`
  }

  // =============================================
  // ERROR MESSAGES
  // =============================================
  
  static getInvalidOptionMessage(validOptions: string): string {
    return `❓ Opción inválida. ${validOptions}

_Envía "0" para volver_`
  }

  static getValidationErrorMessage(error: string, example?: string): string {
    let message = `❌ ${error}`
    if (example) {
      message += `\n\n*Ejemplo:* ${example}`
    }
    message += `\n\n_Envía "0" para volver_`
    return message
  }

  // =============================================
  // DEVELOPMENT MESSAGES
  // =============================================
  
  static getSeminarInDevelopmentMessage(): string {
    return `🚧 Los seminarios están en desarrollo...

_Envía "0" para volver_`
  }

  static getModifyEventInDevelopmentMessage(): string {
    return `🛠️ Modificar evento (en desarrollo)...`
  }
}