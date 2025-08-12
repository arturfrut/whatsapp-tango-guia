import { WhatsAppService } from '../../services/whatsapp'

enum ChatState {
  START = 'START',
  MAIN_MENU = 'MAIN_MENU',
  MENU_TODAY = 'MENU_TODAY',
  MENU_WEEK = 'MENU_WEEK',
  MENU_18_35 = 'MENU_18_35',
  MENU_REPORT = 'MENU_REPORT',
  SECRET_CODE = 'SECRET_CODE',
  NEW_TEACHER = 'NEW_TEACHER',
  SPECIAL_MENU = 'SPECIAL_MENU',
  SPECIAL_CREATE = 'SPECIAL_CREATE'
}

const userStates = new Map<string, ChatState>()

export async function handleConversation(
  phoneNumber: string,
  messageContent: string
) {
  const normalizedMessage = messageContent.trim().toLowerCase()
  const currentState = userStates.get(phoneNumber) || ChatState.START

  // --- SECRET CODE ---
  if (normalizedMessage === 'tantotango2025') {
    userStates.set(phoneNumber, ChatState.SECRET_CODE)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `🔐 ¡Accediste al menú secreto!

¿Eres un nuevo profesor?
1 - Sí
2 - No`
    )
  }

  switch (currentState) {
    case ChatState.START:
      userStates.set(phoneNumber, ChatState.MAIN_MENU)
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `Hola! Soy *Mia*! 💃
Sé prácticamente todo lo que hay que saber sobre el tango en Mar del Plata. ¿En qué te puedo ayudar?

1 - Quiero saber las clases o eventos de *hoy*
2 - Quiero saber las clases o eventos de *la semana*
3 - Tengo entre 18 y 35 años y quiero entrar al mundo tanguero
4 - Quiero *denunciar algo* o hacer una *recomendación tanguera*`
      )

    case ChatState.MAIN_MENU:
      if (['1', 'hoy'].includes(normalizedMessage)) {
        userStates.set(phoneNumber, ChatState.MENU_TODAY)
        return WhatsAppService.sendTextMessage(
          phoneNumber,
          `🎉 Estas son las actividades de *hoy*:\n\n📍 MOCK MOCK`
        )
      } else if (['2', 'semana'].includes(normalizedMessage)) {
        userStates.set(phoneNumber, ChatState.MENU_WEEK)
        return WhatsAppService.sendTextMessage(
          phoneNumber,
          `🗓️ Estas son las actividades de *la semana*:\n\n📍 MOCK MOCK`
        )
      } else if (['3'].includes(normalizedMessage)) {
        userStates.set(phoneNumber, ChatState.MENU_18_35)
        return WhatsAppService.sendTextMessage(phoneNumber, `✨ En proceso...`)
      } else if (['4'].includes(normalizedMessage)) {
        userStates.set(phoneNumber, ChatState.MENU_REPORT)
        return WhatsAppService.sendTextMessage(phoneNumber, `🛠️ En proceso...`)
      } else {
        return WhatsAppService.sendTextMessage(
          phoneNumber,
          `❓ No entendí. Por favor elegí una opción del menú con el número correspondiente.`
        )
      }

    case ChatState.SECRET_CODE:
      if (
        normalizedMessage === '1' ||
        normalizedMessage === 'sí' ||
        normalizedMessage === 'si'
      ) {
        userStates.set(phoneNumber, ChatState.NEW_TEACHER)
        return WhatsAppService.sendTextMessage(
          phoneNumber,
          `🧑‍🏫 En proceso para nuevos profesores...`
        )
      } else if (normalizedMessage === '2' || normalizedMessage === 'no') {
        userStates.set(phoneNumber, ChatState.SPECIAL_MENU)
        return WhatsAppService.sendTextMessage(
          phoneNumber,
          `¿Qué te gustaría hacer?
1 - Crear *clase*
2 - Crear *milonga*
3 - Crear *evento*
4 - Modificar un *evento*`
        )
      } else {
        return WhatsAppService.sendTextMessage(
          phoneNumber,
          `❓ Opción inválida. ¿Eres un nuevo profesor?\n1 - Sí\n2 - No`
        )
      }

    case ChatState.SPECIAL_MENU:
      if (['1', 'clase'].includes(normalizedMessage)) {
        userStates.set(phoneNumber, ChatState.SPECIAL_CREATE)
        return WhatsAppService.sendTextMessage(
          phoneNumber,
          `📝 Crear clase (en desarrollo)...`
        )
      } else if (['2', 'milonga'].includes(normalizedMessage)) {
        return WhatsAppService.sendTextMessage(
          phoneNumber,
          `📝 Crear milonga (en desarrollo)...`
        )
      } else if (['3', 'evento'].includes(normalizedMessage)) {
        return WhatsAppService.sendTextMessage(
          phoneNumber,
          `📝 Crear evento (en desarrollo)...`
        )
      } else if (['4', 'modificar'].includes(normalizedMessage)) {
        return WhatsAppService.sendTextMessage(
          phoneNumber,
          `🛠️ Modificar evento (en desarrollo)...`
        )
      } else {
        return WhatsAppService.sendTextMessage(
          phoneNumber,
          `❓ Opción inválida. Elegí una opción del menú.`
        )
      }

    default:
      userStates.set(phoneNumber, ChatState.START)
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `😅 Algo salió mal, volvamos a empezar.`
      )
  }
}

async function sendBasicResponse(phoneNumber: string, receivedMessage: string) {
  // Por ahora, respuesta de eco simple para probar
  const responseText = `🤖 Bot funcionando! Recibí: "${receivedMessage}"
  
📱 Tu número: ${phoneNumber}
⏰ Hora: ${new Date().toLocaleString('es-AR')}

🚧 Sistema en desarrollo...`

  const success = await WhatsAppService.sendTextMessage(
    phoneNumber,
    responseText
  )

  // if (success) {
  //   // Guardar la respuesta en la base de datos
  //   await DatabaseService.saveOutgoingMessage(phoneNumber, 'text', responseText);
  // }
}
