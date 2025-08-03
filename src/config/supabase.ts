import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;



if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('❌ Variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no definidas');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Función para testear la conexión
export async function testSupabaseConnection(): Promise<boolean> {
  if (!supabase) {
    console.error('❌ El cliente de Supabase no se pudo inicializar. Faltan variables de entorno.');
    return false;
  }
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return false;
  }
}