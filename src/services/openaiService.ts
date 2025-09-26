import OpenAI from 'openai';
import { NewEventData, EventType, ClassLevel, AIEventExtraction } from '../types/processTangoConversation';
import { parseDate, parseTime } from '../routes/processTangoConversation/utils';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export class OpenAIService {
  
  static async extractEventData(userInput: string, context?: {
    userPhone: string,
    isTeacher: boolean,
    userName?: string
  }): Promise<AIEventExtraction> {
    try {
      console.log('🤖 Calling OpenAI with input:', userInput);
      
      const prompt = this.buildExtractionPrompt(userInput, context);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Eres un asistente especializado en extraer información de eventos de tango en Mar del Plata, Argentina. Siempre respondes en JSON válido."
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });
      
      const response = completion.choices[0]?.message?.content;
      console.log('🤖 OpenAI raw response:', response);
      
      if (!response) {
        throw new Error('No response from OpenAI');
      }
      
      return this.parseOpenAIResponse(response, userInput);
      
    } catch (error) {
      console.error('❌ Error calling OpenAI:', error);
      return {
        extractedData: {},
        confidence: 0,
        missingFields: ['Error de procesamiento'],
        validationMessage: 'Error al procesar la solicitud. Por favor intenta nuevamente.',
        needsHumanInput: true,
        followUpQuestions: ['¿Podrías describir nuevamente tu evento?']
      };
    }
  }

  private static buildExtractionPrompt(userInput: string, context?: any): string {
    const today = new Date().toISOString().split('T')[0];
    
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

HORARIOS:
- "20hs" = "20:00"
- "8 y media" = "20:30"
- "de 20 a 21" = start_time: "20:00", end_time: "21:00"

RESPONDE SOLO ESTE JSON (sin markdown, sin explicaciones):
{
  "event_type": "class|milonga|seminar|special_event",
  "title": "título generado basado en el tipo y contenido",
  "venue_name": "nombre del lugar", 
  "address": "dirección completa",
  "date": "YYYY-MM-DD",
  "has_weekly_recurrence": boolean,
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
`;
  }

  private static parseOpenAIResponse(response: string, originalInput: string): AIEventExtraction {
    try {
      // Limpiar respuesta de markdown si existe
      const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const parsedResponse = JSON.parse(cleanResponse);
      
      // Validar y normalizar las fechas y horarios
      const extractedData: Partial<NewEventData> = {};
      
      if (parsedResponse.event_type) {
        extractedData.event_type = parsedResponse.event_type as EventType;
      }
      
      if (parsedResponse.title) {
        extractedData.title = parsedResponse.title;
      }
      
      if (parsedResponse.venue_name) {
        extractedData.venue_name = parsedResponse.venue_name;
      }
      
      if (parsedResponse.address) {
        extractedData.address = parsedResponse.address;
      }
      
      if (parsedResponse.date) {
        // Validar fecha usando la función existente
        const validDate = parseDate(parsedResponse.date);
        if (validDate) {
          extractedData.date = validDate;
        } else {
          // Si la fecha no es válida, intentar parsearlo como está
          extractedData.date = parsedResponse.date;
        }
      }
      
      if (parsedResponse.has_weekly_recurrence !== undefined) {
        extractedData.has_weekly_recurrence = parsedResponse.has_weekly_recurrence;
      }
      
      if (parsedResponse.description) {
        extractedData.description = parsedResponse.description;
      }
      
      if (parsedResponse.show_description) {
        extractedData.show_description = parsedResponse.show_description;
      }
      
      // Procesar clases
      if (parsedResponse.classes && Array.isArray(parsedResponse.classes)) {
        extractedData.classes = parsedResponse.classes.map((cls: any) => ({
          start_time: parseTime(cls.start_time) || cls.start_time,
          end_time: cls.end_time ? (parseTime(cls.end_time) || cls.end_time) : undefined,
          class_level: cls.class_level as ClassLevel,
          class_name: cls.class_name
        }));
      }
      
      // Procesar práctica
      if (parsedResponse.practice && parsedResponse.practice.practice_time) {
        extractedData.practice = {
          practice_time: parseTime(parsedResponse.practice.practice_time) || parsedResponse.practice.practice_time,
          practice_end_time: parsedResponse.practice.practice_end_time
        };
      }
      
      // Procesar pre-clase de milonga
      if (parsedResponse.pre_class) {
        extractedData.pre_class = {
          class_time: parseTime(parsedResponse.pre_class.class_time) || parsedResponse.pre_class.class_time,
          milonga_start_time: parseTime(parsedResponse.pre_class.milonga_start_time) || parsedResponse.pre_class.milonga_start_time,
          class_end_time: parsedResponse.pre_class.class_end_time,
          class_level: parsedResponse.pre_class.class_level as ClassLevel
        };
      }
      
      return {
        extractedData,
        confidence: parsedResponse.confidence || 0,
        missingFields: parsedResponse.missing_fields || [],
        validationMessage: parsedResponse.validation_message || 'Información extraída',
        needsHumanInput: parsedResponse.needs_human_input || false,
        followUpQuestions: parsedResponse.follow_up_questions || []
      };
      
    } catch (error) {
      console.error('❌ Error parsing OpenAI response:', error);
      console.error('Raw response was:', response);
      
      return {
        extractedData: {},
        confidence: 0,
        missingFields: ['Error de procesamiento'],
        validationMessage: 'No pude procesar tu mensaje. ¿Podrías ser más específico?',
        needsHumanInput: true,
        followUpQuestions: ['¿Qué tipo de evento quieres crear?', '¿Cuándo y dónde será?']
      };
    }
  }

  static async continueDiagnosticConversation(
    originalInput: string, 
    previousExtraction: AIEventExtraction,
    userResponse: string
  ): Promise<AIEventExtraction> {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Eres un asistente que actualiza información de eventos de tango basado en correcciones del usuario."
          },
          {
            role: "user", 
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
      });
      
      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }
      
      return this.parseOpenAIResponse(response, `${originalInput} + ${userResponse}`);
      
    } catch (error) {
      console.error('❌ Error in diagnostic conversation:', error);
      return previousExtraction; // Devolver lo que ya teníamos
    }
  }

  static buildValidationMessage(extraction: AIEventExtraction): string {
    const data = extraction.extractedData;
    
    if (Object.keys(data).length === 0) {
      return `❌ No pude entender tu mensaje.

¿Podrías describir tu evento de esta forma?:
"Crear [tipo] de [tema] el [día] a las [hora] en [lugar]"

*Ejemplo:* "Crear clase de tango principiantes el martes 20hs en UADE"`;
    }
    
    let message = `🎭 *CONFIRMA ESTOS DATOS:*\n\n`;
    
    const eventTypeNames = {
      class: 'Clase',
      milonga: 'Milonga', 
      seminar: 'Seminario',
      special_event: 'Evento Especial'
    };
    
    const levelNames = {
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      all_levels: 'Todos los niveles'
    };
    
    if (data.event_type) {
      message += `🎪 *Tipo:* ${eventTypeNames[data.event_type]}\n`;
    }
    
    if (data.title) {
      message += `📝 *Título:* ${data.title}\n`;
    }
    
    if (data.venue_name) {
      message += `🏢 *Lugar:* ${data.venue_name}\n`;
    }
    
    if (data.address) {
      message += `📍 *Dirección:* ${data.address}\n`;
    }
    
    if (data.date) {
      message += `📅 *Fecha:* ${data.date}\n`;
    }
    
    if (data.classes && data.classes.length > 0) {
      data.classes.forEach((cls, index) => {
        message += `🕐 *Horario ${index + 1}:* ${cls.start_time}`;
        if (cls.end_time) {
          message += ` - ${cls.end_time}`;
        }
        if (cls.class_level) {
          message += ` (${levelNames[cls.class_level]})`;
        }
        message += `\n`;
      });
    }
    
    if (data.practice) {
      message += `💃 *Práctica:* ${data.practice.practice_time}\n`;
    }
    
    if (data.pre_class) {
      message += `📚 *Clase previa:* ${data.pre_class.class_time}\n`;
      message += `🎵 *Milonga:* ${data.pre_class.milonga_start_time}\n`;
    }
    
    if (data.has_weekly_recurrence) {
      message += `🔄 *Se repite:* Semanalmente\n`;
    }
    
    if (data.description) {
      message += `💬 *Descripción:* ${data.description}\n`;
    }
    
    if (extraction.missingFields.length > 0) {
      message += `\n⚠️ *Faltan datos:* ${extraction.missingFields.join(', ')}\n`;
    }
    
    message += `\n¿Es correcto?`;
    message += `\n1 - ✅ Sí, crear evento`;
    message += `\n2 - ❌ Corregir algo`;
    
    return message;
  }
}