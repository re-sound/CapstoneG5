import { supabaseAdmin } from "./supabase.js";

/**
 * Script para verificar y limpiar SOLO los túneles extras (sin tocar frutas)
 * Los túneles no deben tener frutas predeterminadas - la fruta viene del proceso activo
 */

async function fixTunnelsOnly() {
  console.log("🔧 Verificando y limpiando túneles (sin frutas predeterminadas)...");
  
  try {
    // 1. Ver todos los túneles actuales
    console.log("\n📋 Túneles actuales en la base de datos:");
    const { data: allTunnels, error: tunnelsError } = await supabaseAdmin
      .from('tunnels')
      .select('*')
      .order('id');

    if (tunnelsError) {
      console.error("❌ Error obteniendo túneles:", tunnelsError);
      return;
    }

    console.log(`📊 Total de túneles encontrados: ${allTunnels.length}`);
    allTunnels.forEach((tunnel, index) => {
      console.log(`   ${index + 1}. ID: ${tunnel.id} - Activo: ${tunnel.is_active ?? 'N/A'}`);
    });

    // 2. Verificar procesos activos por túnel
    console.log("\n🔍 Verificando procesos activos por túnel:");
    for (const tunnel of allTunnels) {
      const { data: processes, error: processError } = await supabaseAdmin
        .from('processes')
        .select('id, status, fruit, started_at')
        .eq('tunnel_id', tunnel.id)
        .eq('status', 'running');

      if (processError) {
        console.error(`   ❌ Error obteniendo procesos para túnel ${tunnel.id}:`, processError);
        continue;
      }

      if (processes.length > 0) {
        const process = processes[0];
        console.log(`   📊 Túnel ${tunnel.id}: ✅ Activo - Fruta: ${process.fruit} (Proceso ID: ${process.id})`);
      } else {
        console.log(`   📊 Túnel ${tunnel.id}: ❌ Sin proceso activo`);
      }
    }

    // 3. Si hay más de 7 túneles, limpiar solo los extras
    if (allTunnels.length > 7) {
      console.log(`\n⚠️  Se encontraron ${allTunnels.length} túneles, pero deberían ser solo 7.`);
      console.log("🔄 Procediendo a limpiar túneles extras (conservando solo IDs 1-7)...");
      
      // 4. Eliminar túneles con ID > 7
      const tunnelsToDelete = allTunnels.filter(tunnel => tunnel.id > 7);
      console.log(`\n🗑️  Se eliminarán ${tunnelsToDelete.length} túneles con ID > 7`);
      
      for (const tunnel of tunnelsToDelete) {
        console.log(`   Eliminando túnel ${tunnel.id}...`);
        
        // Primero eliminar lecturas asociadas a estos túneles extras
        const { error: deleteReadingsError } = await supabaseAdmin
          .from('readings')
          .delete()
          .eq('tunnel_id', tunnel.id);
        
        if (deleteReadingsError) {
          console.error(`   ❌ Error eliminando lecturas del túnel ${tunnel.id}:`, deleteReadingsError);
          continue;
        }
        
        // Luego eliminar procesos asociados a estos túneles extras
        const { error: deleteProcessesError } = await supabaseAdmin
          .from('processes')
          .delete()
          .eq('tunnel_id', tunnel.id);
        
        if (deleteProcessesError) {
          console.error(`   ❌ Error eliminando procesos del túnel ${tunnel.id}:`, deleteProcessesError);
          continue;
        }
        
        // Finalmente eliminar el túnel extra
        const { error: deleteTunnelError } = await supabaseAdmin
          .from('tunnels')
          .delete()
          .eq('id', tunnel.id);
        
        if (deleteTunnelError) {
          console.error(`   ❌ Error eliminando túnel ${tunnel.id}:`, deleteTunnelError);
          continue;
        }
        
        console.log(`   ✅ Túnel ${tunnel.id} eliminado correctamente`);
      }
      
      // 5. Verificar túneles restantes
      console.log("\n📋 Verificando túneles después de la limpieza:");
      const { data: remainingTunnels, error: remainingError } = await supabaseAdmin
        .from('tunnels')
        .select('*')
        .order('id');

      if (remainingError) {
        console.error("❌ Error obteniendo túneles restantes:", remainingError);
        return;
      }

      console.log(`✅ Total de túneles ahora: ${remainingTunnels.length}`);
      remainingTunnels.forEach((tunnel, index) => {
        console.log(`   ${index + 1}. ID: ${tunnel.id} - Activo: ${tunnel.is_active ?? 'N/A'}`);
      });
      
    } else {
      console.log("✅ La cantidad de túneles es correcta (7)");
    }

    // 6. Verificación final de procesos activos en túneles 1-7
    console.log("\n📋 Verificación final de procesos activos (túneles 1-7):");
    for (let tunnelId = 1; tunnelId <= 7; tunnelId++) {
      const { data: processes, error: processError } = await supabaseAdmin
        .from('processes')
        .select('id, status, fruit, started_at')
        .eq('tunnel_id', tunnelId)
        .eq('status', 'running');

      if (processError) {
        console.error(`   ❌ Error obteniendo procesos para túnel ${tunnelId}:`, processError);
        continue;
      }

      if (processes.length > 0) {
        const process = processes[0];
        console.log(`   📊 Túnel ${tunnelId}: ✅ ${process.fruit} (Proceso ID: ${process.id})`);
      } else {
        console.log(`   📊 Túnel ${tunnelId}: ❌ Libre`);
      }
    }

    console.log("\n🎉 ¡Limpieza de túneles completada!");
    console.log("ℹ️  NOTA: Los túneles no tienen frutas predeterminadas.");
    console.log("ℹ️  La fruta se determina por el proceso activo en cada túnel.");
    
    // Verificación final
    const { data: finalTunnels, error: finalError } = await supabaseAdmin
      .from('tunnels')
      .select('*')
      .order('id');

    if (finalError) {
      console.error("❌ Error en verificación final:", finalError);
      return;
    }

    console.log(`\n📊 Estado final: ${finalTunnels.length} túneles`);
    finalTunnels.forEach((tunnel, index) => {
      console.log(`   ${index + 1}. ID: ${tunnel.id} - Activo: ${tunnel.is_active ?? 'N/A'}`);
    });

  } catch (error) {
    console.error("❌ Error en la operación:", error);
  }
}

// Ejecutar
fixTunnelsOnly().then(() => {
  console.log("\n🏁 Operación completada");
  process.exit(0);
}).catch(error => {
  console.error("💥 Error fatal:", error);
  process.exit(1);
});