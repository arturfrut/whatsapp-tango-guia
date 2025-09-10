import {
  EventType,
  NewEventData,
  ClassCreationData,
  PracticeCreationData,
  MilongaPreClassData,
  OrganizerCreationData,
  PricingCreationData
} from './types'

export class EventBuilder {
  
  // =============================================
  // FACTORY METHODS
  // =============================================
  
  static createNewEvent(eventType: EventType): NewEventData {
    return {
      event_type: eventType,
      organizers: [],
      classes: [],
      pricing: []
    }
  }

  static createEmptyEventData(): NewEventData {
    return {
      organizers: [],
      classes: [],
      pricing: []
    }
  }

  // =============================================
  // BASIC EVENT PROPERTIES
  // =============================================
  
  static setTitle(eventData: NewEventData, title: string): NewEventData {
    return {
      ...eventData,
      title
    }
  }

  static setVenue(eventData: NewEventData, venueName: string): NewEventData {
    return {
      ...eventData,
      venue_name: venueName
    }
  }

  static setAddress(eventData: NewEventData, address: string): NewEventData {
    return {
      ...eventData,
      address
    }
  }

  static setDate(eventData: NewEventData, date: string): NewEventData {
    return {
      ...eventData,
      date
    }
  }

  static setDescription(eventData: NewEventData, description?: string): NewEventData {
    return {
      ...eventData,
      description
    }
  }

  static setRecurrence(eventData: NewEventData, hasRecurrence: boolean): NewEventData {
    return {
      ...eventData,
      has_weekly_recurrence: hasRecurrence
    }
  }

  static setContact(eventData: NewEventData, contactPhone?: string): NewEventData {
    return {
      ...eventData,
      contact_phone: contactPhone
    }
  }

  static setReminder(eventData: NewEventData, reminderPhone?: string): NewEventData {
    return {
      ...eventData,
      reminder_phone: reminderPhone
    }
  }

  // =============================================
  // CLASS MANAGEMENT
  // =============================================
  
  static addClass(
    eventData: NewEventData, 
    classData: ClassCreationData
  ): NewEventData {
    const newClasses = [...(eventData.classes || []), classData]
    return {
      ...eventData,
      classes: newClasses
    }
  }

  static updateClass(
    eventData: NewEventData,
    classIndex: number,
    classData: Partial<ClassCreationData>
  ): NewEventData {
    if (!eventData.classes || classIndex >= eventData.classes.length) {
      return eventData
    }

    const updatedClasses = [...eventData.classes]
    updatedClasses[classIndex] = {
      ...updatedClasses[classIndex],
      ...classData
    }

    return {
      ...eventData,
      classes: updatedClasses
    }
  }

  static removeClass(eventData: NewEventData, classIndex: number): NewEventData {
    if (!eventData.classes || classIndex >= eventData.classes.length) {
      return eventData
    }

    const updatedClasses = eventData.classes.filter((_, index) => index !== classIndex)
    return {
      ...eventData,
      classes: updatedClasses
    }
  }

  static setCurrentClassIndex(
    eventData: NewEventData, 
    index: number
  ): NewEventData {
    return {
      ...eventData,
      current_class_index: index
    }
  }

  static getCurrentClassIndex(eventData: NewEventData): number {
    return eventData.current_class_index || 0
  }

  static getCurrentClass(eventData: NewEventData): ClassCreationData | undefined {
    const index = this.getCurrentClassIndex(eventData)
    return eventData.classes?.[index]
  }

  static updateCurrentClass(
    eventData: NewEventData,
    classData: Partial<ClassCreationData>
  ): NewEventData {
    const index = this.getCurrentClassIndex(eventData)
    return this.updateClass(eventData, index, classData)
  }

  // =============================================
  // PRACTICE MANAGEMENT
  // =============================================
  
  static setPractice(
    eventData: NewEventData,
    practiceData: PracticeCreationData
  ): NewEventData {
    return {
      ...eventData,
      practice: practiceData
    }
  }

  static removePractice(eventData: NewEventData): NewEventData {
    const { practice, ...rest } = eventData
    return rest
  }

  // =============================================
  // MILONGA-SPECIFIC METHODS
  // =============================================
  
  static setMilongaTime(eventData: NewEventData, time: string): NewEventData {
    return {
      ...eventData,
      milonga_time: time
    }
  }

  static setMilongaPreClass(
    eventData: NewEventData,
    preClassData: MilongaPreClassData
  ): NewEventData {
    return {
      ...eventData,
      pre_class: preClassData
    }
  }

  static setMilongaShow(eventData: NewEventData, showDescription?: string): NewEventData {
    return {
      ...eventData,
      show_description: showDescription
    }
  }

  // =============================================
  // ORGANIZER MANAGEMENT
  // =============================================
  
  static addOrganizer(
    eventData: NewEventData,
    organizerData: OrganizerCreationData
  ): NewEventData {
    const newOrganizers = [...(eventData.organizers || []), organizerData]
    return {
      ...eventData,
      organizers: newOrganizers
    }
  }

  static updateOrganizer(
    eventData: NewEventData,
    organizerIndex: number,
    organizerData: Partial<OrganizerCreationData>
  ): NewEventData {
    if (!eventData.organizers || organizerIndex >= eventData.organizers.length) {
      return eventData
    }

    const updatedOrganizers = [...eventData.organizers]
    updatedOrganizers[organizerIndex] = {
      ...updatedOrganizers[organizerIndex],
      ...organizerData
    }

    return {
      ...eventData,
      organizers: updatedOrganizers
    }
  }

