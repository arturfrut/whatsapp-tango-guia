import { WhatsAppService } from '../../services/whatsapp'
import { DatabaseService } from '../../services/database'
import { OpenAIService } from '../../services/openaiService'
import {
  ChatState,
  TempEventData,
  NewEventData,
  AIEventExtraction,
  AIEventDataStore
} from '../../types/processTangoConversation'
import { getMainMenuMessage } from './utils'
import { caseToday, caseWeek, handleEventSelection } from './showEvents'
import { handleTeacherCreation, startTeacherCreation } from './createTeacher'

const secretWord = process.env.SECRETWORD

const userStates = new Map<string, ChatState>()
const tempEventData = new Map<string, TempEventData>()
const aiEventData = new Map<string, AIEventDataStore>()


export async function handleConversation(
  phoneNumber: string,
  messageContent: string
) {
  const normalizedMessage = messageContent.trim().toLowerCase()
  const currentState = userStates.get(phoneNumber) || ChatState.START

  if (normalizedMessage === secretWord) {
    try {
      const existingUser = await DatabaseService.getUserByPhone(phoneNumber)

      if (existingUser && existingUser.role === 'teacher') {
        console.log(
          `Usuario profesor conocido detectado: ${existingUser.name} (${existingUser.role})`
        )
        const welcomeName = existingUser.name || 'Profesor'
        await WhatsAppService.sendTextMessage(
          phoneNumber,
          `¡Hola! ${welcomeName} Entraste al menú secreto`
        )
        return showSimplifiedSpecialMenu(userStates, phoneNumber)
      } else if (existingUser && existingUser.role !== 'normal_query') {
        console.log(
          `Usuario especial detectado: ${existingUser.name} (${existingUser.role})`
        )
        const welcomeName = existingUser.name || 'Usuario'
        await WhatsAppService.sendTextMessage(
          phoneNumber,
          `¡Hola! ${welcomeName} Entraste al menú secreto`
        )
        return showSimplifiedSpecialMenu(userStates, phoneNumber)
      } else {
        // Primera vez que entra o usuario normal
        console.log(
          'Primera vez que entra o usuario normal, creando perfil de profesor'
        )
        await WhatsAppService.sendTextMessage(
          phoneNumber,
          `¡Hola! Es la primera vez que entras, vamos a crear tu usuario.`
        )
        return startTeacherCreation(userStates, phoneNumber)
      }
    } catch (error) {
      console.error('Error verificando usuario existente:', error)
      await WhatsAppService.sendTextMessage(
        phoneNumber,
        `¡Hola! Es la primera vez que entras, vamos a crear tu usuario.`
      )
      return startTeacherCreation(userStates, phoneNumber)
    }
  }

  switch (currentState) {
    case ChatState.START:
      userStates.set(phoneNumber, ChatState.MAIN_MENU)
      return WhatsAppService.sendTextMessage(phoneNumber, getMainMenuMessage())

    case ChatState.MAIN_MENU:
    case ChatState.MENU_TODAY:
    case ChatState.MENU_WEEK:
      return handleMainMenuOptions(userStates, phoneNumber, normalizedMessage)

    case ChatState.MENU_TODAY_DETAILS:
    case ChatState.MENU_WEEK_DETAILS:
      return handleEventSelection(
        userStates,
        tempEventData,
        phoneNumber,
        normalizedMessage
      )

    case ChatState.NEW_TEACHER_NAME:
    case ChatState.NEW_TEACHER_DETAILS:
    case ChatState.NEW_TEACHER_CONFIRMATION:
    case ChatState.CREATE_OTHER_TEACHER_PHONE:
    case ChatState.CREATE_OTHER_TEACHER_NAME:
    case ChatState.CREATE_OTHER_TEACHER_DETAILS:
    case ChatState.CREATE_OTHER_TEACHER_CONFIRMATION:
      return handleTeacherCreation(userStates, phoneNumber, messageContent)

    case ChatState.SPECIAL_MENU:
      return handleSpecialMenuOptions(
        userStates,
        phoneNumber,
        normalizedMessage
      )

    // Nuevos casos para IA
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
        normalizedMessage
      )

    case ChatState.AI_EVENT_TEACHER_CREATE:
      return handleAIEventTeacherCreate(
        userStates,
        aiEventData,
        phoneNumber,
        normalizedMessage
      )

    case ChatState.AI_EVENT_VALIDATION:
      return handleAIEventValidation(
        userStates,
        aiEventData,
        phoneNumber,
        normalizedMessage
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
      const validationMessage = OpenAIService.buildValidationMessage(storedData.extraction)
      return WhatsAppService.sendTextMessage(phoneNumber, validationMessage)
    }
    return showSimplifiedSpecialMenu(userStates, phoneNumber)
  }

  const storedData = aiEventData.get(phoneNumber)
  if (!storedData) {
    return WhatsAppService.sendTextMessage(phoneNumber, '❌ Error al crear profesor')
  }

  // Si está en el estado inicial esperando 1 o 2
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

  // Si ya escribió un nombre
  const teacherName = normalizedMessage.trim()
  
  if (teacherName.length < 3) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❌ El nombre debe tener al menos 3 caracteres.

