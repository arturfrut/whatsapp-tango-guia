import axios from 'axios';
import { WhatsAppOutgoingMessage } from '../types';

function getWhatsAppApi() {
  const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
  const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;

  if (!META_ACCESS_TOKEN || !META_PHONE_NUMBER_ID) {
    throw new Error('Missing Meta WhatsApp API environment variables');
  }

  return axios.create({
    baseURL: `https://graph.facebook.com/v18.0/${META_PHONE_NUMBER_ID}`,
    headers: {
      'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
}

export class WhatsAppService {
  
  // Enviar mensaje de texto simple
  static async sendTextMessage(to: string, text: string): Promise<boolean> {
    try {
      const message: WhatsAppOutgoingMessage = {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: {
          body: text
        }
      };
      const whatsappApi = getWhatsAppApi();
      const response = await whatsappApi.post('/messages', message);
      
      console.log(`✅ Message sent to ${to}:`, response.data);
      return true;
    } catch (error: any) {
      console.error(`❌ Error sending message to ${to}:`, error.response?.data || error.message);
      return false;
    }
  }

  // Enviar mensaje con botones (para futuro uso)
  static async sendButtonMessage(to: string, bodyText: string, buttons: Array<{id: string, title: string}>): Promise<boolean> {
    try {
      const message: WhatsAppOutgoingMessage = {
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: bodyText
          },
          action: {
            buttons: buttons.map(btn => ({
              type: 'reply',
              reply: {
                id: btn.id,
                title: btn.title
              }
            }))
          }
        }
      };
      const whatsappApi = getWhatsAppApi();
      const response = await whatsappApi.post('/messages', message);
      
      console.log(`✅ Button message sent to ${to}:`, response.data);
      return true;
    } catch (error: any) {
      console.error(`❌ Error sending button message to ${to}:`, error.response?.data || error.message);
      return false;
    }
  }

  // Marcar mensaje como leído
  static async markAsRead(messageId: string): Promise<boolean> {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      };
      const whatsappApi = getWhatsAppApi();
      await whatsappApi.post('/messages', payload);
      return true;
    } catch (error: any) {
      console.error('❌ Error marking message as read:', error.response?.data || error.message);
      return false;
    }
  }
}