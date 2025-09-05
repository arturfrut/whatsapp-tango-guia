import { supabase } from '../config/supabase';
import { 
  User, 
  TangoEvent, 
  NewEventData,
  CompleteEventData 
} from '../types/processTangoConversation';
import { Event, EventSchedule, EventTeacher } from '../types';
import bcrypt from 'bcrypt';

export class DatabaseService {
  // =============================================
  // USER METHODS
  // =============================================
  
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

  static async getUserByPhone(phoneNumber: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('is_active', true)
        .is('deleted_at', null)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error getting user by phone:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception getting user by phone:', error);
      return null;
    }
  }

   static async createTeacherProfile(
    phoneNumber: string,
    teacherData: {
      name: string;
      details?: string;
    }
  ): Promise<User | null> {
    try {
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
      console.error('❌ Error in createTeacherProfile:', error);
      return null;
    }
  }

  static async createTeacher(
    phoneNumber: string,
    teacherData: {
      name: string;
      password: string;
      details: string;
    }
  ): Promise<User | null> {
    console.warn('⚠️ Using legacy createTeacher method. Please migrate to createTeacherProfile.');
    
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

  static async searchTeachersByName(searchTerm: string, limit: number = 10): Promise<Partial<User>[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, phone_number, details')
        .eq('role', 'teacher')
        .eq('is_active', true)
        .is('deleted_at', null)
        .ilike('name', `%${searchTerm}%`)
        .order('name')
        .limit(limit);

      if (error) {
        console.error('Error searching teachers by name:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception searching teachers by name:', error);
      return [];
    }
  }

  static async getAllActiveTeachers(limit: number = 20): Promise<Partial<User>[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, phone_number, details')
        .eq('role', 'teacher')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('name')
        .limit(limit);

      if (error) {
        console.error('Error getting all active teachers:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception getting all active teachers:', error);
      return [];
    }
  }

  static async createPlaceholderTeacher(): Promise<User | null> {
    try {
      const timestamp = Date.now();
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
        .single();

      if (error) {
        console.error('Error creating placeholder teacher:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception creating placeholder teacher:', error);
      return null;
    }
  }

  // =============================================
  // NEW TANGO EVENT METHODS
  // =============================================
  
  static async createTangoEvent(
    creatorPhone: string,
    eventData: NewEventData
  ): Promise<TangoEvent | null> {
    try {
      const creator = await this.getUserByPhone(creatorPhone);
      if (!creator) {
        console.error('Creator not found:', creatorPhone);
        return null;
      }

      // Start transaction - Create main event
      const { data: newEvent, error: eventError } = await supabase
        .from('tango_events')
        .insert({
          title: eventData.title!,
          event_type: eventData.event_type!,
          description: eventData.description,
          venue_name: eventData.venue_name!,
          address: eventData.address!,
          contact_phone: eventData.contact_phone,
          reminder_phone: eventData.reminder_phone,
          date: eventData.date!,
          has_weekly_recurrence: eventData.has_weekly_recurrence || false,
          show_description: eventData.show_description,
          is_active: true,
          created_by: creator.id
        })
        .select()
        .single();

      if (eventError) {
        console.error('Error creating tango event:', eventError);
        return null;
      }

      // Create event classes
      if (eventData.classes && eventData.classes.length > 0) {
        const classInserts = eventData.classes.map((cls, index) => ({
          event_id: newEvent.id,
          class_name: cls.class_name,
          start_time: cls.start_time,
          end_time: cls.end_time,
          class_level: cls.class_level,
          class_order: index + 1
        }));

        const { error: classError } = await supabase
          .from('event_classes')
          .insert(classInserts);

        if (classError) {
          console.error('Error creating event classes:', classError);
        }
      }

      // Create practice session
      if (eventData.practice) {
        const { error: practiceError } = await supabase
          .from('event_practices')
          .insert({
            event_id: newEvent.id,
            practice_time: eventData.practice.practice_time,
            practice_end_time: eventData.practice.practice_end_time
          });

        if (practiceError) {
          console.error('Error creating practice session:', practiceError);
        }
      }

      if (eventData.pre_class) {
        const { error: preClassError } = await supabase
          .from('milonga_pre_classes')
          .insert({
            event_id: newEvent.id,
            class_time: eventData.pre_class.class_time,
            class_end_time: eventData.pre_class.class_end_time,
            class_level: eventData.pre_class.class_level,
            milonga_start_time: eventData.pre_class.milonga_start_time
          });

        if (preClassError) {
          console.error('Error creating pre-class:', preClassError);
        }
      }

      if (eventData.organizers && eventData.organizers.length > 0) {
        const organizerInserts = eventData.organizers.map(org => ({
          event_id: newEvent.id,
          user_id: org.user_id,
          organizer_type: org.organizer_type,
          is_primary: org.is_primary,
          is_one_time_teacher: org.is_one_time_teacher,
          one_time_teacher_name: org.one_time_teacher_name
        }));

        const { error: organizerError } = await supabase
          .from('event_organizers')
          .insert(organizerInserts);

        if (organizerError) {
          console.error('Error creating event organizers:', organizerError);
        }
      }

      if (eventData.pricing && eventData.pricing.length > 0) {
        const pricingInserts = eventData.pricing.map(price => ({
          event_id: newEvent.id,
          price_type: price.price_type,
          price: price.price,
          description: price.description
        }));

        const { error: pricingError } = await supabase
          .from('event_pricing')
          .insert(pricingInserts);

        if (pricingError) {
          console.error('Error creating event pricing:', pricingError);
        }
      }

      if (eventData.seminar_days && eventData.seminar_days.length > 0) {
        for (const seminarDay of eventData.seminar_days) {
          const { data: newSeminarDay, error: seminarDayError } = await supabase
            .from('seminar_days')
            .insert({
              event_id: newEvent.id,
              day_number: seminarDay.day_number,
              date: seminarDay.date,
              theme: seminarDay.theme
            })
            .select()
            .single();

          if (seminarDayError) {
            console.error('Error creating seminar day:', seminarDayError);
            continue;
          }

          if (seminarDay.classes && seminarDay.classes.length > 0) {
            const seminarClassInserts = seminarDay.classes.map((cls, index) => ({
              seminar_day_id: newSeminarDay.id,
              class_name: cls.class_name,
              start_time: cls.start_time,
              end_time: cls.end_time,
              class_level: cls.class_level,
              class_order: index + 1
            }));

            const { error: seminarClassError } = await supabase
              .from('seminar_day_classes')
              .insert(seminarClassInserts);

            if (seminarClassError) {
              console.error('Error creating seminar day classes:', seminarClassError);
            }
          }
        }
      }

      console.log(`✅ Tango event created successfully: ${newEvent.id}`);
      return newEvent;

    } catch (error) {
      console.error('❌ Exception creating tango event:', error);
      return null;
    }
  }

  static async getTangoEventById(eventId: string): Promise<CompleteEventData | null> {
    try {
      const { data: event, error: eventError } = await supabase
        .from('tango_events')
        .select('*')
        .eq('id', eventId)
        .eq('is_active', true)
        .is('deleted_at', null)
        .single();

      if (eventError || !event) {
        console.error('Error getting tango event:', eventError);
        return null;
      }

      const completeEvent: CompleteEventData = { ...event };

      const { data: classes } = await supabase
        .from('event_classes')
        .select('*')
        .eq('event_id', eventId)
        .order('class_order');

      if (classes) {
        completeEvent.classes = classes;
      }

      const { data: practice } = await supabase
        .from('event_practices')
        .select('*')
        .eq('event_id', eventId)
        .single();

      if (practice) {
        completeEvent.practice = practice;
      }

      const { data: organizers } = await supabase
        .from('event_organizers')
        .select(`
          *,
          user:user_id (
            id,
            name,
            phone_number
          )
        `)
        .eq('event_id', eventId);

      if (organizers) {
        completeEvent.organizers = organizers;
      }

      const { data: pricing } = await supabase
        .from('event_pricing')
        .select('*')
        .eq('event_id', eventId);

      if (pricing) {
        completeEvent.pricing = pricing;
      }

      const { data: preClass } = await supabase
        .from('milonga_pre_classes')
        .select('*')
        .eq('event_id', eventId)
        .single();

      if (preClass) {
        completeEvent.milonga_pre_class = preClass;
      }

      const { data: seminarDays } = await supabase
        .from('seminar_days')
        .select(`
          *,
          seminar_day_classes (*)
        `)
        .eq('event_id', eventId)
        .order('day_number');

      if (seminarDays) {
        completeEvent.seminar_days = seminarDays.map(day => ({
          ...day,
          classes: day.seminar_day_classes || []
        }));
      }

      return completeEvent;

    } catch (error) {
      console.error('❌ Exception getting tango event:', error);
      return null;
    }
  }

  static async getTangoEventsByDate(date: string): Promise<CompleteEventData[]> {
    try {
      const { data: events, error } = await supabase
        .from('tango_events')
        .select('*')
        .eq('date', date)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('created_at');

      if (error) {
        console.error('Error getting events by date:', error);
        return [];
      }

      const completeEvents = await Promise.all(
        events.map(event => this.getTangoEventById(event.id))
      );

      return completeEvents.filter(event => event !== null) as CompleteEventData[];

    } catch (error) {
      console.error('Exception getting events by date:', error);
      return [];
    }
  }

  static async getTangoEventsByDateRange(startDate: string, endDate: string): Promise<CompleteEventData[]> {
    try {
      const { data: events, error } = await supabase
        .from('tango_events')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error getting events by date range:', error);
        return [];
      }

      const completeEvents = await Promise.all(
        events.map(event => this.getTangoEventById(event.id))
      );

      return completeEvents.filter(event => event !== null) as CompleteEventData[];

    } catch (error) {
      console.error('Exception getting events by date range:', error);
      return [];
    }
  }

  static async updateTangoEvent(
    eventId: string,
    updateData: Partial<TangoEvent>
  ): Promise<TangoEvent | null> {
    try {
      const { data: updatedEvent, error } = await supabase
        .from('tango_events')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId)
        .select()
        .single();

      if (error) {
        console.error('Error updating tango event:', error);
        return null;
      }

      console.log(`✅ Tango event updated: ${eventId}`);
      return updatedEvent;

    } catch (error) {
      console.error('Exception updating tango event:', error);
      return null;
    }
  }

  static async deactivateTangoEvent(eventId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tango_events')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (error) {
        console.error('Error deactivating tango event:', error);
        return false;
      }

      console.log(`✅ Tango event deactivated: ${eventId}`);
      return true;

    } catch (error) {
      console.error('Exception deactivating tango event:', error);
      return false;
    }
  }

  static async deleteTangoEvent(eventId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tango_events')
        .update({
          deleted_at: new Date().toISOString(),
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (error) {
        console.error('Error deleting tango event:', error);
        return false;
      }

      console.log(`✅ Tango event deleted: ${eventId}`);
      return true;

    } catch (error) {
      console.error('Exception deleting tango event:', error);
      return false;
    }
  }

  static async getTangoEventsByOrganizer(userId: string): Promise<CompleteEventData[]> {
    try {
      const { data: organizerEvents, error } = await supabase
        .from('event_organizers')
        .select('event_id')
        .eq('user_id', userId);

      if (error || !organizerEvents) {
        console.error('Error getting organizer events:', error);
        return [];
      }

      const eventIds = organizerEvents.map(org => org.event_id);
      
      if (eventIds.length === 0) {
        return [];
      }

      const { data: events, error: eventsError } = await supabase
        .from('tango_events')
        .select('*')
        .in('id', eventIds)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('date', { ascending: true });

      if (eventsError) {
        console.error('Error getting events:', eventsError);
        return [];
      }

      const completeEvents = await Promise.all(
        events.map(event => this.getTangoEventById(event.id))
      );

      return completeEvents.filter(event => event !== null) as CompleteEventData[];

    } catch (error) {
      console.error('Exception getting events by organizer:', error);
      return [];
    }
  }

  // =============================================
  // LEGACY METHODS FOR COMPATIBILITY
  // =============================================
  
  static async createEvent(
    creatorPhone: string,
    eventData: any
  ): Promise<Event | null> {
    console.warn('⚠️ Using legacy createEvent method. Please migrate to createTangoEvent.');
    
    try {
      const creator = await this.getUserByPhone(creatorPhone);
      if (!creator) {
        console.error('Creator not found:', creatorPhone);
        return null;
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
          created_by: creator.id,
          is_active: true
        })
        .select()
        .single();

      if (eventError) {
        console.error('Error creating event:', eventError);
        return null;
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
        });

      if (scheduleError) {
        console.error('Error creating event schedule:', scheduleError);
        return null;
      }
      
      if (eventData.instructor_id) {
        const { error: teacherError } = await supabase
          .from('event_teachers')
          .insert({
            event_id: newEvent.id,
            teacher_id: eventData.instructor_id,
            is_primary_teacher: true
          });

        if (teacherError) {
          console.error('Error assigning teacher to event:', teacherError);
          return null;
        }

        if (eventData.instructor_id !== creator.id) {
          console.log(
            `TODO ENVIAR MENSAJE A PROFESOR ORIGINAL: ${eventData.instructor_id}`
          );
        }
      }

      return newEvent;
    } catch (error) {
      console.error('Exception creating event:', error);
      return null;
    }
  }

  static async createEventSchedule(
    eventId: string,
    scheduleData: {
      start_date: string;
      start_time: string;
      end_time?: string;
      recurrence_pattern: string;
      days_of_week?: string[] | null;
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

  // =============================================
  // MESSAGE LOGGING METHODS
  // =============================================
  
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
      const { error } = await supabase.from('messages').insert({
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