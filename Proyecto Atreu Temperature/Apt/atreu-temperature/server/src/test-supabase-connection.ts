import { supabase, supabaseAdmin } from './supabase.js';

/**
 * Script para probar la conexión a Supabase
 */

async function testSupabaseConnection() {
  console.log("🧪 Probando conexión a Supabase...");
  
  try {
    // 1. Probar conexión básica
    console.log("🔍 Probando conexión básica...");
    const { data: tunnels, error: tunnelsError } = await supabase
      .from('tunnels')
      .select('*')
      .limit(1);

    if (tunnelsError) {
      console.error("❌ Error en conexión básica:", tunnelsError);
      return;
    }

    console.log("✅ Conexión básica exitosa:", tunnels);

    // 2. Probar conexión admin
    console.log("🔍 Probando conexión admin...");
    const { data: processes, error: processesError } = await supabaseAdmin
      .from('processes')
      .select('*')
      .limit(1);

    if (processesError) {
      console.error("❌ Error en conexión admin:", processesError);
      return;
    }

    console.log("✅ Conexión admin exitosa:", processes);

    // 3. Probar inserción (solo si no hay datos)
    console.log("🔍 Probando inserción...");
    const { data: testData, error: insertError } = await supabaseAdmin
      .from('processes')
      .insert({
        tunnel_id: 1,
        fruit: 'MANZANA',
        min_temp: 0,
        max_temp: 10,
        ideal_min: 2,
        ideal_max: 8,
        status: 'running',
        started_at: new Date().toISOString(),
        started_by: 'test'
      })
      .select()
      .single();

    if (insertError) {
      console.error("❌ Error en inserción:", insertError);
      return;
    }

    console.log("✅ Inserción exitosa:", testData);

    // 4. Limpiar datos de prueba
    console.log("🔍 Limpiando datos de prueba...");
    const { error: deleteError } = await supabaseAdmin
      .from('processes')
      .delete()
      .eq('id', testData.id);

    if (deleteError) {
      console.error("❌ Error limpiando datos:", deleteError);
      return;
    }

    console.log("✅ Datos de prueba eliminados");

  } catch (error) {
    console.error("❌ Error en la prueba:", error);
  }
}

// Ejecutar prueba
testSupabaseConnection().then(() => {
  console.log("🏁 Prueba completada");
  process.exit(0);
}).catch(error => {
  console.error("💥 Error fatal:", error);
  process.exit(1);
});
