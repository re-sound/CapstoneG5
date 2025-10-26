import { supabase } from './supabase.js';

async function testConnection() {
  console.log('🔍 Probando conexión a Supabase...');
  
  try {
    // Probar conexión básica
    const { data, error } = await supabase
      .from('tunnels')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Error de conexión:', error.message);
      return false;
    }
    
    console.log('✅ Conexión a Supabase exitosa!');
    console.log('📊 Datos recibidos:', data);
    return true;
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return false;
  }
}

testConnection();
