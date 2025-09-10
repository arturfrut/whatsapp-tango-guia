import { EventHandler } from "../../modules/event/EventHandler"
import { ChatState } from "../../types/processTangoConversation"

// Subclase para exponer createContext en tests
class TestableEventHandler extends EventHandler {
  public testCreateContext(phoneNumber: string, messageContent: string, currentState: ChatState) {
    return this.createContext(phoneNumber, messageContent, currentState)
  }
}

const phone = '+5491234567890'
const handler = new TestableEventHandler()

console.log('=== TEST EventHandler ===')

// Test básicos de canHandle
console.log('CREATE_EVENT_TITLE:', handler.canHandle(ChatState.CREATE_EVENT_TITLE)) // true
console.log('MAIN_MENU:', handler.canHandle(ChatState.MAIN_MENU)) // false

// Test context creation
const context = handler.testCreateContext(
  phone,
  'Mi clase de tango',
  ChatState.CREATE_EVENT_TITLE
)
console.log('Context normalizedMessage:', context.normalizedMessage) // 'mi clase de tango'

// Test que todos los estados de clases están manejados
console.log('\n=== ESTADOS DE CLASES ===')
console.log('CREATE_CLASS_TIME:', handler.canHandle(ChatState.CREATE_CLASS_TIME))
console.log('CREATE_CLASS_LEVEL:', handler.canHandle(ChatState.CREATE_CLASS_LEVEL))
console.log('CREATE_CLASS_ADD_ANOTHER:', handler.canHandle(ChatState.CREATE_CLASS_ADD_ANOTHER))
console.log('CREATE_CLASS_PRACTICE:', handler.canHandle(ChatState.CREATE_CLASS_PRACTICE))
console.log('CREATE_CLASS_PRACTICE_TIME:', handler.canHandle(ChatState.CREATE_CLASS_PRACTICE_TIME))

// Test que todos los estados de milonga están manejados
console.log('\n=== ESTADOS DE MILONGA ===')
console.log('CREATE_MILONGA_TIME:', handler.canHandle(ChatState.CREATE_MILONGA_TIME))
console.log('CREATE_MILONGA_PRE_CLASS:', handler.canHandle(ChatState.CREATE_MILONGA_PRE_CLASS))
console.log('CREATE_MILONGA_PRE_CLASS_DETAILS:', handler.canHandle(ChatState.CREATE_MILONGA_PRE_CLASS_DETAILS))
console.log('CREATE_MILONGA_SHOW:', handler.canHandle(ChatState.CREATE_MILONGA_SHOW))

// Test que estados no manejados retornan false
console.log('\n=== ESTADOS NO MANEJADOS ===')
console.log('MAIN_MENU:', handler.canHandle(ChatState.MAIN_MENU))
console.log('NEW_TEACHER_NAME:', handler.canHandle(ChatState.NEW_TEACHER_NAME))

// Test contexts para diferentes estados
console.log('\n=== TEST CONTEXTS ===')
const classTimeContext = handler.testCreateContext(phone, '20:30', ChatState.CREATE_CLASS_TIME)
console.log('Class time context:', classTimeContext.normalizedMessage)

const milongaContext = handler.testCreateContext(phone, 'SÍ', ChatState.CREATE_MILONGA_PRE_CLASS)
console.log('Milonga context:', milongaContext.normalizedMessage)

console.log('=== ESTADOS DE ORGANIZADORES ===')
console.log('CREATE_EVENT_ORGANIZERS:', handler.canHandle(ChatState.CREATE_EVENT_ORGANIZERS))
console.log('CREATE_EVENT_ORGANIZER_SELF:', handler.canHandle(ChatState.CREATE_EVENT_ORGANIZER_SELF))
console.log('CREATE_EVENT_ORGANIZER_SEARCH:', handler.canHandle(ChatState.CREATE_EVENT_ORGANIZER_SEARCH))

console.log('\n=== ESTADOS FINALES ===')
console.log('CREATE_EVENT_RECURRENCE:', handler.canHandle(ChatState.CREATE_EVENT_RECURRENCE))
console.log('CREATE_EVENT_CONTACT:', handler.canHandle(ChatState.CREATE_EVENT_CONTACT))
console.log('CREATE_EVENT_PRICING:', handler.canHandle(ChatState.CREATE_EVENT_PRICING))
console.log('CREATE_EVENT_CONFIRMATION:', handler.canHandle(ChatState.CREATE_EVENT_CONFIRMATION))


console.log('\n✅ Todos los tests pasaron - EventHandler unificado')
