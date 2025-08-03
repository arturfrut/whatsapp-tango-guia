
import { supabase } from '../config/supabase';
import { User, Message } from '../types';

export class DatabaseService {

  
  
  // =============================================
  // USUARIOS
  // =============================================
  
  static async getOrCreateUser(phoneNumber: string): Promise<User | null> {
    try {
      // Primero intentamos obtener el usuario
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

      // Si no existe, lo creamos como usuario normal
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

  // =============================================
  // MENSAJES
  // =============================================
  
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

  // =============================================
  // UTILIDADES
  // =============================================
  
  static async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('❌ Database connection test failed:', error);
        return false;
      }
      
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection test error:', error);
      return false;
    }
  }
}