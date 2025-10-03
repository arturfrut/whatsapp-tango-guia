import OpenAI from 'openai'
import {
  NewEventData,
  EventType,
  ClassLevel,
  AIEventExtraction
} from '../types/processTangoConversation'
import { parseDate, parseTime } from '../routes/processTangoConversation/utils'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export class OpenAIService {
  static async extractEventData(
    userInput: string,
    context?: {
      userPhone: string
      isTeacher: boolean
      userName?: string
    }
  ): Promise<AIEventExtraction> {
    try {
      console.log('🤖 Calling OpenAI with input:', userInput)

      const prompt = this.buildExtractionPrompt(userInput, context)

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Eres un asistente especializado en extraer información de eventos de tango en Mar del Plata, Argentina. Siempre respondes en JSON válido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })

      const response = completion.choices[0]?.message?.content
      console.log('🤖 OpenAI raw response:', response)

      if (!response) {
        throw new Error('No response from OpenAI')
      }

      return this.parseOpenAIResponse(response, userInput)
    } catch (error) {
      console.error('❌ Error calling OpenAI:', error)
      return {
        extractedData: {},
        confidence: 0,
        missingFields: ['Error de procesamiento'],
        validationMessage:
          'Error al procesar la solicitud. Por favor intenta nuevamente.',
        needsHumanInput: true,
        followUpQuestions: ['¿Podrías describir nuevamente tu evento?']
      }
    }
  }

  private static buildExtractionPrompt(
    userInput: string,
    context?: any
  ): string {
    const today = new Date().toISOString().split('T')[0]

    return `
Extrae información de este evento de tango: "${userInput}"

FECHA ACTUAL: ${today}

LUGARES CONOCIDOS MAR DEL PLATA:
- UADE → Magallanes 2025, Mar del Plata
- Club Pueyrredón → Magallanes 2023, Mar del Plata  
- La Trastienda → Av. Constitución 4876, Mar del Plata
- Centro Cultural → Lorenzo de Zavalia 4014, Mar del Plata

DÍAS DE LA SEMANA (para eventos recurrentes):
- Si dice "todos los martes" → próximo martes + has_weekly_recurrence: true

MILONGA:
- Si menciona "milonga" → event_type: "milonga" + has_weekly_recurrence: false (las milongas son eventos únicos por defecto)

HORARIOS:
- "20hs" = "20:00"
- "8 y media" = "20:30"
- "de 20 a 21" = start_time: "20:00", end_time: "21:00"

PROFESOR (OBLIGATORIO para clases y seminarios):
- Extraer el nombre del profesor mencionado
- Si no se menciona ningún profesor, marcar como "missing_fields"

PRECIOS:
- Extraer información de precios si se menciona
- Formato: {description: "Descripción", price: número}
- Ejemplos: "5000 la clase", "entrada 8000", "clase y práctica 7000"
- Si dice "gratis" o "gratuito" → price: 0

RESPONDE SOLO ESTE JSON (sin markdown, sin explicaciones):
{
  "event_type": "class|milonga|seminar|special_event",
  "title": "título generado basado en el tipo y contenido",
  "venue_name": "nombre del lugar", 
  "address": "dirección completa",
  "date": "YYYY-MM-DD",
  "has_weekly_recurrence": boolean,
  "teacher_name": "nombre del profesor si se menciona (null si no)",
  "classes": [
    {
      "start_time": "HH:MM",
      "end_time": "HH:MM (opcional)",
      "class_level": "beginner|intermediate|advanced|all_levels (opcional)"
    }
  ],
  "practice": {
    "practice_time": "HH:MM"
  },
  "pre_class": {
    "class_time": "HH:MM",
    "milonga_start_time": "HH:MM"
  },
  "pricing": [
    {
      "price_type": "custom",
      "price": número,
      "description": "descripción del precio"
    }
  ],
  "description": "descripción opcional",
  "confidence": 0-100,
  "missing_fields": ["array de campos faltantes"],
  "validation_message": "mensaje descriptivo",
  "needs_human_input": boolean,
  "follow_up_questions": ["array de preguntas"]
}

REGLAS:
- Solo incluir datos que estés seguro al 80%+
- Si falta info crítica → confidence bajo + needs_human_input: true
- Generar título descriptivo basado en tipo y nivel
- Para eventos recurrentes, calcular próxima fecha
- Para CLASES y SEMINARIOS, el profesor es OBLIGATORIO
- Si no se menciona profesor en clase/seminario → agregar a "missing_fields" y "follow_up_questions"
- Milongas siempre tienen has_weekly_recurrence: false por defecto
`
  }

  private static parseOpenAIResponse(
    response: string,
    originalInput: string
  ): AIEventExtraction {
    try {
      const cleanResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      const parsedResponse = JSON.parse(cleanResponse)

      const extractedData: Partial<NewEventData> = {}

      if (parsedResponse.event_type) {
        extractedData.event_type = parsedResponse.event_type as EventType
      }

      if (parsedResponse.title) {
        extractedData.title = parsedResponse.title
      }

      if (parsedResponse.venue_name) {
        extractedData.venue_name = parsedResponse.venue_name
      }

      if (parsedResponse.address) {
        extractedData.address = parsedResponse.address
      }

      if (parsedResponse.date) {
        const validDate = parseDate(parsedResponse.date)
        if (validDate) {
          extractedData.date = validDate
        } else {
          extractedData.date = parsedResponse.date
        }
      }

      if (parsedResponse.has_weekly_recurrence !== undefined) {
        extractedData.has_weekly_recurrence =
          parsedResponse.has_weekly_recurrence
      }

      if (parsedResponse.description) {
        extractedData.description = parsedResponse.description
      }

      if (parsedResponse.show_description) {
        extractedData.show_description = parsedResponse.show_description
      }

      // ✅ ARREGLAR: Procesar clases solo si existe array con elementos
      if (
        parsedResponse.classes &&
        Array.isArray(parsedResponse.classes) &&
        parsedResponse.classes.length > 0
      ) {
        extractedData.classes = parsedResponse.classes
          .map((cls: any) => ({
            start_time: cls.start_time
              ? parseTime(cls.start_time) || cls.start_time
              : undefined,
            end_time: cls.end_time
              ? parseTime(cls.end_time) || cls.end_time
              : undefined,
            class_level: cls.class_level as ClassLevel,
            class_name: cls.class_name
          }))
          .filter((cls: any) => cls.start_time) // Solo incluir clases con horario válido
      }

      // ✅ ARREGLAR: Procesar práctica solo si tiene practice_time válido
      if (
        parsedResponse.practice &&
        typeof parsedResponse.practice === 'object' &&
        parsedResponse.practice.practice_time
      ) {
        const practiceTime =
          parseTime(parsedResponse.practice.practice_time) ||
          parsedResponse.practice.practice_time
        if (practiceTime) {
          extractedData.practice = {
            practice_time: practiceTime,
            practice_end_time: parsedResponse.practice.practice_end_time
              ? parseTime(parsedResponse.practice.practice_end_time) ||
                parsedResponse.practice.practice_end_time
              : undefined
          }
        }
      }

      // ✅ ARREGLAR: Procesar pre-clase solo si tiene horarios válidos
      if (
        parsedResponse.pre_class &&
        typeof parsedResponse.pre_class === 'object' &&
        (parsedResponse.pre_class.class_time ||
          parsedResponse.pre_class.milonga_start_time)
      ) {
        const preClass: any = {}

        if (parsedResponse.pre_class.class_time) {
          preClass.class_time =
            parseTime(parsedResponse.pre_class.class_time) ||
            parsedResponse.pre_class.class_time
        }

        if (parsedResponse.pre_class.milonga_start_time) {
          preClass.milonga_start_time =
            parseTime(parsedResponse.pre_class.milonga_start_time) ||
            parsedResponse.pre_class.milonga_start_time
        }

        if (parsedResponse.pre_class.class_end_time) {
          preClass.class_end_time =
            parseTime(parsedResponse.pre_class.class_end_time) ||
            parsedResponse.pre_class.class_end_time
        }

        if (parsedResponse.pre_class.class_level) {
          preClass.class_level = parsedResponse.pre_class
            .class_level as ClassLevel
        }

        // Solo agregar si tiene al menos un horario válido
        if (preClass.class_time || preClass.milonga_start_time) {
          extractedData.pre_class = preClass
        }
      }

      // ✅ AGREGAR: Procesar pricing
      if (
        parsedResponse.pricing &&
        Array.isArray(parsedResponse.pricing) &&
        parsedResponse.pricing.length > 0
      ) {
        extractedData.pricing = parsedResponse.pricing.map((price: any) => ({
          price_type: price.price_type || 'custom',
          price: price.price,
          description: price.description
        }))
      }

      // ✅ AGREGAR: Extraer nombres de profesores
      const teacherNames: string[] = []
      if (parsedResponse.teacher_name) {
        if (
          typeof parsedResponse.teacher_name === 'string' &&
          parsedResponse.teacher_name.trim()
        ) {
          teacherNames.push(parsedResponse.teacher_name.trim())
        } else if (Array.isArray(parsedResponse.teacher_name)) {
          parsedResponse.teacher_name.forEach((name: string) => {
            if (typeof name === 'string' && name.trim()) {
              teacherNames.push(name.trim())
            }
          })
        }
      }

      return {
        extractedData,
        teacherNames,
        confidence: parsedResponse.confidence || 0,
        missingFields: parsedResponse.missing_fields || [],
        validationMessage:
          parsedResponse.validation_message || 'Información extraída',
        needsHumanInput: parsedResponse.needs_human_input || false,
        followUpQuestions: parsedResponse.follow_up_questions || []
      }
    } catch (error) {
      console.error('❌ Error parsing OpenAI response:', error)
      console.error('Raw response was:', response)

      return {
        extractedData: {},
        teacherNames: [],
        confidence: 0,
        missingFields: ['Error de procesamiento'],
        validationMessage:
          'No pude procesar tu mensaje. ¿Podrías ser más específico?',
        needsHumanInput: true,
        followUpQuestions: [
          '¿Qué tipo de evento quieres crear?',
          '¿Cuándo y dónde será?'
        ]
      }
    }
  }

  static async continueDiagnosticConversation(
    originalInput: string,
    previousExtraction: AIEventExtraction,
    userResponse: string
  ): Promise<AIEventExtraction> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'Eres un asistente que actualiza información de eventos de tango basado en correcciones del usuario.'
          },
          {
            role: 'user',
            content: `
INFORMACIÓN ORIGINAL: "${originalInput}"

DATOS EXTRAÍDOS PREVIAMENTE:
${JSON.stringify(previousExtraction.extractedData, null, 2)}

CORRECCIÓN DEL USUARIO: "${userResponse}"

Actualiza la información combinando los datos previos con las correcciones.
Responde en el mismo formato JSON que antes, pero con la información actualizada.
Mantén los datos que no fueron corregidos.
`
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from OpenAI')
      }

      return this.parseOpenAIResponse(
        response,
        `${originalInput} + ${userResponse}`
      )
    } catch (error) {
      console.error('❌ Error in diagnostic conversation:', error)
      return previousExtraction // Devolver lo que ya teníamos
    }
  }

  static buildValidationMessage(extraction: AIEventExtraction): string {
    const data = extraction.extractedData

    if (Object.keys(data).length === 0) {
      return `❌ No pude entender tu mensaje.

¿Podrías describir tu evento de esta forma?:
"Crear [tipo] de [tema] el [día] a las [hora] en [lugar]"

*Ejemplo:* "Crear clase de tango principiantes el martes 20hs en UADE"`
    }

    let message = `🎭 *CONFIRMA ESTOS DATOS:*\n\n`

    const eventTypeNames = {
      class: 'Clase',
      milonga: 'Milonga',
      seminar: 'Seminario',
      special_event: 'Evento Especial'
    }

    const levelNames = {
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      all_levels: 'Todos los niveles'
    }

    if (data.event_type) {
      message += `🎪 *Tipo:* ${eventTypeNames[data.event_type]}\n`
    }

    if (data.title) {
      message += `📝 *Título:* ${data.title}\n`
    }

    if (data.venue_name) {
      message += `🏢 *Lugar:* ${data.venue_name}\n`
    }

    if (data.address) {
      message += `📍 *Dirección:* ${data.address}\n`
    }

    if (data.date) {
      message += `📅 *Fecha:* ${data.date}\n`
    }

    if (data.classes && data.classes.length > 0) {
      data.classes.forEach((cls, index) => {
        message += `🕐 *Horario ${index + 1}:* ${cls.start_time}`
        if (cls.end_time) {
          message += ` - ${cls.end_time}`
        }
        if (cls.class_level) {
          message += ` (${levelNames[cls.class_level]})`
        }
        message += `\n`
      })
    }

    if (data.practice) {
      message += `💃 *Práctica:* ${data.practice.practice_time}\n`
    }

    if (data.pre_class) {
      message += `📚 *Clase previa:* ${data.pre_class.class_time}\n`
      message += `🎵 *Milonga:* ${data.pre_class.milonga_start_time}\n`
    }

    if (data.has_weekly_recurrence) {
      message += `🔄 *Se repite:* Semanalmente\n`
    }

    if (data.description) {
      message += `💬 *Descripción:* ${data.description}\n`
    }
    if (extraction.teacherNames && extraction.teacherNames.length > 0) {
      message += `👨‍🏫 *Profesor${
        extraction.teacherNames.length > 1 ? 'es' : ''
      }:* ${extraction.teacherNames.join(', ')}\n`
    }

    if (extraction.missingFields.length > 0) {
      message += `\n⚠️ *Faltan datos:* ${extraction.missingFields.join(', ')}\n`
    }

    message += `\n¿Es correcto?`
    message += `\n1 - ✅ Sí, crear evento`
    message += `\n2 - ❌ Corregir algo`

    return message
  }
}
