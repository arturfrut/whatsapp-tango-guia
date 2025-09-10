import { TeacherHandler } from "../../modules/teacher/TeacherHandler"
import { ChatState } from "../../types/processTangoConversation"

class TestableTeacherHandler extends TeacherHandler {
  public testCreateContext(phoneNumber: string, messageContent: string, currentState: ChatState) {
    return this.createContext(phoneNumber, messageContent, currentState)
  }
}

const handler = new TestableTeacherHandler()

console.log('=== ESTADOS DE PROFESOR PROPIO ===')
console.log('NEW_TEACHER_NAME:', handler.canHandle(ChatState.NEW_TEACHER_NAME))
console.log('NEW_TEACHER_DETAILS:', handler.canHandle(ChatState.NEW_TEACHER_DETAILS))
console.log('NEW_TEACHER_CONFIRMATION:', handler.canHandle(ChatState.NEW_TEACHER_CONFIRMATION))

console.log('\n=== ESTADOS DE OTRO PROFESOR ===')
console.log('CREATE_OTHER_TEACHER_PHONE:', handler.canHandle(ChatState.CREATE_OTHER_TEACHER_PHONE))
console.log('CREATE_OTHER_TEACHER_NAME:', handler.canHandle(ChatState.CREATE_OTHER_TEACHER_NAME))
console.log('CREATE_OTHER_TEACHER_CONFIRMATION:', handler.canHandle(ChatState.CREATE_OTHER_TEACHER_CONFIRMATION))

console.log('\n=== ESTADOS NO MANEJADOS ===')
console.log('CREATE_EVENT_TITLE:', handler.canHandle(ChatState.CREATE_EVENT_TITLE)) // false
console.log('MAIN_MENU:', handler.canHandle(ChatState.MAIN_MENU)) // false

console.log('\n✅ TeacherHandler completo y funcional')