*Ejemplo:* Juan Pérez

_Envía "0" para volver_`
    )
  }

  // Crear profesor de una vez (one-time teacher)
  const selectedTeachers = storedData.selectedTeachers || []
  selectedTeachers.push({
    organizer_type: 'teacher',
    is_primary: selectedTeachers.length === 0,
    is_one_time_teacher: true,
    one_time_teacher_name: teacherName
  })

  // Verificar si hay más profesores por buscar
  const currentIndex = storedData.currentTeacherIndex || 0
  const nextIndex = currentIndex + 1
  
  if (storedData.teacherSearchResults && nextIndex < storedData.teacherSearchResults.length) {
    aiEventData.set(phoneNumber, {
      ...storedData,
      selectedTeachers,
      currentTeacherIndex: nextIndex
    })
    return await showTeacherSelectionForAIEvent(userStates, aiEventData, phoneNumber, nextIndex)
  } else {
    // Ya se procesaron todos, crear evento
    aiEventData.set(phoneNumber, {
      ...storedData,
      selectedTeachers
    })
    return await createEventFromAI(userStates, aiEventData, phoneNumber)
  }
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
      const validationMessage = OpenAIService.buildValidationMessage(storedData.extraction)
      return WhatsAppService.sendTextMessage(phoneNumber, validationMessage)
    }
    return showSimplifiedSpecialMenu(userStates, phoneNumber)
  }

  const storedData = aiEventData.get(phoneNumber)
  if (!storedData || !storedData.teacherSearchResults) {
    return WhatsAppService.sendTextMessage(phoneNumber, '❌ Error en la selección de profesor')
  }

  const currentIndex = storedData.currentTeacherIndex || 0
  const currentSearch = storedData.teacherSearchResults[currentIndex]
  const { searchedName, results } = currentSearch

  const selection = parseInt(normalizedMessage)

  if (isNaN(selection) || selection < 1 || selection > results.length + 1) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Número inválido. Elegí una opción del 1 al ${results.length + 1}.

_Envía "0" para volver_`
    )
  }

  // Si eligió "Ninguno, es otro profesor"
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

  // Profesor seleccionado de la lista
  const selectedTeacher = results[selection - 1]
  
  // Agregar a la lista de profesores seleccionados
  const selectedTeachers = storedData.selectedTeachers || []
  selectedTeachers.push({
    user_id: selectedTeacher.id,
    organizer_type: 'teacher',
    is_primary: selectedTeachers.length === 0, // El primero es primary
    is_one_time_teacher: false
  })

  // Verificar si hay más profesores por buscar
  const nextIndex = currentIndex + 1
  
  if (nextIndex < storedData.teacherSearchResults.length) {
    // Hay más profesores por confirmar
    aiEventData.set(phoneNumber, {
      ...storedData,
      selectedTeachers,
      currentTeacherIndex: nextIndex
    })
    return await showTeacherSelectionForAIEvent(userStates, aiEventData, phoneNumber, nextIndex)
  } else {
    // Ya se procesaron todos los profesores, crear el evento
    aiEventData.set(phoneNumber, {
      ...storedData,
      selectedTeachers
    })
    return await createEventFromAI(userStates, aiEventData, phoneNumber)
  }
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
      const validationMessage = OpenAIService.buildValidationMessage(storedData.extraction)
      return WhatsAppService.sendTextMessage(phoneNumber, validationMessage)
    }
    return showSimplifiedSpecialMenu(userStates, phoneNumber)
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

  // Buscar profesor en BD
  const results = await DatabaseService.searchTeachersByName(teacherName, 3)
  
  const storedData = aiEventData.get(phoneNumber)!
  aiEventData.set(phoneNumber, {
    ...storedData,
    teacherSearchResults: [{
      searchedName: teacherName,
      results: results
    }],
    currentTeacherIndex: 0
  })

  return await showTeacherSelectionForAIEvent(userStates, aiEventData, phoneNumber, 0)
}

