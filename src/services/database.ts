import { supabase } from '../config/supabase';
import { User, Event, EventSchedule, EventTeacher } from '../types';
import bcrypt from 'bcrypt';

export class DatabaseService {


  static async getOrCreateUser(phoneNumber: string): Promise<User | null> {
    try {
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('is_active', true)
        .single();

      if (existingUser && !fetchError) {
        console.log(`✅ User found: ${phoneNumber}`);
        return existingUser;
      }

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          phone_number: phoneNumber,
          role: 'normal_query',
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating user:', createError);
        return null;
      }

      console.log(`✅ User created: ${phoneNumber}`);
      return newUser;
    } catch (error) {
      console.error('❌ Error in getOrCreateUser:', error);
      return null;
    }
  }

  static async createTeacher(phoneNumber: string, teacherData: {
    name: string
    password: string
    details: string
  }): Promise<User | null> {
    try {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(teacherData.password, saltRounds);

      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

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
          .single();

        if (updateError) {
          console.error('❌ Error updating user to teacher:', updateError);
          return null;
        }

        console.log(`✅ User updated to teacher: ${phoneNumber}`);
        return updatedUser;
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
          .single();

        if (createError) {
          console.error('❌ Error creating teacher:', createError);
          return null;
        }

        console.log(`✅ Teacher created: ${phoneNumber}`);
        return newTeacher;
      }
    } catch (error) {
      console.error('❌ Error in createTeacher:', error);
      return null;
    }
  }

  static async createEvent(phoneNumber: string, eventData: {
    event_type: string
    title: string
    description?: string
    class_level?: string
    price?: number
    address: string
    date: string
    time: string
    has_recurrence: boolean
    day_of_week?: string
  }): Promise<Event | null> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('phone_number', phoneNumber)
        .single();

      if (!user) {
        console.error('❌ User not found for event creation:', phoneNumber);
        return null;
      }

      const { data: newEvent, error: eventError } = await supabase
        .from('events')
        .insert({
          title: eventData.title,
          event_type: eventData.event_type,
          description: eventData.description || null,
          class_level: eventData.class_level || null,
          price: eventData.price || null,
          address: eventData.address,
          has_limited_capacity: false,
          max_capacity: null,
          current_attendees: 0,
          attendance_tracking: false,
          is_active: true,
          created_by: user.id
        })
        .select()
        .single();

      if (eventError) {
        console.error('❌ Error creating event:', eventError);
        return null;
      }

      const scheduleResult = await this.createEventSchedule(newEvent.id, {
        start_date: eventData.date,
        start_time: eventData.time,
        recurrence_pattern: eventData.has_recurrence ? 'weekly' : 'none',
        days_of_week: eventData.day_of_week ? [eventData.day_of_week] : null
      });

      if (!scheduleResult) {
        console.error('❌ Error creating event schedule');
        await supabase.from('events').delete().eq('id', newEvent.id);
        return null;
      }

      const teacherResult = await this.assignTeacherToEvent(newEvent.id, user.id, true);
      
      if (!teacherResult) {
        console.error('❌ Error assigning teacher to event');
      }

      console.log(`✅ Event created successfully: ${newEvent.title}`);
      return newEvent;
    } catch (error) {
      console.error('❌ Error in createEvent:', error);
      return null;
    }
  }

  static async createEventSchedule(eventId: string, scheduleData: {
    start_date: string
    start_time: string
    end_time?: string
    recurrence_pattern: string
    days_of_week?: string[] | null
  }): Promise<EventSchedule | null> {
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
        .single();

      if (error) {
        console.error('❌ Error creating event schedule:', error);
        return null;
      }

      console.log(`✅ Event schedule created for event: ${eventId}`);
      return newSchedule;
    } catch (error) {
      console.error('❌ Error in createEventSchedule:', error);
      return null;
    }
  }

  static async assignTeacherToEvent(eventId: string, teacherId: string, isPrimary: boolean = false): Promise<EventTeacher | null> {
    try {
      const { data: assignment, error } = await supabase
        .from('event_teachers')
        .insert({
          event_id: eventId,
          teacher_id: teacherId,
          is_primary_teacher: isPrimary
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error assigning teacher to event:', error);
        return null;
      }

      console.log(`✅ Teacher assigned to event: ${eventId}`);
      return assignment;
    } catch (error) {
      console.error('❌ Error in assignTeacherToEvent:', error);
      return null;
    }
  }

  static async saveIncomingMessage(
    phoneNumber: string, 
    messageType: string, 
    content: string, 
    metaMessageId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          phone_number: phoneNumber,
          direction: 'inbound',
          message_type: messageType,
          content: content,
          meta_message_id: metaMessageId,
          status: 'read',
          ai_processed: false,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Error saving incoming message:', error);
        return false;
      }

      console.log(`✅ Incoming message saved: ${phoneNumber}`);
      return true;
    } catch (error) {
      console.error('❌ Error in saveIncomingMessage:', error);
      return false;
    }
  }

  static async saveOutgoingMessage(
    phoneNumber: string, 
    messageType: string, 
    content: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          phone_number: phoneNumber,
          direction: 'outbound',
          message_type: messageType,
          content: content,
          status: 'sent',
          ai_processed: false,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Error saving outgoing message:', error);
        return false;
      }

      console.log(`✅ Outgoing message saved: ${phoneNumber}`);
      return true;
    } catch (error) {
      console.error('❌ Error in saveOutgoingMessage:', error);
      return false;
    }
  }

}