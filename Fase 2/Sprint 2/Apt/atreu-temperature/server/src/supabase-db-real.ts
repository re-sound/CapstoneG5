import { supabase, type TunnelRow, type ReadingRow, type ProcessRow, type ProcessHistoryRow } from './supabase.js';

/**
 * Capa de abstracción de base de datos para Supabase (esquema real)
 * Adaptado al esquema existente con UUIDs y relaciones avanzadas
 */

// ===== TÚNELES =====
export async function getTunnels(): Promise<TunnelRow[]> {
  const { data, error } = await supabase
    .from('tunnels')
    .select('*')
    .eq('is_active', true)
    .order('id');

  if (error) {
    throw new Error(`Error obteniendo túneles: ${error.message}`);
  }

  return data || [];
}

export async function getTunnelById(id: number): Promise<TunnelRow | null> {
  const { data, error } = await supabase
    .from('tunnels')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No encontrado
    throw new Error(`Error obteniendo túnel ${id}: ${error.message}`);
  }

  return data;
}

// ===== LECTURAS =====
export async function getLastReading(tunnelId: number): Promise<ReadingRow | null> {
  const { data, error } = await supabase
    .from('readings')
    .select('*')
    .eq('tunnel_id', tunnelId)
    .order('ts', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No encontrado
    throw new Error(`Error obteniendo última lectura del túnel ${tunnelId}: ${error.message}`);
  }

  return data;
}

export async function getReadingsHistory(tunnelId: number, minutes: number = 60): Promise<ReadingRow[]> {
  const { data, error } = await supabase
    .from('readings')
    .select('*')
    .eq('tunnel_id', tunnelId)
    .gte('ts', new Date(Date.now() - minutes * 60 * 1000).toISOString())
    .order('ts', { ascending: true });

  if (error) {
    throw new Error(`Error obteniendo historial del túnel ${tunnelId}: ${error.message}`);
  }

  return data || [];
}

export async function insertReading(reading: Omit<ReadingRow, 'id' | 'created_at'>): Promise<ReadingRow> {
  const { data, error } = await supabase
    .from('readings')
    .insert(reading)
    .select()
    .single();

  if (error) {
    throw new Error(`Error insertando lectura: ${error.message}`);
  }

  return data;
}

// ===== PROCESOS =====
export async function getAllProcesses(): Promise<ProcessRow[]> {
  const { data, error } = await supabase
    .from('processes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error obteniendo procesos: ${error.message}`);
  }

  return data || [];
}

export async function getProcess(tunnelId: number): Promise<ProcessRow | null> {
  const { data, error } = await supabase
    .from('processes')
    .select('*')
    .eq('tunnel_id', tunnelId)
    .in('status', ['running', 'paused'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No encontrado
    throw new Error(`Error obteniendo proceso del túnel ${tunnelId}: ${error.message}`);
  }

  return data;
}

export async function createProcess(process: Omit<ProcessRow, 'id' | 'created_at'>): Promise<ProcessRow> {
  const { data, error } = await supabase
    .from('processes')
    .insert(process)
    .select()
    .single();

  if (error) {
    throw new Error(`Error creando proceso: ${error.message}`);
  }

  return data;
}

export async function updateProcess(processId: string, updates: Partial<ProcessRow>): Promise<ProcessRow> {
  const { data, error } = await supabase
    .from('processes')
    .update(updates)
    .eq('id', processId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error actualizando proceso ${processId}: ${error.message}`);
  }

  return data;
}

export async function updateProcessByTunnel(tunnelId: number, updates: Partial<ProcessRow>): Promise<ProcessRow | null> {
  // Primero obtener el proceso activo
  const process = await getProcess(tunnelId);
  if (!process) return null;

  return await updateProcess(process.id, updates);
}

export async function deleteProcess(processId: string): Promise<void> {
  const { error } = await supabase
    .from('processes')
    .delete()
    .eq('id', processId);

  if (error) {
    throw new Error(`Error eliminando proceso ${processId}: ${error.message}`);
  }
}

// ===== HISTORIAL DE PROCESOS =====
export async function getProcessHistory(tunnelId: number): Promise<ProcessHistoryRow[]> {
  const { data, error } = await supabase
    .from('process_history')
    .select('*')
    .eq('tunnel_id', tunnelId)
    .order('ended_at', { ascending: false });

  if (error) {
    throw new Error(`Error obteniendo historial del túnel ${tunnelId}: ${error.message}`);
  }

  return data || [];
}

export async function insertProcessHistory(history: Omit<ProcessHistoryRow, 'id' | 'created_at'>): Promise<ProcessHistoryRow> {
  const { data, error } = await supabase
    .from('process_history')
    .insert(history)
    .select()
    .single();

  if (error) {
    throw new Error(`Error insertando historial: ${error.message}`);
  }

  return data;
}

// ===== UTILIDADES =====
export async function purgeOldReadings(days: number = 7): Promise<void> {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  
  const { error } = await supabase
    .from('readings')
    .delete()
    .lt('ts', cutoffDate);

  if (error) {
    throw new Error(`Error limpiando lecturas antiguas: ${error.message}`);
  }
}

// ===== FUNCIONES DE COMPATIBILIDAD =====
// Para mantener la misma interfaz que el código original

export async function getTunnelsWithLastReading() {
  const tunnels = await getTunnels();
  const result = await Promise.all(tunnels.map(async (t) => {
    const last = await getLastReading(t.id);
    return {
      id: t.id,
      fruit: t.fruit_type || 'Sin especificar',
      sensors: last ? {
        AMB_OUT: last.amb_out,
        AMB_RET: last.amb_ret,
        PULP_1: last.izq_ext_ent,
        PULP_2: last.izq_int_ent,
        PULP_3: last.der_int_ent,
        PULP_4: last.der_ext_ent
      } : null
    };
  }));
  return result;
}

// Función de compatibilidad para mantener la misma interfaz
export const db = {
  prepare: (query: string) => {
    // Esta función se mantiene para compatibilidad pero no se usa
    // Las operaciones se hacen directamente con las funciones async
    throw new Error('db.prepare() no está disponible con Supabase. Usa las funciones específicas.');
  }
};