// Nuevo menú simplificado
const showSimplifiedSpecialMenu = async (
  userStates: Map<string, ChatState>,
  phoneNumber: string
) => {
  userStates.set(phoneNumber, ChatState.SPECIAL_MENU)
  return WhatsAppService.sendTextMessage(
    phoneNumber,
    `📋 ¿Qué te gustaría hacer?

1 - Crear evento (describe todo en un mensaje)
2 - Crear profesor (otra persona)
3 - Modificar un evento

0 - Volver al menú principal`
  )
}

async function handleSpecialMenuOptions(
  userStates: Map<string, ChatState>,
  phoneNumber: string,
  normalizedMessage: string
) {
  if (['1', 'crear evento', 'evento'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.AI_EVENT_INPUT)
    return WhatsAppService.sendTextMessage(
      phoneNumber,
`🎭 *Crear evento con IA*

Describe tu evento lo más completo posible. Cuanta más información des, menos preguntas te haré después.

*Incluye:*
- Tipo (clase, milonga, seminario)
- Día y horario
- Lugar y dirección
- Profesor/organizador (opcional)
- Precio (opcional)

*Ejemplos:*

"Clase de tango principiantes todos los martes 20hs en UADE Magallanes 2025, la da Juan López, $5000"

"Milonga el sábado 21hs en La Trastienda con clase previa 19:30"

💡 No es necesario que esté perfecto, puedo ayudarte a completar lo que falte.

_Envía "0" para volver_`
    )
  } else if (['2', 'crear profesor', 'profesor'].includes(normalizedMessage)) {
    return startTeacherCreation(userStates, phoneNumber)
  } else if (['3', 'modificar'].includes(normalizedMessage)) {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `🛠️ Modificar evento (en desarrollo)...`
    )
  } else if (['0', 'volver', 'salir'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.MAIN_MENU)
    return WhatsAppService.sendTextMessage(phoneNumber, getMainMenuMessage())
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `❓ Opción inválida. Elegí una opción del menú (1-3) o "0" para volver al menú principal.`
    )
  }
}

