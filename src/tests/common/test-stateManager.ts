import { StateManager } from '../../modules/common/StateManager'
import { ChatState } from '../../modules/common/types'

// Test clasificación de estados
console.log(StateManager.isEventCreationState(ChatState.CREATE_EVENT_TITLE)) // true
console.log(StateManager.isMenuState(ChatState.MAIN_MENU)) // true

// Test navegación
console.log(StateManager.getPreviousState(ChatState.CREATE_EVENT_VENUE)) // CREATE_EVENT_TITLE
console.log(
  StateManager.handleSpecialNavigation(ChatState.CREATE_EVENT_TITLE, '0')
) // SPECIAL_MENU
