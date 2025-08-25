import { supabase } from '../config/supabase'
import { User, Event, EventSchedule, EventTeacher } from '../types'
import bcrypt from 'bcrypt'

export class DatabaseService {
  static async getOrCreateUser(phoneNumber: string): Promise<User | null> {
    try {
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('is_active', true)
        .single()

      if (existingUser && !fetchError) {
        console.log(`✅ User found: ${phoneNumber}`)
        return existingUser
      }

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          phone_number: phoneNumber,
          role: 'normal_query',
          is_active: true
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Error creating user:', createError)
        return null
      }

      console.log(`✅ User created: ${phoneNumber}`)
      return newUser
    } catch (error) {
      console.error('❌ Error in getOrCreateUser:', error)
      return null
    }
  }

  static async createTeacher(
    phoneNumber: string,
    teacherData: {
      name: string
      password: string
      details: string
    }
  ): Promise<User | null> {
    try {
      const saltRounds = 10
      const passwordHash = await bcrypt.hash(teacherData.password, saltRounds)

      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single()

      if (existingUser) {
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            role: 'teacher',
            name: teacherData.name,
            password_hash: passwordHash,
            details: teacherData.details,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('phone_number', phoneNumber)
          .select()
          .single()

        if (updateError) {
          console.error('❌ Error updating user to teacher:', updateError)
          return null
        }

        console.log(`✅ User updated to teacher: ${phoneNumber}`)
        return updatedUser
      } else {
        const { data: newTeacher, error: createError } = await supabase
          .from('users')
          .insert({
            phone_number: phoneNumber,
            role: 'teacher',
            name: teacherData.name,
            password_hash: passwordHash,
            details: teacherData.details,
            is_active: true
          })
          .select()
          .single()

        if (createError) {
          console.error('❌ Error creating teacher:', createError)
          return null
        }

        console.log(`✅ Teacher created: ${phoneNumber}`)
        return newTeacher
      }
    } catch (error) {
      console.error('❌ Error in createTeacher:', error)
      return null
    }
  }

  static async createEvent(
    creatorPhone: string,
    eventData: any
  ): Promise<Event | null> {
    try {
      const creator = await this.getUserByPhone(creatorPhone)
      if (!creator) {
        console.error('Creator not found:', creatorPhone)
        return null
      }
      const { data: newEvent, error: eventError } = await supabase
        .from('events')
        .insert({
          event_type: eventData.event_type,
          title: eventData.title,
          description: eventData.description,
          class_level: eventData.class_level,
          price: eventData.price,
          address: eventData.address,
          created_by: creator.id, // Quien creó el evento
          is_active: true
        })
        .select()
        .single()

      if (eventError) {
        console.error('Error creating event:', eventError)
        return null
      }
      const { error: scheduleError } = await supabase
        .from('event_schedules')
        .insert({
          event_id: newEvent.id,
          start_date: eventData.date,
          start_time: eventData.time,
          recurrence_pattern: eventData.has_recurrence ? 'weekly' : 'none',
          days_of_week:
            eventData.has_recurrence && eventData.day_of_week
              ? [eventData.day_of_week]
              : null
        })

      if (scheduleError) {
        console.error('Error creating event schedule:', scheduleError)
        return null
      }
      if (eventData.instructor_id) {
        const { error: teacherError } = await supabase
          .from('event_teachers')
          .insert({
            event_id: newEvent.id,
            teacher_id: eventData.instructor_id,
            is_primary_teacher: true
          })

        if (teacherError) {
          console.error('Error assigning teacher to event:', teacherError)
          return null
        }

        if (eventData.instructor_id !== creator.id) {
          console.log(
            `TODO ENVIAR MENSAJE A PROFESOR ORIGINAL: ${eventData.instructor_id}`
          )
        }
      }

      return newEvent
    } catch (error) {
      console.error('Exception creating event:', error)
      return null
    }
  }

  static async createEventSchedule(
    eventId: string,
    scheduleData: {
      start_date: string
      start_time: string
      end_time?: string
      recurrence_pattern: string
      days_of_week?: string[] | null
    }
  ): Promise<EventSchedule | null> {
    try {
      const { data: newSchedule, error } = await supabase
        .from('event_schedules')
        .insert({
          event_id: eventId,
          start_date: scheduleData.start_date,
          end_date: null,
          start_time: scheduleData.start_time,
          end_time: scheduleData.end_time || null,
          timezone: 'America/Argentina/Buenos_Aires',
          recurrence_pattern: scheduleData.recurrence_pattern,
          recurrence_rule: null,
          days_of_week: scheduleData.days_of_week,
          ends_at: null
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating event schedule:', error)
        return null
      }

      console.log(`✅ Event schedule created for event: ${eventId}`)
      return newSchedule
    } catch (error) {
      console.error('❌ Error in createEventSchedule:', error)
      return null
    }
  }

  static async assignTeacherToEvent(
    eventId: string,
    teacherId: string,
    isPrimary: boolean = false
  ): Promise<EventTeacher | null> {
    try {
      const { data: assignment, error } = await supabase
        .from('event_teachers')
        .insert({
          event_id: eventId,
          teacher_id: teacherId,
          is_primary_teacher: isPrimary
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error assigning teacher to event:', error)
        return null
      }

      console.log(`✅ Teacher assigned to event: ${eventId}`)
      return assignment
    } catch (error) {
      console.error('❌ Error in assignTeacherToEvent:', error)
      return null
    }
  }

  static async saveIncomingMessage(
    phoneNumber: string,
    messageType: string,
    content: string,
    metaMessageId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from('messages').insert({
        phone_number: phoneNumber,
        direction: 'inbound',
        message_type: messageType,
        content: content,
        meta_message_id: metaMessageId,
        status: 'read',
        ai_processed: false,
        timestamp: new Date().toISOString()
      })

      if (error) {
        console.error('❌ Error saving incoming message:', error)
        return false
      }

      console.log(`✅ Incoming message saved: ${phoneNumber}`)
      return true
    } catch (error) {
      console.error('❌ Error in saveIncomingMessage:', error)
      return false
    }
  }

  static async getUserByPhone(phoneNumber: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('is_active', true)
        .is('deleted_at', null)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error getting user by phone:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Exception getting user by phone:', error)
      return null
    }
  }

  static async searchTeachersByName(searchTerm: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, phone_number, details')
        .eq('role', 'teacher')
        .eq('is_active', true)
        .is('deleted_at', null)
        .ilike('name', `%${searchTerm}%`)
        .order('name')
        .limit(limit)

      if (error) {
        console.error('Error searching teachers by name:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Exception searching teachers by name:', error)
      return []
    }
  }

  static async getAllActiveTeachers(limit: number = 20) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, phone_number, details')
        .eq('role', 'teacher')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('name')
        .limit(limit)

      if (error) {
        console.error('Error getting all active teachers:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Exception getting all active teachers:', error)
      return []
    }
  }

  static async createPlaceholderTeacher() {
    try {
      const timestamp = Date.now()
      const { data, error } = await supabase
        .from('users')
        .insert({
          name: 'Profesor a confirmar',
          phone_number: `temp_${timestamp}`,
          role: 'teacher',
          details: 'Profesor pendiente de confirmación',
          is_active: true
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating placeholder teacher:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Exception creating placeholder teacher:', error)
      return null
    }
  }

  static async saveOutgoingMessage(
    phoneNumber: string,
    messageType: string,
    content: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from('messages').insert({
        phone_number: phoneNumber,
        direction: 'outbound',
        message_type: messageType,
        content: content,
        status: 'sent',
        ai_processed: false,
        timestamp: new Date().toISOString()
      })

      if (error) {
        console.error('❌ Error saving outgoing message:', error)
        return false
      }

      console.log(`✅ Outgoing message saved: ${phoneNumber}`)
      return true
    } catch (error) {
      console.error('❌ Error in saveOutgoingMessage:', error)
      return false
    }
  }
}