// Nuevo manejador para entrada de IA
async function handleAIEventInput(
  userStates: Map<string, ChatState>,
  aiEventData: Map<string, AIEventDataStore>,
  phoneNumber: string,
  messageContent: string
) {
  if (messageContent.trim().toLowerCase() === '0') {
    userStates.set(phoneNumber, ChatState.SPECIAL_MENU);
    return showSimplifiedSpecialMenu(userStates, phoneNumber);
  }

  // ✅ VERIFICAR: Si ya existe data previa, podría ser una respuesta a followup
  const existingData = aiEventData.get(phoneNumber);
  
  if (existingData && existingData.extraction.needsHumanInput && existingData.extraction.followUpQuestions) {
    // El usuario está respondiendo a una pregunta de seguimiento
    console.log('🔄 Usuario respondiendo a pregunta de seguimiento');
    return handleAIEventCorrection(userStates, aiEventData, phoneNumber, messageContent);
  }

  // Es un evento nuevo
  const user = await DatabaseService.getUserByPhone(phoneNumber);
  const context = {
    userPhone: phoneNumber,
    isTeacher: user?.role === 'teacher',
    userName: user?.name
  };

  await WhatsAppService.sendTextMessage(phoneNumber, `🤖 Procesando tu evento...`);

  const extraction = await OpenAIService.extractEventData(messageContent, context);
  
  console.log('📊 Extraction result:', JSON.stringify(extraction, null, 2));

  aiEventData.set(phoneNumber, {
    extraction,
    originalInput: messageContent
  });

  if (extraction.confidence < 30 || extraction.needsHumanInput) {
    let followUpMessage = extraction.validationMessage + '\n\n';

    if (extraction.followUpQuestions && extraction.followUpQuestions.length > 0) {
      followUpMessage += '*Ayúdame respondiendo:*\n';
      extraction.followUpQuestions.forEach((question, index) => {
        followUpMessage += `${index + 1}. ${question}\n`;
      });
    }

    followUpMessage += '\n_Envía "0" para volver_';

    return WhatsAppService.sendTextMessage(phoneNumber, followUpMessage);
  }

  const validationMessage = OpenAIService.buildValidationMessage(extraction);
  userStates.set(phoneNumber, ChatState.AI_EVENT_VALIDATION);

  return WhatsAppService.sendTextMessage(phoneNumber, validationMessage);
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
    // No se encontró ningún profesor con ese nombre
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

  // Mostrar opciones de profesores encontrados
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

  // Si es clase o seminario y no hay profesores mencionados
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

  // Si hay profesores mencionados, buscarlos en la BD
  if (teacherNames.length > 0) {
    const teacherSearchResults = []

    for (const teacherName of teacherNames) {
      const results = await DatabaseService.searchTeachersByName(teacherName, 3) // Top 3 matches
      teacherSearchResults.push({
        searchedName: teacherName,
        results: results
      })
    }

    // Guardar resultados en el storedData
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

  // Si no es clase ni seminario, crear directamente
  return await createEventFromAI(userStates, aiEventData, phoneNumber)
}

// Manejador para validación de evento IA
async function handleAIEventValidation(
  userStates: Map<string, ChatState>,
  aiEventData: Map<string, AIEventDataStore>,
  phoneNumber: string,
  normalizedMessage: string
) {
  if (normalizedMessage === '0') {
    aiEventData.delete(phoneNumber)
    userStates.set(phoneNumber, ChatState.SPECIAL_MENU)
    return showSimplifiedSpecialMenu(userStates, phoneNumber)
  }

  const storedData = aiEventData.get(phoneNumber)
  if (!storedData) {
    userStates.set(phoneNumber, ChatState.SPECIAL_MENU)
    return showSimplifiedSpecialMenu(userStates, phoneNumber)
  }

  if (['1', 'si', 'sí', 'confirmo', 'crear'].includes(normalizedMessage)) {
    const { extractedData } = storedData.extraction
    const missingCritical: string[] = []
    
    // Validar campos críticos obligatorios
    if (!extractedData.event_type) missingCritical.push('tipo de evento')
    if (!extractedData.title) missingCritical.push('título')
    if (!extractedData.venue_name) missingCritical.push('nombre del lugar')
    if (!extractedData.address) missingCritical.push('dirección')
    if (!extractedData.date) missingCritical.push('fecha')
    
    // Validar formato de fecha
    if (extractedData.date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(extractedData.date)) {
        missingCritical.push('fecha en formato válido (YYYY-MM-DD)')
      }
    }
    
    // Validar horarios según tipo de evento
    if (extractedData.event_type === 'class') {
      if (!extractedData.classes || extractedData.classes.length === 0) {
        missingCritical.push('horario de clase')
      } else {
        // Validar que cada clase tenga start_time
        const classesWithoutTime = extractedData.classes.filter(cls => !cls.start_time)
        if (classesWithoutTime.length > 0) {
          missingCritical.push('horario de inicio de la clase')
        }
      }
    }
    
    if (extractedData.event_type === 'milonga') {
      // Para milongas puede haber práctica o pre_class
      const hasPractice = extractedData.practice && extractedData.practice.practice_time
      const hasPreClass = extractedData.pre_class && extractedData.pre_class.milonga_start_time
      
      if (!hasPractice && !hasPreClass) {
        missingCritical.push('horario de inicio de la milonga')
      }
    }
    
    if (extractedData.event_type === 'seminar') {
      if (!extractedData.classes || extractedData.classes.length === 0) {
        missingCritical.push('horarios del seminario')
      }
    }
    
    // Validar profesor para clases y seminarios
    if ((extractedData.event_type === 'class' || extractedData.event_type === 'seminar')) {
      const hasTeacherNames = storedData.extraction.teacherNames && 
                              storedData.extraction.teacherNames.length > 0
      
      if (!hasTeacherNames) {
        missingCritical.push('nombre del profesor')
      }
    }
    
    // Si faltan datos críticos, pedir que los complete
    if (missingCritical.length > 0) {
      return WhatsAppService.sendTextMessage(
        phoneNumber,
        `❌ Faltan estos datos críticos:

${missingCritical.map(m => `• ${m}`).join('\n')}

Por favor, proporciona esta información:

*Ejemplo:*
"La fecha es el martes 15 de octubre a las 20hs en UADE, lo da Juan Pérez"

_Envía "0" para cancelar_`
      )
    }
    
    // Todos los datos críticos están presentes, buscar profesores
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

// Manejador para correcciones
async function handleAIEventCorrection(
  userStates: Map<string, ChatState>,
  aiEventData: Map<string, AIEventDataStore>,
  phoneNumber: string,
  messageContent: string
) {
  if (messageContent.trim().toLowerCase() === '0') {
    userStates.set(phoneNumber, ChatState.AI_EVENT_VALIDATION);
    const storedData = aiEventData.get(phoneNumber);
    if (storedData) {
      const validationMessage = OpenAIService.buildValidationMessage(storedData.extraction);
      return WhatsAppService.sendTextMessage(phoneNumber, validationMessage);
    }
    return showSimplifiedSpecialMenu(userStates, phoneNumber);
  }

  const storedData = aiEventData.get(phoneNumber);
  if (!storedData) {
    userStates.set(phoneNumber, ChatState.SPECIAL_MENU);
    return showSimplifiedSpecialMenu(userStates, phoneNumber);
  }

  // ✅ DETECTAR: Si el usuario está respondiendo una pregunta específica de profesor
  const isTeacherResponse = storedData.extraction.missingFields?.includes('teacher_name') &&
                            storedData.extraction.followUpQuestions?.some(q => 
                              q.toLowerCase().includes('profesor') || q.toLowerCase().includes('teacher')
                            );

  if (isTeacherResponse) {
    // Actualizar directamente con el nombre del profesor
    console.log('👨‍🏫 Detectado nombre de profesor:', messageContent);
    
    const updatedExtraction = {
      ...storedData.extraction,
      teacherNames: [messageContent.trim()],
      missingFields: storedData.extraction.missingFields.filter(f => f !== 'teacher_name'),
      needsHumanInput: false,
      followUpQuestions: []
    };
    
    aiEventData.set(phoneNumber, {
      ...storedData,
      extraction: updatedExtraction
    });
    
    // Mostrar validación con el nuevo dato
    const validationMessage = OpenAIService.buildValidationMessage(updatedExtraction);
    userStates.set(phoneNumber, ChatState.AI_EVENT_VALIDATION);
    
    return WhatsAppService.sendTextMessage(phoneNumber, validationMessage);
  }

  // Si no es una respuesta de profesor, usar OpenAI para procesar correcciones
  await WhatsAppService.sendTextMessage(phoneNumber, `🤖 Procesando correcciones...`);

  const updatedExtraction = await OpenAIService.continueDiagnosticConversation(
    storedData.originalInput,
    storedData.extraction,
    messageContent
  );

  aiEventData.set(phoneNumber, {
    ...storedData,
    extraction: updatedExtraction
  });

  const validationMessage = OpenAIService.buildValidationMessage(updatedExtraction);
  userStates.set(phoneNumber, ChatState.AI_EVENT_VALIDATION);

  return WhatsAppService.sendTextMessage(phoneNumber, validationMessage);
}

// Crear evento desde extracción IA

async function createEventFromAI(
  userStates: Map<string, ChatState>,
aiEventData: Map<string, AIEventDataStore>,

  phoneNumber: string
): Promise<any> {
  const storedData = aiEventData.get(phoneNumber)
  if (!storedData) {
    return WhatsAppService.sendTextMessage(phoneNumber, '❌ Error: No se encontraron datos del evento')
  }

  const { extraction, selectedTeachers } = storedData
  const extractedData = extraction.extractedData

  try {
    // Validar datos mínimos requeridos
    if (!extractedData.event_type || !extractedData.title || !extractedData.venue_name || !extractedData.address || !extractedData.date) {
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

    // Preparar datos para crear evento
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
      pre_class: extractedData.pre_class,
      pricing: extractedData.pricing,
      organizers: selectedTeachers || [], // CAMBIO: usar profesores seleccionados
      
      reminder_phone: extractedData.has_weekly_recurrence ? phoneNumber : undefined,
      contact_phone: phoneNumber
    }

    // Crear el evento
    const newEvent = await DatabaseService.createTangoEvent(phoneNumber, eventData)

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

async function handleMainMenuOptions(
  userStates: Map<string, ChatState>,
  phoneNumber: string,
  normalizedMessage: string
) {
  if (['1', 'hoy'].includes(normalizedMessage)) {
    return caseToday(userStates, tempEventData, phoneNumber)
  } else if (['2', 'semana'].includes(normalizedMessage)) {
    return caseWeek(userStates, tempEventData, phoneNumber)
  } else if (['3'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.MENU_18_35)
    return WhatsAppService.sendTextMessage(phoneNumber, `En proceso...`)
  } else if (['4'].includes(normalizedMessage)) {
    userStates.set(phoneNumber, ChatState.MENU_REPORT)
    return WhatsAppService.sendTextMessage(phoneNumber, `En proceso...`)
  } else {
    return WhatsAppService.sendTextMessage(
      phoneNumber,
      `No entendí. Por favor elegí una opción del menú con el número correspondiente.

${getMainMenuMessage()}`
    )
  }
}


