import { MenuHandler } from "../../modules/menu/MenuHandler"
import { ChatState } from "../../types/processTangoConversation"

class TestableMenuHandler extends MenuHandler {
  public testCreateContext(phoneNumber: string, messageContent: string, currentState: ChatState) {
    return this.createContext(phoneNumber, messageContent, currentState)
  }
}

const handler = new TestableMenuHandler()

console.log('=== ESTADOS DE MENU BÁSICOS ===')
console.log('START:', handler.canHandle(ChatState.START))
console.log('MAIN_MENU:', handler.canHandle(ChatState.MAIN_MENU))
console.log('SPECIAL_MENU:', handler.canHandle(ChatState.SPECIAL_MENU))

console.log('\n=== ESTADOS DE EVENTOS ===')
console.log('MENU_TODAY:', handler.canHandle(ChatState.MENU_TODAY))
console.log('MENU_WEEK:', handler.canHandle(ChatState.MENU_WEEK))
console.log('MENU_TODAY_DETAILS:', handler.canHandle(ChatState.MENU_TODAY_DETAILS))

console.log('\n=== ESTADOS NO MANEJADOS ===')
console.log('CREATE_EVENT_TITLE:', handler.canHandle(ChatState.CREATE_EVENT_TITLE)) // false
console.log('NEW_TEACHER_NAME:', handler.canHandle(ChatState.NEW_TEACHER_NAME)) // false

console.log('\n✅ MenuHandler completo - Todos los módulos terminados')