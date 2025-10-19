import { getProcess, updateProcess } from "./supabase-db-real.js";

/**
 * Script de prueba para verificar la finalización de procesos
 */

async function testFinalizeProcess() {
  console.log("🧪 Probando finalización de procesos...");
  
  try {
    // 1. Buscar un proceso activo
    const process = await getProcess(1); // Túnel 1
    
    if (!process) {
      console.log("❌ No hay proceso activo en el túnel 1");
      return;
    }

    console.log(`📋 Proceso encontrado: ${process.id}`);
    console.log(`   Estado actual: ${process.status}`);
    console.log(`   Túnel: ${process.tunnel_id}`);
    console.log(`   Fruta: ${process.fruit}`);

    // 2. Finalizar el proceso
    const now = new Date().toISOString();
    console.log(`🔄 Finalizando proceso...`);
    
    const updatedProcess = await updateProcess(process.id, {
      status: "finished",
      ended_at: now,
      ended_by: null,
      last_change: now
    });

    console.log(`✅ Proceso finalizado:`);
    console.log(`   ID: ${updatedProcess.id}`);
    console.log(`   Estado: ${updatedProcess.status}`);
    console.log(`   Iniciado: ${updatedProcess.started_at}`);
    console.log(`   Finalizado: ${updatedProcess.ended_at}`);

    // 3. Verificar que ya no aparece como activo
    console.log(`🔍 Verificando que ya no aparece como activo...`);
    const processAfter = await getProcess(1);
    
    if (processAfter) {
      console.log(`❌ ERROR: El proceso sigue apareciendo como activo`);
      console.log(`   Estado: ${processAfter.status}`);
    } else {
      console.log(`✅ CORRECTO: El proceso ya no aparece como activo`);
    }

  } catch (error) {
    console.error("❌ Error en la prueba:", error);
  }
}

// Ejecutar prueba
testFinalizeProcess().then(() => {
  console.log("🏁 Prueba completada");
  process.exit(0);
}).catch(error => {
  console.error("💥 Error fatal:", error);
  process.exit(1);
});
