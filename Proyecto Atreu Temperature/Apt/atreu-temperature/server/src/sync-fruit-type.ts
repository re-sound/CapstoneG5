import { supabaseAdmin } from "./supabase.js";

/**
 * Función para sincronizar el fruit_type de un túnel basado en su proceso activo
 * Se llama automáticamente cuando se inicia, finaliza o modifica un proceso
 */

export async function syncTunnelFruitType(tunnelId: number): Promise<void> {
  try {
    // Buscar proceso activo para este túnel
    const { data: activeProcess, error: processError } = await supabaseAdmin
      .from('processes')
      .select('id, fruit, status')
      .eq('tunnel_id', tunnelId)
      .eq('status', 'running')
      .single();

    if (processError && processError.code !== 'PGRST116') {
      console.error(`❌ Error obteniendo proceso activo para túnel ${tunnelId}:`, processError);
      return;
    }

    // Determinar el nuevo fruit_type
    const newFruitType = activeProcess ? activeProcess.fruit : "Sin proceso";

    // Actualizar el túnel
    const { error: updateError } = await supabaseAdmin
      .from('tunnels')
      .update({ 
        fruit_type: newFruitType,
        updated_at: new Date().toISOString()
      })
      .eq('id', tunnelId);

    if (updateError) {
      console.error(`❌ Error actualizando fruit_type para túnel ${tunnelId}:`, updateError);
      return;
    }

    console.log(`✅ Túnel ${tunnelId}: fruit_type actualizado a "${newFruitType}"`);
    
  } catch (error) {
    console.error(`💥 Error en syncTunnelFruitType para túnel ${tunnelId}:`, error);
  }
}

/**
 * Función para sincronizar todos los túneles (útil para mantenimiento)
 */
export async function syncAllTunnelsFruitType(): Promise<void> {
  console.log("🔄 Sincronizando fruit_type para todos los túneles...");
  
  try {
    const { data: tunnels, error: tunnelsError } = await supabaseAdmin
      .from('tunnels')
      .select('id')
      .order('id');

    if (tunnelsError) {
      console.error("❌ Error obteniendo túneles:", tunnelsError);
      return;
    }

    for (const tunnel of tunnels) {
      await syncTunnelFruitType(tunnel.id);
    }
    
    console.log("✅ Sincronización de todos los túneles completada");
    
  } catch (error) {
    console.error("💥 Error en syncAllTunnelsFruitType:", error);
  }
}