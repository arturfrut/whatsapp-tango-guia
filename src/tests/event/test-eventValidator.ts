import { EventValidator } from '../../modules/event/EventValidator'

// Test validaciones específicas de eventos
console.log(EventValidator.validateEventType('1')) // debería retornar 'class'
console.log(EventValidator.validateClassLevel('2')) // debería retornar 'intermediate'
console.log(EventValidator.validateEventTitle('Mi clase de tango')) // debería ser válido
console.log(EventValidator.validateMilongaShow('Juan y María')) // debería retornar el texto