  static removeOrganizer(eventData: NewEventData, organizerIndex: number): NewEventData {
    if (!eventData.organizers || organizerIndex >= eventData.organizers.length) {
      return eventData
    }

    const updatedOrganizers = eventData.organizers.filter((_, index) => index !== organizerIndex)
    return {
      ...eventData,
      organizers: updatedOrganizers
    }
  }

  static setPrimaryOrganizer(eventData: NewEventData, organizerIndex: number): NewEventData {
    if (!eventData.organizers || organizerIndex >= eventData.organizers.length) {
      return eventData
    }

    const updatedOrganizers = eventData.organizers.map((org, index) => ({
      ...org,
      is_primary: index === organizerIndex
    }))

    return {
      ...eventData,
      organizers: updatedOrganizers
    }
  }

  static addSelfAsOrganizer(eventData: NewEventData, userId: string): NewEventData {
    const isFirst = !eventData.organizers || eventData.organizers.length === 0

    const organizerData: OrganizerCreationData = {
      user_id: userId,
      organizer_type: 'teacher',
      is_primary: isFirst,
      is_one_time_teacher: false
    }

    return this.addOrganizer(eventData, organizerData)
  }

  static addOneTimeOrganizer(
    eventData: NewEventData,
    teacherName: string
  ): NewEventData {
    const isFirst = !eventData.organizers || eventData.organizers.length === 0

    const organizerData: OrganizerCreationData = {
      organizer_type: 'teacher',
      is_primary: isFirst,
      is_one_time_teacher: true,
      one_time_teacher_name: teacherName
    }

    return this.addOrganizer(eventData, organizerData)
  }

  // =============================================
  // PRICING MANAGEMENT
  // =============================================
  
  static addPricing(
    eventData: NewEventData,
    pricingData: PricingCreationData
  ): NewEventData {
    const newPricing = [...(eventData.pricing || []), pricingData]
    return {
      ...eventData,
      pricing: newPricing
    }
  }

  static updatePricing(
    eventData: NewEventData,
    pricingIndex: number,
    pricingData: Partial<PricingCreationData>
  ): NewEventData {
    if (!eventData.pricing || pricingIndex >= eventData.pricing.length) {
      return eventData
    }

    const updatedPricing = [...eventData.pricing]
    updatedPricing[pricingIndex] = {
      ...updatedPricing[pricingIndex],
      ...pricingData
    }

    return {
      ...eventData,
      pricing: updatedPricing
    }
  }

  static removePricing(eventData: NewEventData, pricingIndex: number): NewEventData {
    if (!eventData.pricing || pricingIndex >= eventData.pricing.length) {
      return eventData
    }

    const updatedPricing = eventData.pricing.filter((_, index) => index !== pricingIndex)
    return {
      ...eventData,
      pricing: updatedPricing
    }
  }

  static clearPricing(eventData: NewEventData): NewEventData {
    return {
      ...eventData,
      pricing: []
    }
  }

  // =============================================
  // TEMPORARY DATA MANAGEMENT
  // =============================================
  
  static setTempData<T extends keyof NewEventData>(
    eventData: NewEventData,
    key: string,
    value: any
  ): NewEventData {
    return {
      ...eventData,
      [key]: value
    }
  }

  static clearTempData(eventData: NewEventData): NewEventData {
    const {
      temp_pricing_detail,
      temp_pricing_type,
      temp_organizer_search,
      temp_organizer_results,
      current_class_index,
      ...cleanData
    } = eventData

    return cleanData
  }

  // =============================================
  // VALIDATION HELPERS
  // =============================================
  
  static hasRequiredFields(eventData: NewEventData): boolean {
    return !!(
      eventData.title &&
      eventData.venue_name &&
      eventData.address &&
      eventData.date &&
      eventData.event_type
    )
  }

  static hasClasses(eventData: NewEventData): boolean {
    return !!(eventData.classes && eventData.classes.length > 0)
  }

  static hasOrganizers(eventData: NewEventData): boolean {
    return !!(eventData.organizers && eventData.organizers.length > 0)
  }

  static hasPricing(eventData: NewEventData): boolean {
    return !!(eventData.pricing && eventData.pricing.length > 0)
  }

  static isComplete(eventData: NewEventData): boolean {
    return this.hasRequiredFields(eventData) && 
           this.hasOrganizers(eventData) &&
           (eventData.event_type !== 'class' || this.hasClasses(eventData))
  }

  // =============================================
  // DISPLAY HELPERS
  // =============================================
  
  static getOrganizerNames(eventData: NewEventData): string[] {
    if (!eventData.organizers) return []
    
    return eventData.organizers.map(org => 
      org.one_time_teacher_name || 'Profesor registrado'
    )
  }

  static getPrimaryOrganizerName(eventData: NewEventData): string {
    if (!eventData.organizers) return 'Sin organizador'
    
    const primary = eventData.organizers.find(org => org.is_primary)
    return primary?.one_time_teacher_name || 'Profesor registrado'
  }

  static getTotalPrices(eventData: NewEventData): number {
    if (!eventData.pricing) return 0
    
    return eventData.pricing.reduce((total, price) => total + price.price, 0)
  }

  static getEventSummary(eventData: NewEventData): string {
    const type = eventData.event_type || 'evento'
    const title = eventData.title || 'Sin título'
    const venue = eventData.venue_name || 'Sin lugar'
    const date = eventData.date || 'Sin fecha'
    
    return `${type}: ${title} en ${venue} - ${date}`
  }

  // =============================================
  // CLONING AND COPYING
  // =============================================
  
  static clone(eventData: NewEventData): NewEventData {
    return JSON.parse(JSON.stringify(eventData))
  }

  static reset(eventData: NewEventData): NewEventData {
    return {
      event_type: eventData.event_type,
      organizers: [],
      classes: [],
      pricing: []
    }
  }
}