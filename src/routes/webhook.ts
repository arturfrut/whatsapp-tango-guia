import crypto from 'crypto';
import { Request, Response, Router } from 'express';
import { WhatsAppService } from '../services/whatsapp';
import { WhatsAppIncomingMessage, WhatsAppWebhookEntry } from '../types';
import { normalizePhoneNumber } from '../utils/normalizePhoneNumber';
import { handleConversation } from './processTangoConversation';

const router = Router();

// =============================================
// VERIFICACIÓN DEL WEBHOOK (GET)
// =============================================

router.get('/', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('🔍 Webhook verification request:', { mode, token });

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed');
    res.status(403).send('Verification failed');
  }
});

// =============================================
// RECEPCIÓN DE MENSAJES (POST)
// =============================================

router.post('/', async (req: Request, res: Response) => {
  try {
    // Verificar firma del webhook (seguridad)
    const signature = req.headers['x-hub-signature-256'] as string;
    if (!verifyWebhookSignature(req.body, signature)) {
      console.log('❌ Invalid webhook signature');
      return res.status(403).send('Invalid signature');
    }

    console.log('📨 Webhook received:', JSON.stringify(req.body, null, 2));

    const entry: WhatsAppWebhookEntry = req.body.entry?.[0];
    
    if (!entry) {
      console.log('⚠️ No entry found in webhook');
      return res.status(200).send('OK');
    }

    const changes = entry.changes?.[0];
    const messages = changes?.value?.messages;

    if (!messages || messages.length === 0) {
      console.log('⚠️ No messages found in webhook');
      return res.status(200).send('OK');
    }

    // Procesar cada mensaje
    for (const message of messages) {
      await processIncomingMessage(message);
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return res.status(500).send('Internal server error');
  }
});

// =============================================
// FUNCIONES AUXILIARES
// =============================================

function verifyWebhookSignature(payload: any, signature: string): boolean {
  if (!process.env.META_WEBHOOK_SECRET || !signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.META_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  const expectedSignatureWithPrefix = `sha256=${expectedSignature}`;
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignatureWithPrefix)
  );
}

async function processIncomingMessage(message: WhatsAppIncomingMessage) {
  const phoneNumber = normalizePhoneNumber(message.from) ;
  console.log(`📱 Processing message from: ${phoneNumber}`);

  try {
    // 1. Crear o obtener usuario
    // const user = await DatabaseService.getOrCreateUser(phoneNumber);
    // if (!user) {
    //   console.error('❌ Could not create/get user');
    //   return;
    // }

    // 2. Extraer contenido del mensaje
    let messageContent = '';
    if (message.type === 'text' && message.text) {
      messageContent = message.text.body;
    } else if (message.type === 'interactive' && message.interactive) {
      if (message.interactive.button_reply) {
        messageContent = message.interactive.button_reply.title;
      } else if (message.interactive.list_reply) {
        messageContent = message.interactive.list_reply.title;
      }
    }

    // 3. Guardar mensaje en base de datos
    // await DatabaseService.saveIncomingMessage(
    //   phoneNumber,
    //   message.type,
    //   messageContent,
    //   message.id
    // );

    // 4. Marcar como leído
    await WhatsAppService.markAsRead(message.id);

    // 5. CONVERSACIÓN
    await handleConversation(phoneNumber, messageContent);

  } catch (error) {
    console.error('❌ Error processing message:', error);
  }
}

export default router;