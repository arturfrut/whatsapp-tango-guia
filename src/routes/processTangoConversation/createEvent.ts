import { WhatsAppService } from '../../services/whatsapp'
import { DatabaseService } from '../../services/database'
import { OpenAIService } from '../../services/openaiService'
import {
  ChatState,
  AIEventDataStore,
  NewEventData
} from '../../types/processTangoConversation'

export async function handleEventCreation(
  userStates: Map<string, ChatState>,
  aiEventData: Map<string, AIEventDataStore>,
  phoneNumber: string,
  messageContent: string
): Promise<any> {
  const currentState = userStates.get(phoneNumber)

  switch (currentState) {
    case ChatState.AI_EVENT_INPUT:
      return handleAIEventInput(
        userStates,
        aiEventData,
        phoneNumber,
        messageContent
      )

    case ChatState.AI_EVENT_TEACHER_SEARCH:
      return handleAIEventTeacherSearch(
        userStates,
        aiEventData,
        phoneNumber,
        messageContent
      )

    case ChatState.AI_EVENT_TEACHER_SELECT:
      return handleAIEventTeacherSelect(
        userStates,
        aiEventData,
        phoneNumber,
        messageContent.trim().toLowerCase()
      )

    case ChatState.AI_EVENT_TEACHER_CREATE:
      return handleAIEventTeacherCreate(
        userStates,
        aiEventData,
        phoneNumber,
        messageContent.trim().toLowerCase()
      )

    case ChatState.AI_EVENT_VALIDATION:
      return handleAIEventValidation(
        userStates,
        aiEventData,
        phoneNumber,
        messageContent.trim().toLowerCase()
      )

    case ChatState.AI_EVENT_CORRECTION:
      return handleAIEventCorrection(
        userStates,
        aiEventData,
        phoneNumber,
        messageContent
      )

    default:
      userStates.set(phoneNumber, ChatState.START)
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `Algo salió mal, volvamos a empezar.`
      )
  }
}

async function handleAIEventInput(
  userStates: Map<string, ChatState>,
  aiEventData: Map<string, AIEventDataStore>,
  phoneNumber: string,
  messageContent: string
) {
  if (messageContent.trim().toLowerCase() === '0') {
    userStates.set(phoneNumber, ChatState.SPECIAL_MENU)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      'Volviendo al menú especial...'
    )
  }

  const existingData = aiEventData.get(phoneNumber)

  if (
    existingData &&
    existingData.extraction.needsHumanInput &&
    existingData.extraction.followUpQuestions
  ) {
    console.log('🔄 Usuario respondiendo a pregunta de seguimiento')
    return handleAIEventCorrection(
      userStates,
      aiEventData,
      phoneNumber,
      messageContent
    )
  }

  const user = await DatabaseService.getUserByPhone(phoneNumber)
  const context = {
    userPhone: phoneNumber,
    isTeacher: user?.role === 'teacher',
    userName: user?.name
  }

  await WhatsAppService.sendTextMessage(
    phoneNumber,
    `🤖 Procesando tu evento...`
  )

  const extraction = await OpenAIService.extractEventData(
    messageContent,
    context
  )

  console.log('📊 Extraction result:', JSON.stringify(extraction, null, 2))

  aiEventData.set(phoneNumber, {
    extraction,
    originalInput: messageContent
  })

  if (extraction.confidence < 30 || extraction.needsHumanInput) {
    let followUpMessage = extraction.validationMessage + '\n\n'

    if (
      extraction.followUpQuestions &&
      extraction.followUpQuestions.length > 0
    ) {
      followUpMessage += '*Ayúdame respondiendo:*\n'
      extraction.followUpQuestions.forEach((question, index) => {
        followUpMessage += `${index + 1}. ${question}\n`
      })
    }

    followUpMessage += '\n_Envía "0" para volver_'

    return WhatsAppService.sendTextMessage(phoneNumber, followUpMessage)
  }

  const validationMessage = OpenAIService.buildValidationMessage(extraction)
  userStates.set(phoneNumber, ChatState.AI_EVENT_VALIDATION)

  return WhatsAppService.sendTextMessage(phoneNumber, validationMessage)
}

