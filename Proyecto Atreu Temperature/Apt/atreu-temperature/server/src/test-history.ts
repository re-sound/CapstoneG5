import { supabaseAdmin } from "./supabase.js";

/**
 * Script para verificar el historial de procesos en Supabase
 */

async function testProcessHistory() {
  console.log("🧪 Verificando historial de procesos...");
  
  try {
    // 1. Obtener todos los procesos del historial
    const { data: history, error } = await supabaseAdmin
      .from('process_history')
      .select(`
        *,
        started_by_user:started_by (user_id, full_name, email),
        ended_by_user:ended_by (user_id, full_name, email)
      `)
      .order('ended_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error("❌ Error obteniendo historial:", error);
      return;
    }

    console.log(`📊 Encontrados ${history.length} procesos en el historial:`);
    console.log("");

    history.forEach((entry, index) => {
      console.log(`📋 Proceso ${index + 1}:`);
      console.log(`   ID: ${entry.id}`);
      console.log(`   Túnel: ${entry.tunnel_id}`);
      console.log(`   Fruta: ${entry.fruit}`);
      console.log(`   Temperaturas: ${entry.min_temp}°C - ${entry.max_temp}°C`);
      console.log(`   Iniciado: ${entry.started_at}`);
      console.log(`   Finalizado: ${entry.ended_at}`);
      console.log(`   Duración: ${entry.duration_minutes} minutos`);
      console.log(`   Iniciado por: ${entry.started_by_user?.full_name || 'N/A'} (${entry.started_by_user?.user_id || 'N/A'})`);
      console.log(`   Finalizado por: ${entry.ended_by_user?.full_name || 'N/A'} (${entry.ended_by_user?.user_id || 'N/A'})`);
      console.log(`   Descripción: ${entry.description || 'N/A'}`);
      console.log("");
    });

    // 2. Verificar procesos activos
    console.log("🔍 Verificando procesos activos...");
    const { data: activeProcesses, error: activeError } = await supabaseAdmin
      .from('processes')
      .select('*')
      .in('status', ['running', 'paused'])
      .order('created_at', { ascending: false });

    if (activeError) {
      console.error("❌ Error obteniendo procesos activos:", activeError);
      return;
    }

    console.log(`🟢 Procesos activos: ${activeProcesses.length}`);
    activeProcesses.forEach(process => {
      console.log(`   Túnel ${process.tunnel_id}: ${process.status} (${process.fruit})`);
    });

  } catch (error) {
    console.error("❌ Error en la prueba:", error);
  }
}

// Ejecutar prueba
testProcessHistory().then(() => {
  console.log("🏁 Verificación completada");
  process.exit(0);
}).catch(error => {
  console.error("💥 Error fatal:", error);
  process.exit(1);
});
