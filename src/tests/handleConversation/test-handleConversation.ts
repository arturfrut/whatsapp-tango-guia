import dotenv from 'dotenv';
dotenv.config();

console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Loaded' : 'Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Loaded' : 'Missing');

import { handleConversation } from "../../routes/ConversationRouter"

async function testCompleteFlow() {
  console.log('=== TEST CONVERSATION ROUTER ===')
  
  await handleConversation('+5491234567890', 'Hola')
  
  console.log('✅ ConversationRouter integrado exitosamente')
}

testCompleteFlow()