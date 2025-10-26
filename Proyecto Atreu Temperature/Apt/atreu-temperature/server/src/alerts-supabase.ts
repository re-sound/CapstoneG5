import { supabase, type TemperatureAlertRow } from './supabase.js';

/**
 * Sistema de alertas para Supabase
 * Maneja la detección y gestión de alertas de temperatura
 */

export interface AlertThresholds {
  min: number;
  max: number;
  warnDelta: number;
}

export interface SensorReading {
  sensor: string;
  value: number | "OUT";
  thresholds: AlertThresholds;
}

// Rangos por defecto para diferentes tipos de fruta
const FRUIT_THRESHOLDS: Record<string, AlertThresholds> = {
  "Manzana Gala": { min: 3.5, max: 12, warnDelta: 0.5 },
  "Manzana Fuji": { min: 3.5, max: 12, warnDelta: 0.5 },
  "Pera Packham": { min: 3.0, max: 11, warnDelta: 0.5 },
  "Uva Red Globe": { min: 2.5, max: 10, warnDelta: 0.5 },
  "Arándano": { min: 2.0, max: 9, warnDelta: 0.5 },
  "Cereza": { min: 2.0, max: 9, warnDelta: 0.5 },
  "Kiwi": { min: 3.0, max: 11, warnDelta: 0.5 },
  "GENÉRICA": { min: 3.5, max: 12, warnDelta: 0.5 }
};

/**
 * Evalúa si una lectura genera una alerta
 */
export function evaluateAlert(reading: SensorReading): 'ok' | 'warning' | 'alarm' | null {
  if (reading.value === "OUT") return null;
  
  const { value, thresholds } = reading;
  const { min, max, warnDelta } = thresholds;
  
  // Alarmas críticas
  if (value < min || value > max) {
    return 'alarm';
  }
  
  // Advertencias (cerca de los límites)
  if (value < min + warnDelta || value > max - warnDelta) {
    return 'warning';
  }
  
  return 'ok';
}

/**
 * Crea una alerta en la base de datos
 */
export async function createAlert(alert: Omit<TemperatureAlertRow, 'id' | 'created_at'>): Promise<TemperatureAlertRow> {
  const { data, error } = await supabase
    .from('temperature_alerts')
    .insert(alert)
    .select()
    .single();

  if (error) {
    throw new Error(`Error creando alerta: ${error.message}`);
  }

  return data;
}

/**
 * Obtiene alertas activas (no resueltas)
 */
export async function getActiveAlerts(): Promise<TemperatureAlertRow[]> {
  const { data, error } = await supabase
    .from('temperature_alerts')
    .select('*')
    .eq('resolved', false)
    .order('alert_time', { ascending: false });

  if (error) {
    throw new Error(`Error obteniendo alertas activas: ${error.message}`);
  }

  return data || [];
}

/**
 * Obtiene alertas por túnel
 */
export async function getAlertsByTunnel(tunnelId: number): Promise<TemperatureAlertRow[]> {
  const { data, error } = await supabase
    .from('temperature_alerts')
    .select('*')
    .eq('tunnel_id', tunnelId)
    .order('alert_time', { ascending: false });

  if (error) {
    throw new Error(`Error obteniendo alertas del túnel ${tunnelId}: ${error.message}`);
  }

  return data || [];
}

/**
 * Marca una alerta como reconocida
 */
export async function acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<TemperatureAlertRow> {
  const { data, error } = await supabase
    .from('temperature_alerts')
    .update({
      acknowledged: true,
      acknowledged_by: acknowledgedBy,
      acknowledged_at: new Date().toISOString()
    })
    .eq('id', alertId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error reconociendo alerta ${alertId}: ${error.message}`);
  }

  return data;
}

/**
 * Marca una alerta como resuelta
 */
export async function resolveAlert(alertId: string): Promise<TemperatureAlertRow> {
  const { data, error } = await supabase
    .from('temperature_alerts')
    .update({
      resolved: true,
      resolved_at: new Date().toISOString()
    })
    .eq('id', alertId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error resolviendo alerta ${alertId}: ${error.message}`);
  }

  return data;
}

/**
 * Procesa una lectura y genera alertas si es necesario
 */
export async function processReadingForAlerts(
  readingId: string,
  tunnelId: number,
  processId: string | null,
  fruit: string,
  readings: Record<string, number | "OUT">,
  processThresholds?: { min_temp: number; max_temp: number }
): Promise<TemperatureAlertRow[]> {
  // Usar umbrales del proceso si están disponibles, sino usar los por defecto
  const thresholds = processThresholds ? {
    min: processThresholds.min_temp,
    max: processThresholds.max_temp,
    warnDelta: 0.5
  } : (FRUIT_THRESHOLDS[fruit] || FRUIT_THRESHOLDS["GENÉRICA"]);
  
  const alerts: TemperatureAlertRow[] = [];

  // Sensores a evaluar
  const sensors = [
    { key: 'amb_out', name: 'Ambiente Exterior' },
    { key: 'amb_ret', name: 'Ambiente Retorno' },
    { key: 'izq_ext_ent', name: 'Izq Ext Entrada' },
    { key: 'izq_int_ent', name: 'Izq Int Entrada' },
    { key: 'der_int_ent', name: 'Der Int Entrada' },
    { key: 'der_ext_ent', name: 'Der Ext Entrada' },
    { key: 'izq_ext_sal', name: 'Izq Ext Salida' },
    { key: 'izq_int_sal', name: 'Izq Int Salida' },
    { key: 'der_int_sal', name: 'Der Int Salida' },
    { key: 'der_ext_sal', name: 'Der Ext Salida' }
  ];

  for (const sensor of sensors) {
    const value = readings[sensor.key];
    if (value === "OUT") continue;

    const alertType = evaluateAlert({
      sensor: sensor.name,
      value,
      thresholds
    });

    if (alertType && alertType !== 'ok') {
      try {
        const alert = await createAlert({
          reading_id: readingId,
          tunnel_id: tunnelId,
          process_id: processId,
          alert_time: new Date().toISOString(),
          alert_type: alertType,
          sensor_name: sensor.name,
          alert_value: value,
          threshold_value: value < thresholds.min ? thresholds.min : thresholds.max,
          acknowledged: false,
          acknowledged_by: null,
          acknowledged_at: null,
          resolved: false,
          resolved_at: null
        });

        alerts.push(alert);
        console.log(`🚨 Alerta ${alertType} generada: ${sensor.name} = ${value}°C (Túnel ${tunnelId})`);
      } catch (error) {
        console.error(`Error creando alerta para ${sensor.name}:`, error);
      }
    }
  }

  return alerts;
}

/**
 * Obtiene estadísticas de alertas
 */
export async function getAlertStats(): Promise<{
  total: number;
  active: number;
  acknowledged: number;
  resolved: number;
  byType: { warning: number; alarm: number };
}> {
  const { data: allAlerts, error } = await supabase
    .from('temperature_alerts')
    .select('alert_type, acknowledged, resolved');

  if (error) {
    throw new Error(`Error obteniendo estadísticas de alertas: ${error.message}`);
  }

  const stats = {
    total: allAlerts.length,
    active: allAlerts.filter(a => !a.resolved).length,
    acknowledged: allAlerts.filter(a => a.acknowledged).length,
    resolved: allAlerts.filter(a => a.resolved).length,
    byType: {
      warning: allAlerts.filter(a => a.alert_type === 'warning').length,
      alarm: allAlerts.filter(a => a.alert_type === 'alarm').length
    }
  };

  return stats;
}
