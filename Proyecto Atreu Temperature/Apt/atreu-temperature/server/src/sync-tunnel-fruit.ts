import { supabaseAdmin } from "./supabase.js";

/**
 * Script para sincronizar el campo fruit_type de los túneles
 * con el proceso activo actual (o "Sin proceso" si no hay activo)
 */

async function syncTunnelFruit() {
  console.log("🔄 Sincronizando fruit_type de túneles con procesos activos...");
  
  try {
    // 1. Obtener todos los túneles
    const { data: tunnels, error: tunnelsError } = await supabaseAdmin
      .from('tunnels')
      .select('*')
      .order('id');

    if (tunnelsError) {
      console.error("❌ Error obteniendo túneles:", tunnelsError);
      return;
    }

    console.log(`📊 Procesando ${tunnels.length} túneles...`);

    // 2. Para cada túnel, verificar el proceso activo
    for (const tunnel of tunnels) {
      console.log(`\n🔍 Túnel ${tunnel.id}:`);
      
      // Buscar proceso activo (running) para este túnel
      const { data: activeProcess, error: processError } = await supabaseAdmin
        .from('processes')
        .select('id, fruit, status, started_at')
        .eq('tunnel_id', tunnel.id)
        .eq('status', 'running')
        .single();

      if (processError && processError.code !== 'PGRST116') {
        // PGRST116 = no rows found, lo cual es válido
        console.error(`   ❌ Error obteniendo proceso activo:`, processError);
        continue;
      }

      let newFruitType: string;
      let statusMessage: string;

      if (activeProcess) {
        newFruitType = activeProcess.fruit;
        statusMessage = `✅ Proceso activo: ${activeProcess.fruit} (ID: ${activeProcess.id})`;
      } else {
        newFruitType = "Sin proceso";
        statusMessage = `❌ Sin proceso activo`;
      }

      // 3. Actualizar fruit_type solo si cambió
      if (tunnel.fruit_type !== newFruitType) {
        console.log(`   🔄 Actualizando: "${tunnel.fruit_type}" → "${newFruitType}"`);
        console.log(`   ${statusMessage}`);
        
        const { error: updateError } = await supabaseAdmin
          .from('tunnels')
          .update({ 
            fruit_type: newFruitType,
            updated_at: new Date().toISOString()
          })
          .eq('id', tunnel.id);

        if (updateError) {
          console.error(`   ❌ Error actualizando túnel ${tunnel.id}:`, updateError);
        } else {
          console.log(`   ✅ Túnel ${tunnel.id} actualizado correctamente`);
        }
      } else {
        console.log(`   ✅ Sin cambios necesarios: "${tunnel.fruit_type}"`);
        console.log(`   ${statusMessage}`);
      }
    }

    // 4. Verificación final
    console.log("\n📋 Verificación final de túneles:");
    const { data: finalTunnels, error: finalError } = await supabaseAdmin
      .from('tunnels')
      .select('id, fruit_type, is_active')
      .order('id');

    if (finalError) {
      console.error("❌ Error en verificación final:", finalError);
      return;
    }

    finalTunnels.forEach((tunnel) => {
      const status = tunnel.fruit_type === "Sin proceso" ? "❌" : "✅";
      console.log(`   ${status} Túnel ${tunnel.id}: "${tunnel.fruit_type}"`);
    });

    console.log("\n🎉 ¡Sincronización completada!");
    
  } catch (error) {
    console.error("💥 Error en la sincronización:", error);
  }
}

// Ejecutar
syncTunnelFruit().then(() => {
  console.log("\n🏁 Operación completada");
  process.exit(0);
}).catch(error => {
  console.error("💥 Error fatal:", error);
  process.exit(1);
});