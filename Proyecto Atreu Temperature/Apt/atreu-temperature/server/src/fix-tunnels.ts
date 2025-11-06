import { supabaseAdmin } from "./supabase.js";

/**
 * Script para verificar y limpiar los túneles en la base de datos
 * Asegurando que solo haya 7 túneles como corresponde
 */

async function fixTunnels() {
  console.log("🔧 Verificando y arreglando túneles...");
  
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
      console.log(`   ${index + 1}. ID: ${tunnel.id} - Fruta: ${tunnel.fruit} - Activo: ${tunnel.is_active ?? 'N/A'}`);
    });

    // 2. Verificar procesos asociados
    console.log("\n🔍 Verificando procesos por túnel:");
    for (const tunnel of allTunnels) {
      const { data: processes, error: processError } = await supabaseAdmin
        .from('processes')
        .select('id, status, fruit')
        .eq('tunnel_id', tunnel.id);

      if (processError) {
        console.error(`   ❌ Error obteniendo procesos para túnel ${tunnel.id}:`, processError);
        continue;
      }

      console.log(`   📊 Túnel ${tunnel.id}: ${processes.length} procesos`);
      processes.forEach((process, i) => {
        console.log(`      ${i + 1}. ${process.id} - ${process.status} - ${process.fruit}`);
      });
    }

    // 3. Verificar lecturas por túnel
    console.log("\n📈 Verificando lecturas por túnel:");
    for (const tunnel of allTunnels) {
      const { data: readings, error: readingError } = await supabaseAdmin
        .from('readings')
        .select('id')
        .eq('tunnel_id', tunnel.id);

      if (readingError) {
        console.error(`   ❌ Error obteniendo lecturas para túnel ${tunnel.id}:`, readingError);
        continue;
      }

      console.log(`   📊 Túnel ${tunnel.id}: ${readings.length} lecturas`);
    }

    // Definir las frutas correctas una sola vez
    const correctFruits = [
      "Manzana Gala", "Manzana Fuji", "Pera Packham",
      "Uva Red Globe", "Arándano", "Cereza", "Kiwi"
    ];

    // 4. Si hay más de 7 túneles, limpiar
    if (allTunnels.length > 7) {
      console.log(`\n⚠️  Se encontraron ${allTunnels.length} túneles, pero deberían ser solo 7.`);
      console.log("📝 Los túneles correctos deberían ser:");
      
      correctFruits.forEach((fruit, index) => {
        console.log(`   ${index + 1}. ${fruit}`);
      });

      console.log("\n🔄 Procediendo a limpiar túneles extras...");
      
      // 5. Eliminar túneles con ID > 7
      const tunnelsToDelete = allTunnels.filter(tunnel => tunnel.id > 7);
      console.log(`\n🗑️  Se eliminarán ${tunnelsToDelete.length} túneles con ID > 7`);
      
      for (const tunnel of tunnelsToDelete) {
        console.log(`   Eliminando túnel ${tunnel.id} (${tunnel.fruit})...`);
        
        // Primero eliminar lecturas asociadas
        const { error: deleteReadingsError } = await supabaseAdmin
          .from('readings')
          .delete()
          .eq('tunnel_id', tunnel.id);
        
        if (deleteReadingsError) {
          console.error(`   ❌ Error eliminando lecturas del túnel ${tunnel.id}:`, deleteReadingsError);
          continue;
        }
        
        // Luego eliminar procesos asociados
        const { error: deleteProcessesError } = await supabaseAdmin
          .from('processes')
          .delete()
          .eq('tunnel_id', tunnel.id);
        
        if (deleteProcessesError) {
          console.error(`   ❌ Error eliminando procesos del túnel ${tunnel.id}:`, deleteProcessesError);
          continue;
        }
        
        // Finalmente eliminar el túnel
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
      
      // 6. Verificar túneles restantes
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
        console.log(`   ${index + 1}. ID: ${tunnel.id} - Fruta: ${tunnel.fruit}`);
      });
      
      // 7. Asegurar que los túneles 1-7 tengan las frutas correctas
      console.log("\n🔄 Verificando frutas de los túneles 1-7...");
      
      for (let i = 0; i < 7; i++) {
        const tunnelId = i + 1;
        const expectedFruit = correctFruits[i];
        
        const existingTunnel = remainingTunnels.find(t => t.id === tunnelId);
        
        if (existingTunnel) {
          if (existingTunnel.fruit !== expectedFruit) {
            console.log(`   🔄 Actualizando túnel ${tunnelId}: ${existingTunnel.fruit} → ${expectedFruit}`);
            const { error: updateError } = await supabaseAdmin
              .from('tunnels')
              .update({ fruit: expectedFruit })
              .eq('id', tunnelId);
            
            if (updateError) {
              console.error(`   ❌ Error actualizando túnel ${tunnelId}:`, updateError);
            } else {
              console.log(`   ✅ Túnel ${tunnelId} actualizado correctamente`);
            }
          } else {
            console.log(`   ✅ Túnel ${tunnelId}: ${expectedFruit} (correcto)`);
          }
        } else {
          console.log(`   ➕ Creando túnel ${tunnelId}: ${expectedFruit}`);
          const { error: createError } = await supabaseAdmin
            .from('tunnels')
            .insert({
              id: tunnelId,
              fruit: expectedFruit,
              is_active: true
            });
          
          if (createError) {
            console.error(`   ❌ Error creando túnel ${tunnelId}:`, createError);
          } else {
            console.log(`   ✅ Túnel ${tunnelId} creado correctamente`);
          }
        }
      }
      
    } else {
      console.log("✅ La cantidad de túneles es correcta (7)");
      
      // Verificar que las frutas sean las correctas
      console.log("\n🔄 Verificando frutas de los túneles...");
      
      let needsUpdate = false;
      for (let i = 0; i < 7; i++) {
        const tunnelId = i + 1;
        const expectedFruit = correctFruits[i];
        const existingTunnel = allTunnels.find(t => t.id === tunnelId);
        
        if (existingTunnel && existingTunnel.fruit !== expectedFruit) {
          console.log(`   🔄 Actualizando túnel ${tunnelId}: ${existingTunnel.fruit} → ${expectedFruit}`);
          needsUpdate = true;
          
          const { error: updateError } = await supabaseAdmin
            .from('tunnels')
            .update({ fruit: expectedFruit })
            .eq('id', tunnelId);
          
          if (updateError) {
            console.error(`   ❌ Error actualizando túnel ${tunnelId}:`, updateError);
          } else {
            console.log(`   ✅ Túnel ${tunnelId} actualizado correctamente`);
          }
        } else if (existingTunnel) {
          console.log(`   ✅ Túnel ${tunnelId}: ${expectedFruit} (correcto)`);
        }
      }
      
      if (!needsUpdate) {
        console.log("✅ Todas las frutas son correctas");
      }
    }

    console.log("\n🎉 ¡Verificación y limpieza de túneles completada!");
    
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
      console.log(`   ${index + 1}. ID: ${tunnel.id} - Fruta: ${tunnel.fruit}`);
    });

  } catch (error) {
    console.error("❌ Error en la operación:", error);
  }
}

// Ejecutar
fixTunnels().then(() => {
  console.log("\n🏁 Operación completada");
  process.exit(0);
}).catch(error => {
  console.error("💥 Error fatal:", error);
  process.exit(1);
});