async function handleAIEventTeacherSearch(
  userStates: Map<string, ChatState>,
  aiEventData: Map<string, AIEventDataStore>,
  phoneNumber: string,
  messageContent: string
): Promise<any> {
  if (messageContent.trim().toLowerCase() === '0') {
    userStates.set(phoneNumber, ChatState.AI_EVENT_VALIDATION)
    const storedData = aiEventData.get(phoneNumber)
    if (storedData) {
      const validationMessage = OpenAIService.buildValidationMessage(
        storedData.extraction
      )
      return WhatsAppService.sendTextMessage(phoneNumber, validationMessage)
    }
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      'Volviendo al menú especial...'
    )
  }

  const teacherName = messageContent.trim()

  if (teacherName.length < 2) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❌ El nombre debe tener al menos 2 caracteres.

Escribí el nombre del profesor:

_Envía "0" para volver_`
    )
  }

  const results = await DatabaseService.searchTeachersByName(teacherName, 3)

  const storedData = aiEventData.get(phoneNumber)!
  aiEventData.set(phoneNumber, {
    ...storedData,
    teacherSearchResults: [
      {
        searchedName: teacherName,
        results: results
      }
    ],
    currentTeacherIndex: 0
  })

  return await showTeacherSelectionForAIEvent(
    userStates,
    aiEventData,
    phoneNumber,
    0
  )
}

async function handleAIEventTeacherSelect(
  userStates: Map<string, ChatState>,
  aiEventData: Map<string, AIEventDataStore>,
  phoneNumber: string,
  normalizedMessage: string
): Promise<any> {
  if (normalizedMessage === '0') {
    userStates.set(phoneNumber, ChatState.AI_EVENT_VALIDATION)
    const storedData = aiEventData.get(phoneNumber)
    if (storedData) {
      const validationMessage = OpenAIService.buildValidationMessage(
        storedData.extraction
      )
      return WhatsAppService.sendTextMessage(phoneNumber, validationMessage)
    }
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      'Volviendo al menú especial...'
    )
  }

  const storedData = aiEventData.get(phoneNumber)
  if (!storedData || !storedData.teacherSearchResults) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      '❌ Error en la selección de profesor'
    )
  }

  const currentIndex = storedData.currentTeacherIndex || 0
  const currentSearch = storedData.teacherSearchResults[currentIndex]
  const { results } = currentSearch

  const selection = parseInt(normalizedMessage)

  if (isNaN(selection) || selection < 1 || selection > results.length + 1) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Número inválido. Elegí una opción del 1 al ${results.length + 1}.

_Envía "0" para volver_`
    )
  }

  if (selection === results.length + 1) {
    userStates.set(phoneNumber, ChatState.AI_EVENT_TEACHER_CREATE)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `👨‍🏫 *Crear nuevo profesor*

¿Es un profesor que no está registrado todavía?

Escribí el nombre completo del profesor:

*Ejemplo:* Juan Pérez

_Envía "0" para volver_`
    )
  }

  const selectedTeacher = results[selection - 1]

  const selectedTeachers = storedData.selectedTeachers || []
  selectedTeachers.push({
    user_id: selectedTeacher.id,
    organizer_type: 'teacher',
    is_primary: selectedTeachers.length === 0,
    is_one_time_teacher: false
  })

  const nextIndex = currentIndex + 1

  if (nextIndex < storedData.teacherSearchResults.length) {
    aiEventData.set(phoneNumber, {
      ...storedData,
      selectedTeachers,
      currentTeacherIndex: nextIndex
    })
    return await showTeacherSelectionForAIEvent(
      userStates,
      aiEventData,
      phoneNumber,
      nextIndex
    )
  } else {
    aiEventData.set(phoneNumber, {
      ...storedData,
      selectedTeachers
    })
    return await createEventFromAI(userStates, aiEventData, phoneNumber)
  }
}

