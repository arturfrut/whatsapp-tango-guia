import { NewEventData } from '../../modules/common/types'
import { EventMessages } from '../../modules/event/EventMessages'

// Test mensajes básicos
console.log(EventMessages.getTitlePrompt('class'))
console.log(EventMessages.getVenuePrompt('Mi clase de tango'))

// Test confirmación (necesitarás crear un objeto de prueba)
const testEvent: NewEventData = {
  event_type: 'class',
  title: 'Clase de prueba',
  venue_name: 'Centro Cultural',
  address: 'Calle 123',
  date: '2024-12-15',
  organizers: [],
  classes: [],
  pricing: []
}
console.log(EventMessages.getEventConfirmation(testEvent))
