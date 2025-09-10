import { BaseHandler } from '../../modules/common/BaseHandler'
import {
  ChatState,
  ConversationContext,
  HandlerResponse
} from '../../modules/common/types'

class TestHandler extends BaseHandler {
  canHandle(state: ChatState): boolean {
    return state === ChatState.START
  }

  async handle(context: ConversationContext): Promise<HandlerResponse> {
    return this.createSuccessResponse()
  }

  // Método público para testing
  public testNormalizeInput(input: string): string {
    return this.normalizeInput(input)
  }

  public testIsGoBackCommand(input: string): boolean {
    return this.isGoBackCommand(input)
  }
}

// Test corregido
const handler = new TestHandler()
console.log(handler.testNormalizeInput('  HOLA MUNDO  ')) // debería ser "hola mundo"
console.log(handler.testIsGoBackCommand('0')) // debería ser true
