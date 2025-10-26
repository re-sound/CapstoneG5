import { supabaseAdmin } from "./supabase.js";

/**
 * Script simple para probar la conexión y crear un proceso
 */

async function testSimple() {
  console.log("🧪 Prueba simple de conexión y creación...");
  
  try {
    // 1. Probar conexión
    console.log("🔍 Probando conexión a Supabase...");
    const { data: testData, error: testError } = await supabaseAdmin
      .from('users')
      .select('id, user_id')
      .limit(1);

    if (testError) {
      console.error("❌ Error de conexión:", testError);
      return;
    }

    console.log("✅ Conexión exitosa");
    console.log("👤 Usuario encontrado:", testData[0]);

    // 2. Verificar si hay procesos existentes
    console.log("\n🔍 Verificando procesos existentes...");
    const { data: existingProcesses, error: processError } = await supabaseAdmin
      .from('processes')
      .select('*')
      .limit(5);

    if (processError) {
      console.error("❌ Error obteniendo procesos:", processError);
      return;
    }

    console.log(`📊 Procesos existentes: ${existingProcesses.length}`);
    existingProcesses.forEach((p, i) => {
      console.log(`   ${i + 1}. Túnel ${p.tunnel_id} - ${p.status} - ${p.fruit}`);
    });

    // 3. Intentar crear un proceso de prueba
    console.log("\n🔄 Creando proceso de prueba...");
    const now = new Date().toISOString();
    const testUserId = testData[0].id;

    const { data: newProcess, error: createError } = await supabaseAdmin
      .from('processes')
      .insert({
        tunnel_id: 2,
        status: 'running',
        fruit: 'Pera Williams',
        min_temp: 2.0,
        max_temp: 8.0,
        ideal_min: 3.0,
        ideal_max: 7.0,
        started_at: now,
        ended_at: null,
        started_by: testUserId,
        ended_by: null,
        measure_plan: 20,
        destination: 'Mercado Central',
        origin: 'Hacienda San José',
        condition_initial: 'Fruta recién cosechada',
        description: 'Proceso de prueba directo',
        state_label: 'En curso',
        last_change: now
      })
      .select()
      .single();

    if (createError) {
      console.error("❌ Error creando proceso:", createError);
      return;
    }

    console.log("✅ Proceso creado exitosamente:");
    console.log(`   ID: ${newProcess.id}`);
    console.log(`   Túnel: ${newProcess.tunnel_id}`);
    console.log(`   Estado: ${newProcess.status}`);
    console.log(`   Fruta: ${newProcess.fruit}`);

    // 4. Intentar crear entrada en historial
    console.log("\n🔄 Creando entrada en historial...");
    const { data: historyEntry, error: historyError } = await supabaseAdmin
      .from('process_history')
      .insert({
        tunnel_id: 2,
        fruit: 'Pera Williams',
        min_temp: 2.0,
        max_temp: 8.0,
        ideal_min: 3.0,
        ideal_max: 7.0,
        started_at: now,
        ended_at: now,
        started_by: testUserId,
        ended_by: testUserId,
        measure_plan: 20,
        destination: 'Mercado Central',
        origin: 'Hacienda San José',
        condition_initial: 'Fruta recién cosechada',
        description: 'Proceso de prueba directo',
        duration_minutes: 0
      })
      .select()
      .single();

    if (historyError) {
      console.error("❌ Error creando historial:", historyError);
      return;
    }

    console.log("✅ Historial creado exitosamente:");
    console.log(`   ID: ${historyEntry.id}`);
    console.log(`   Túnel: ${historyEntry.tunnel_id}`);
    console.log(`   Duración: ${historyEntry.duration_minutes} minutos`);

  } catch (error) {
    console.error("❌ Error en la prueba:", error);
  }
}

// Ejecutar prueba
testSimple().then(() => {
  console.log("🏁 Prueba completada");
  process.exit(0);
}).catch(error => {
  console.error("💥 Error fatal:", error);
  process.exit(1);
});