async function handleAIEventTeacherCreate(
  userStates: Map<string, ChatState>,
  aiEventData: Map<string, AIEventDataStore>,
  phoneNumber: string,
  normalizedMessage: string
): Promise<any> {
  if (normalizedMessage === '0') {
    userStates.set(phoneNumber, ChatState.AI_EVENT_VALIDATION)
    const storedData = aiEventData.get(phoneNumber)
    if (storedData) {
      const validationMessage = OpenAIService.buildValidationMessage(
        storedData.extraction
      )
      return WhatsAppService.sendTextMessage(phoneNumber, validationMessage)
    }
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      'Volviendo al menú especial...'
    )
  }

  const storedData = aiEventData.get(phoneNumber)
  if (!storedData) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      '❌ Error al crear profesor'
    )
  }

  if (['1', 'si', 'sí', 'crear'].includes(normalizedMessage)) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `👨‍🏫 Perfecto, vamos a crear el profesor.

Escribí el nombre completo:

*Ejemplo:* Juan Pérez

_Envía "0" para volver_`
    )
  } else if (['2', 'no', 'otro'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.AI_EVENT_TEACHER_SEARCH)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `👨‍🏫 Escribí el nombre del profesor para buscarlo:

_Envía "0" para volver_`
    )
  }

  const teacherName = normalizedMessage.trim()

  if (teacherName.length < 3) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❌ El nombre debe tener al menos 3 caracteres.

*Ejemplo:* Juan Pérez

_Envía "0" para volver_`
    )
  }

  const selectedTeachers = storedData.selectedTeachers || []
  selectedTeachers.push({
    organizer_type: 'teacher',
    is_primary: selectedTeachers.length === 0,
    is_one_time_teacher: true,
    one_time_teacher_name: teacherName
  })

  const currentIndex = storedData.currentTeacherIndex || 0
  const nextIndex = currentIndex + 1

  if (
    storedData.teacherSearchResults &&
    nextIndex < storedData.teacherSearchResults.length
  ) {
    aiEventData.set(phoneNumber, {
      ...storedData,
      selectedTeachers,
      currentTeacherIndex: nextIndex
    })
    return await showTeacherSelectionForAIEvent(
      userStates,
      aiEventData,
      phoneNumber,
      nextIndex
    )
  } else {
    aiEventData.set(phoneNumber, {
      ...storedData,
      selectedTeachers
    })
    return await createEventFromAI(userStates, aiEventData, phoneNumber)
  }
}

async function handleAIEventValidation(
  userStates: Map<string, ChatState>,
  aiEventData: Map<string, AIEventDataStore>,
  phoneNumber: string,
  normalizedMessage: string
) {
  if (normalizedMessage === '0') {
    aiEventData.delete(phoneNumber)
    userStates.set(phoneNumber, ChatState.SPECIAL_MENU)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      'Volviendo al menú especial...'
    )
  }

  const storedData = aiEventData.get(phoneNumber)
  if (!storedData) {
    userStates.set(phoneNumber, ChatState.SPECIAL_MENU)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      'Volviendo al menú especial...'
    )
  }

  if (['1', 'si', 'sí', 'confirmo', 'crear'].includes(normalizedMessage)) {
    const { extractedData } = storedData.extraction
    const missingCritical: string[] = []

    if (!extractedData.event_type) missingCritical.push('tipo de evento')
    if (!extractedData.title) missingCritical.push('título')
    if (!extractedData.venue_name) missingCritical.push('nombre del lugar')
    if (!extractedData.address) missingCritical.push('dirección')
    if (!extractedData.date) missingCritical.push('fecha')

    if (extractedData.date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(extractedData.date)) {
        missingCritical.push('fecha en formato válido (YYYY-MM-DD)')
      }
    }

    if (extractedData.event_type === 'class') {
      if (!extractedData.classes || extractedData.classes.length === 0) {
        missingCritical.push('horario de clase')
      } else {
        const classesWithoutTime = extractedData.classes.filter(
          cls => !cls.start_time
        )
        if (classesWithoutTime.length > 0) {
          missingCritical.push('horario de inicio de la clase')
        }
      }
    }

    if (extractedData.event_type === 'milonga') {
      const hasPractice =
        extractedData.practice && extractedData.practice.practice_time
      const hasPreClass =
        extractedData.pre_class && extractedData.pre_class.milonga_start_time

      if (!hasPractice && !hasPreClass) {
        missingCritical.push('horario de inicio de la milonga')
      }
    }

    if (extractedData.event_type === 'seminar') {
      if (!extractedData.classes || extractedData.classes.length === 0) {
        missingCritical.push('horarios del seminario')
      }
    }

    if (
      extractedData.event_type === 'class' ||
      extractedData.event_type === 'seminar'
    ) {
      const hasTeacherNames =
        storedData.extraction.teacherNames &&
        storedData.extraction.teacherNames.length > 0

      if (!hasTeacherNames) {
        missingCritical.push('nombre del profesor')
      }
    }

    if (missingCritical.length > 0) {
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `❌ Faltan estos datos críticos:

