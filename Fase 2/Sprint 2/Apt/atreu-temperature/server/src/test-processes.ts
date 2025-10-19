import { supabaseAdmin } from "./supabase.js";

/**
 * Script para verificar todos los procesos en Supabase
 */

async function testProcesses() {
  console.log("🧪 Verificando todos los procesos...");
  
  try {
    // 1. Obtener todos los procesos
    const { data: allProcesses, error } = await supabaseAdmin
      .from('processes')
      .select(`
        *,
        started_by_user:started_by (user_id, full_name, email),
        ended_by_user:ended_by (user_id, full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("❌ Error obteniendo procesos:", error);
      return;
    }

    console.log(`📊 Total de procesos en la base de datos: ${allProcesses.length}`);
    console.log("");

    // 2. Mostrar todos los procesos
    allProcesses.forEach((process, index) => {
      console.log(`📋 Proceso ${index + 1}:`);
      console.log(`   ID: ${process.id}`);
      console.log(`   Túnel: ${process.tunnel_id}`);
      console.log(`   Estado: ${process.status}`);
      console.log(`   Fruta: ${process.fruit}`);
      console.log(`   Temperaturas: ${process.min_temp}°C - ${process.max_temp}°C`);
      console.log(`   Iniciado: ${process.started_at}`);
      console.log(`   Finalizado: ${process.ended_at || 'N/A'}`);
      console.log(`   Iniciado por: ${process.started_by_user?.full_name || 'N/A'} (${process.started_by_user?.user_id || 'N/A'})`);
      console.log(`   Finalizado por: ${process.ended_by_user?.full_name || 'N/A'} (${process.ended_by_user?.user_id || 'N/A'})`);
      console.log(`   Descripción: ${process.description || 'N/A'}`);
      console.log(`   Creado: ${process.created_at}`);
      console.log("");
    });

    // 3. Contar por estado
    const runningCount = allProcesses.filter(p => p.status === 'running').length;
    const pausedCount = allProcesses.filter(p => p.status === 'paused').length;
    const finishedCount = allProcesses.filter(p => p.status === 'finished').length;

    console.log("📈 Resumen por estado:");
    console.log(`   🟢 En ejecución: ${runningCount}`);
    console.log(`   ⏸️  Pausados: ${pausedCount}`);
    console.log(`   ✅ Finalizados: ${finishedCount}`);

    // 4. Verificar procesos activos por túnel
    console.log("\n🔍 Procesos activos por túnel:");
    for (let tunnelId = 1; tunnelId <= 3; tunnelId++) {
      const activeProcess = allProcesses.find(p => p.tunnel_id === tunnelId && p.status === 'running');
      if (activeProcess) {
        console.log(`   Túnel ${tunnelId}: ✅ Activo (${activeProcess.fruit})`);
      } else {
        console.log(`   Túnel ${tunnelId}: ❌ Sin proceso activo`);
      }
    }

  } catch (error) {
    console.error("❌ Error en la prueba:", error);
  }
}

// Ejecutar prueba
testProcesses().then(() => {
  console.log("🏁 Verificación completada");
  process.exit(0);
}).catch(error => {
  console.error("💥 Error fatal:", error);
  process.exit(1);
});
