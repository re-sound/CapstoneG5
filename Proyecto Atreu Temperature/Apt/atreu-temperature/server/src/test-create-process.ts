import { createProcess, getProcess } from "./supabase-db-real.js";

/**
 * Script para probar la creación de procesos
 */

async function testCreateProcess() {
  console.log("🧪 Probando creación de procesos...");
  
  try {
    // 1. Verificar si hay un proceso activo en el túnel 2
    console.log("🔍 Verificando procesos activos en túnel 2...");
    const existingProcess = await getProcess(2);
    
    if (existingProcess) {
      console.log(`❌ Ya existe un proceso activo en túnel 2:`);
      console.log(`   ID: ${existingProcess.id}`);
      console.log(`   Estado: ${existingProcess.status}`);
      console.log(`   Fruta: ${existingProcess.fruit}`);
      console.log(`   Iniciado por: ${existingProcess.started_by}`);
      return;
    }

    console.log("✅ No hay proceso activo en túnel 2");

    // 2. Crear un nuevo proceso
    const now = new Date().toISOString();
    const testUserId = "9c5b533e-4483-433b-b498-855ccbcf3643"; // ID del usuario admin
    
    console.log("🔄 Creando nuevo proceso en túnel 2...");
    
    const newProcess = await createProcess({
      tunnel_id: 2,
      status: "running",
      fruit: "Pera Williams",
      min_temp: 2.0,
      max_temp: 8.0,
      ideal_min: 3.0,
      ideal_max: 7.0,
      started_at: now,
      ended_at: null,
      started_by: testUserId,
      ended_by: null,
      measure_plan: 20,
      destination: "Mercado Central",
      origin: "Hacienda San José",
      condition_initial: "Fruta recién cosechada, temperatura ambiente",
      description: "Proceso de prueba para túnel 2",
      state_label: "En curso",
      last_change: now
    });

    console.log("✅ Proceso creado exitosamente:");
    console.log(`   ID: ${newProcess.id}`);
    console.log(`   Túnel: ${newProcess.tunnel_id}`);
    console.log(`   Estado: ${newProcess.status}`);
    console.log(`   Fruta: ${newProcess.fruit}`);
    console.log(`   Temperaturas: ${newProcess.min_temp}°C - ${newProcess.max_temp}°C`);
    console.log(`   Iniciado por: ${newProcess.started_by}`);
    console.log(`   Descripción: ${newProcess.description}`);

    // 3. Verificar que se puede obtener
    console.log("🔍 Verificando que el proceso se puede obtener...");
    const retrievedProcess = await getProcess(2);
    
    if (retrievedProcess) {
      console.log("✅ Proceso obtenido correctamente desde la base de datos");
    } else {
      console.log("❌ ERROR: No se pudo obtener el proceso recién creado");
    }

  } catch (error) {
    console.error("❌ Error en la prueba:", error);
  }
}

// Ejecutar prueba
testCreateProcess().then(() => {
  console.log("🏁 Prueba completada");
  process.exit(0);
}).catch(error => {
  console.error("💥 Error fatal:", error);
  process.exit(1);
});