${missingCritical.map(m => `• ${m}`).join('\n')}

Por favor, proporciona esta información:

*Ejemplo:*
"La fecha es el martes 15 de octubre a las 20hs en UADE Magallanes 2025, la da Juan López"

_Envía "0" para cancelar_`
      )
    }

    return await handleTeacherSearchForAIEvent(
      userStates,
      aiEventData,
      phoneNumber
    )
  } else if (['2', 'no', 'corregir', 'modificar'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.AI_EVENT_CORRECTION)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `🔧 ¿Qué quieres corregir?

Describe los cambios que quieres hacer:

*Ejemplos:*
- "La fecha es el viernes, no el martes"
- "El horario es 21hs, no 20hs"
- "El profesor es Juan Pérez, no María"

_Envía "0" para volver_`
    )
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Por favor responde:

1 - ✅ Sí, crear evento
2 - ❌ Corregir algo

_Envía "0" para volver_`
    )
  }
}

async function handleAIEventCorrection(
  userStates: Map<string, ChatState>,
  aiEventData: Map<string, AIEventDataStore>,
  phoneNumber: string,
  messageContent: string
) {
  if (messageContent.trim().toLowerCase() === '0') {
    userStates.set(phoneNumber, ChatState.AI_EVENT_VALIDATION)
    const storedData = aiEventData.get(phoneNumber)
    if (storedData) {
      const validationMessage = OpenAIService.buildValidationMessage(
        storedData.extraction
      )
      return WhatsAppService.sendTextMessage(phoneNumber, validationMessage)
    }
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      'Volviendo al menú especial...'
    )
  }

  const storedData = aiEventData.get(phoneNumber)
  if (!storedData) {
    userStates.set(phoneNumber, ChatState.SPECIAL_MENU)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      'Volviendo al menú especial...'
    )
  }

  const isTeacherResponse =
    storedData.extraction.missingFields?.includes('teacher_name') &&
    storedData.extraction.followUpQuestions?.some(
      q =>
        q.toLowerCase().includes('profesor') ||
        q.toLowerCase().includes('teacher')
    )

  if (isTeacherResponse) {
    console.log('👨‍🏫 Detectado nombre de profesor:', messageContent)

    const updatedExtraction = {
      ...storedData.extraction,
      teacherNames: [messageContent.trim()],
      missingFields: storedData.extraction.missingFields.filter(
        f => f !== 'teacher_name'
      ),
      needsHumanInput: false,
      followUpQuestions: []
    }

    aiEventData.set(phoneNumber, {
      ...storedData,
      extraction: updatedExtraction
    })

    const validationMessage =
      OpenAIService.buildValidationMessage(updatedExtraction)
    userStates.set(phoneNumber, ChatState.AI_EVENT_VALIDATION)

    return WhatsAppService.sendTextMessage(phoneNumber, validationMessage)
  }

  await WhatsAppService.sendTextMessage(
    phoneNumber,
    `🤖 Procesando correcciones...`
  )

  const updatedExtraction = await OpenAIService.continueDiagnosticConversation(
    storedData.originalInput,
    storedData.extraction,
    messageContent
  )

  aiEventData.set(phoneNumber, {
    ...storedData,
    extraction: updatedExtraction
  })

  const validationMessage =
    OpenAIService.buildValidationMessage(updatedExtraction)
  userStates.set(phoneNumber, ChatState.AI_EVENT_VALIDATION)

  return WhatsAppService.sendTextMessage(phoneNumber, validationMessage)
}

