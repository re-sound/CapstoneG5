const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = 'https://bspnwhogpxjkxitrlnug.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcG53aG9ncHhqa3hpdHJsbnVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MjU5NDgsImV4cCI6MjA3NjIwMTk0OH0.M3tnLYkVtGT_BaieiC1e2H6cFlq4yseWxzexSywMG8w'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('🔍 Probando conexión con Supabase...')
  
  try {
    // Probar conexión básica
    const { data, error } = await supabase
      .from('tuneles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Error de conexión:', error.message)
      return
    }
    
    console.log('✅ Conexión exitosa con Supabase')
    
    // Probar obtener túneles
    const { data: tuneles, error: tunelesError } = await supabase
      .from('tuneles')
      .select('*')
      .limit(5)
    
    if (tunelesError) {
      console.error('❌ Error obteniendo túneles:', tunelesError.message)
      return
    }
    
    console.log('✅ Túneles obtenidos:', tuneles.length)
    console.log('📊 Datos de túneles:', tuneles)
    
  } catch (err) {
    console.error('❌ Error general:', err.message)
  }
}

testConnection()