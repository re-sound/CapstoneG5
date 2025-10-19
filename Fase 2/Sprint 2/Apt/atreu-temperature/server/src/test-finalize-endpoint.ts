import { supabaseAdmin } from "./supabase.js";

/**
 * Script para probar el endpoint de finalizar proceso
 */

async function testFinalizeEndpoint() {
  console.log("🧪 Probando endpoint de finalizar proceso...");
  
  try {
    // 1. Buscar un proceso activo
    console.log("🔍 Buscando procesos activos...");
    const { data: activeProcesses, error: processError } = await supabaseAdmin
      .from('processes')
      .select('*')
      .in('status', ['running', 'paused'])
      .limit(1);

    if (processError) {
      console.error("❌ Error obteniendo procesos:", processError);
      return;
    }

    if (!activeProcesses || activeProcesses.length === 0) {
      console.log("❌ No hay procesos activos para finalizar");
      return;
    }

    const process = activeProcesses[0];
    console.log(`📋 Proceso encontrado: ${process.id} (Túnel ${process.tunnel_id})`);

    // 2. Simular llamada al endpoint de finalizar
    console.log("🔄 Simulando llamada al endpoint...");
    
    const tunnelId = process.tunnel_id;
    const now = new Date().toISOString();
    const userId = "9c5b533e-4483-433b-b498-855ccbcf3643"; // ID del usuario admin

    // Crear entrada en historial
    console.log("📝 Creando entrada en process_history...");
    const { data: historyEntry, error: historyError } = await supabaseAdmin
      .from('process_history')
      .insert({
        tunnel_id: tunnelId,
        fruit: process.fruit,
        min_temp: process.min_temp,
        max_temp: process.max_temp,
        ideal_min: process.ideal_min,
        ideal_max: process.ideal_max,
        started_at: process.started_at || now,
        ended_at: now,
        started_by: process.started_by,
        ended_by: userId,
        measure_plan: process.measure_plan,
        destination: process.destination,
        origin: process.origin,
        condition_initial: process.condition_initial,
        description: process.description,
        duration_minutes: process.started_at ? 
          Math.round((new Date(now).getTime() - new Date(process.started_at).getTime()) / (1000 * 60)) : 
          null
      })
      .select()
      .single();

    if (historyError) {
      console.error("❌ Error creando historial:", historyError);
      return;
    }

    console.log("✅ Historial creado:", historyEntry.id);

    // 3. Actualizar proceso a finished
    console.log("🔄 Actualizando proceso a finished...");
    const { data: updatedProcess, error: updateError } = await supabaseAdmin
      .from('processes')
      .update({
        status: 'finished',
        ended_at: now,
        ended_by: userId,
        last_change: now
      })
      .eq('id', process.id)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Error actualizando proceso:", updateError);
      return;
    }

    console.log("✅ Proceso actualizado:", updatedProcess.status);

    // 4. Verificar que ya no aparece como activo
    console.log("🔍 Verificando que ya no aparece como activo...");
    const { data: checkProcess, error: checkError } = await supabaseAdmin
      .from('processes')
      .select('*')
      .eq('id', process.id)
      .single();

    if (checkError) {
      console.error("❌ Error verificando proceso:", checkError);
      return;
    }

    console.log(`✅ Estado final del proceso: ${checkProcess.status}`);
    console.log(`✅ Fecha de finalización: ${checkProcess.ended_at}`);

  } catch (error) {
    console.error("❌ Error en la prueba:", error);
  }
}

// Ejecutar prueba
testFinalizeEndpoint().then(() => {
  console.log("🏁 Prueba completada");
  process.exit(0);
}).catch(error => {
  console.error("💥 Error fatal:", error);
  process.exit(1);
});
