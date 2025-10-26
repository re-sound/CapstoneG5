import { supabase, type TunnelRow, type ReadingRow, type ProcessRow, type ProcessHistoryRow } from './supabase.js';

/**
 * Capa de abstracción de base de datos para Supabase
 * Reemplaza las funciones de better-sqlite3 con equivalentes de Supabase
 */

// ===== TÚNELES =====
export async function getTunnels(): Promise<TunnelRow[]> {
  const { data, error } = await supabase
    .from('tunnels')
    .select('*')
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

export async function insertReading(reading: Omit<ReadingRow, 'id'>): Promise<ReadingRow> {
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
    .select('*');

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
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No encontrado
    throw new Error(`Error obteniendo proceso del túnel ${tunnelId}: ${error.message}`);
  }

  return data;
}

export async function upsertProcess(process: ProcessRow): Promise<ProcessRow> {
  const { data, error } = await supabase
    .from('processes')
    .upsert(process, { onConflict: 'tunnel_id' })
    .select()
    .single();

  if (error) {
    throw new Error(`Error upserting proceso: ${error.message}`);
  }

  return data;
}

export async function updateProcess(tunnelId: number, updates: Partial<ProcessRow>): Promise<ProcessRow> {
  const { data, error } = await supabase
    .from('processes')
    .update(updates)
    .eq('tunnel_id', tunnelId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error actualizando proceso del túnel ${tunnelId}: ${error.message}`);
  }

  return data;
}

export async function deleteProcess(tunnelId: number): Promise<void> {
  const { error } = await supabase
    .from('processes')
    .delete()
    .eq('tunnel_id', tunnelId);

  if (error) {
    throw new Error(`Error eliminando proceso del túnel ${tunnelId}: ${error.message}`);
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

export async function insertProcessHistory(history: ProcessHistoryRow): Promise<ProcessHistoryRow> {
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

// Función de compatibilidad para mantener la misma interfaz
export const db = {
  prepare: (query: string) => {
    // Esta función se mantiene para compatibilidad pero no se usa
    // Las operaciones se hacen directamente con las funciones async
    throw new Error('db.prepare() no está disponible con Supabase. Usa las funciones específicas.');
  }
};