async function showTeacherSelectionForAIEvent(
  userStates: Map<string, ChatState>,
  aiEventData: Map<string, AIEventDataStore>,
  phoneNumber: string,
  teacherIndex: number
): Promise<any> {
  const storedData = aiEventData.get(phoneNumber)
  if (!storedData || !storedData.teacherSearchResults) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      '❌ Error en la búsqueda de profesores'
    )
  }

  const currentSearch = storedData.teacherSearchResults[teacherIndex]
  const { searchedName, results } = currentSearch

  if (results.length === 0) {
    userStates.set(phoneNumber, ChatState.AI_EVENT_TEACHER_CREATE)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❌ No encontré ningún profesor llamado *"${searchedName}"*.

¿Es un profesor que no está registrado?

1 - Sí, crear este profesor ahora
2 - No, escribir otro nombre

_Envía "0" para volver_`
    )
  }

  userStates.set(phoneNumber, ChatState.AI_EVENT_TEACHER_SELECT)

  let message = `🔍 Buscaste: *"${searchedName}"*\n\n`
  message += `Encontré estos profesores:\n\n`

  results.forEach((teacher: any, index: number) => {
    message += `${index + 1} - *${teacher.name}*\n`
    if (teacher.details) {
      message += `   ${teacher.details.substring(0, 50)}...\n`
    }
  })

  message += `\n${results.length + 1} - Ninguno, es otro profesor\n`
  message += `\n¿Cuál es el correcto?\n\n_Envía "0" para volver_`

  return WhatsAppService.sendTextMessage(phoneNumber, message)
}

async function handleTeacherSearchForAIEvent(
  userStates: Map<string, ChatState>,
  aiEventData: Map<string, AIEventDataStore>,
  phoneNumber: string
): Promise<any> {
  const storedData = aiEventData.get(phoneNumber)
  if (!storedData) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      '❌ Error: No se encontraron datos del evento'
    )
  }

  const { extraction } = storedData
  const teacherNames = extraction.teacherNames || []

  if (
    (extraction.extractedData.event_type === 'class' ||
      extraction.extractedData.event_type === 'seminar') &&
    teacherNames.length === 0
  ) {
    userStates.set(phoneNumber, ChatState.AI_EVENT_TEACHER_SEARCH)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `👨‍🏫 *Profesor requerido*

¿Quién da esta ${
        extraction.extractedData.event_type === 'class' ? 'clase' : 'seminario'
      }?

Escribí el nombre del profesor:

_Envía "0" para volver_`
    )
  }

  if (teacherNames.length > 0) {
    const teacherSearchResults = []

    for (const teacherName of teacherNames) {
      const results = await DatabaseService.searchTeachersByName(teacherName, 3)
      teacherSearchResults.push({
        searchedName: teacherName,
        results: results
      })
    }

    aiEventData.set(phoneNumber, {
      ...storedData,
      teacherSearchResults,
      currentTeacherIndex: 0
    })

    return await showTeacherSelectionForAIEvent(
      userStates,
      aiEventData,
      phoneNumber,
      0
    )
  }

  return await createEventFromAI(userStates, aiEventData, phoneNumber)
}

async function createEventFromAI(
  userStates: Map<string, ChatState>,
  aiEventData: Map<string, AIEventDataStore>,
  phoneNumber: string
): Promise<any> {
  const storedData = aiEventData.get(phoneNumber)
  if (!storedData) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      '❌ Error: No se encontraron datos del evento'
    )
  }

  const { extraction, selectedTeachers } = storedData
  const extractedData = extraction.extractedData

  try {
    if (
      !extractedData.event_type ||
      !extractedData.title ||
      !extractedData.venue_name ||
      !extractedData.address ||
      !extractedData.date
    ) {
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `❌ Faltan datos críticos para crear el evento:
        
${!extractedData.event_type ? '• Tipo de evento' : ''}
${!extractedData.title ? '• Título' : ''}
${!extractedData.venue_name ? '• Lugar' : ''}
${!extractedData.address ? '• Dirección' : ''}
${!extractedData.date ? '• Fecha' : ''}

Por favor, describe nuevamente tu evento con esta información.`
      )
    }

    let preClassData = undefined
    if (
      extractedData.pre_class &&
      extractedData.pre_class.class_time &&
      extractedData.pre_class.milonga_start_time
    ) {
      preClassData = extractedData.pre_class
    } else if (
      extractedData.pre_class &&
      (extractedData.pre_class.class_time ||
        extractedData.pre_class.milonga_start_time)
    ) {
      console.warn(
        '⚠️ pre_class incompleto, se omitirá:',
        extractedData.pre_class
      )
      preClassData = undefined
    }

    const eventData: NewEventData = {
      event_type: extractedData.event_type,
      title: extractedData.title,
      venue_name: extractedData.venue_name,
      address: extractedData.address,
      date: extractedData.date,
      description: extractedData.description,
      has_weekly_recurrence: extractedData.has_weekly_recurrence || false,
      show_description: extractedData.show_description,
      classes: extractedData.classes,
      practice: extractedData.practice,
      pre_class: preClassData,
      pricing: extractedData.pricing,
      organizers: selectedTeachers || [],
      reminder_phone: extractedData.has_weekly_recurrence
        ? phoneNumber
        : undefined,
      contact_phone: phoneNumber
    }

    console.log('📝 Event data to create:', JSON.stringify(eventData, null, 2))

    const newEvent = await DatabaseService.createTangoEvent(
      phoneNumber,
      eventData
    )

    if (newEvent) {
      aiEventData.delete(phoneNumber)
      userStates.set(phoneNumber, ChatState.SPECIAL_MENU)

      const eventTypeName = {
        class: 'clase',
        milonga: 'milonga',
        seminar: 'seminario',
        special_event: 'evento especial'
      }[extractedData.event_type]

      let successMessage = `🎉 ¡Excelente! Tu ${eventTypeName} *"${extractedData.title}"* ha sido creada exitosamente.\n\n`

      if (extractedData.has_weekly_recurrence) {
        successMessage += `🔔 Recordatorio: Mensualmente te llegará una notificación para confirmar si seguís organizando esta actividad.\n\n`
      }

      successMessage += `¿Quieres crear otro evento?\n\n`
      successMessage += `1 - Crear otro evento\n`
      successMessage += `2 - Crear profesor\n`
      successMessage += `0 - Volver al menú principal`

      return WhatsAppService.sendTextMessage(phoneNumber, successMessage)
    } else {
      userStates.set(phoneNumber, ChatState.START)
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `❌ Ocurrió un error al crear tu evento.\n\nPor favor intenta nuevamente más tarde.`
      )
    }
  } catch (error) {
    console.error('Error creating event from AI:', error)
    userStates.set(phoneNumber, ChatState.START)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❌ Ocurrió un error al crear tu evento.\n\nPor favor intenta nuevamente más tarde.`
    )
  }
}