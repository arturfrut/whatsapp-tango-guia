import { EventBuilder } from "../../modules/event/EventBuilder"


// Test construcción de evento
let eventData = EventBuilder.createNewEvent('class')
eventData = EventBuilder.setTitle(eventData, 'Mi clase de tango')
eventData = EventBuilder.setVenue(eventData, 'Centro Cultural')
eventData = EventBuilder.addClass(eventData, {
  start_time: '20:00',
  class_level: 'beginner'
})

console.log(EventBuilder.getEventSummary(eventData))
console.log(EventBuilder.hasRequiredFields(eventData)) // debería ser false (falta address, date)
console.log(EventBuilder.hasClasses(eventData)) // debería ser true