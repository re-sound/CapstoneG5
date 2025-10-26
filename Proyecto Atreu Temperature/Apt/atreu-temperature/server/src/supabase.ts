import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL') {
  throw new Error('SUPABASE_URL no está configurado. Por favor, configura las variables de entorno.');
}

if (!supabaseKey || supabaseKey === 'YOUR_SUPABASE_ANON_KEY') {
  throw new Error('SUPABASE_ANON_KEY no está configurado. Por favor, configura las variables de entorno.');
}

// Cliente principal con clave anónima
export const supabase = createClient(supabaseUrl, supabaseKey);

// Cliente con service role para operaciones administrativas
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Tipos para las tablas de Supabase (esquema real)
export interface TunnelRow {
  id: number;
  name: string;
  fruit_type: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReadingRow {
  id: string;
  tunnel_id: number;
  process_id: string | null;
  ts: string;
  amb_out: number | null;
  amb_ret: number | null;
  izq_ext_ent: number | null;
  izq_int_ent: number | null;
  der_int_ent: number | null;
  der_ext_ent: number | null;
  izq_ext_sal: number | null;
  izq_int_sal: number | null;
  der_int_sal: number | null;
  der_ext_sal: number | null;
  fruit: string | null;
  min_temp: number | null;
  max_temp: number | null;
  ideal_min: number | null;
  ideal_max: number | null;
  created_at: string;
}

export interface ProcessRow {
  id: string;
  tunnel_id: number;
  status: 'idle' | 'running' | 'paused' | 'finished';
  fruit: string;
  min_temp: number;
  max_temp: number;
  ideal_min: number;
  ideal_max: number;
  started_at: string | null;
  ended_at: string | null;
  started_by: string | null;
  ended_by: string | null;
  measure_plan: number | null;
  destination: string | null;
  origin: string | null;
  condition_initial: string | null;
  description: string | null;
  state_label: string | null;
  last_change: string;
  created_at: string;
}

export interface ProcessHistoryRow {
  id: string;
  tunnel_id: number;
  fruit: string;
  min_temp: number;
  max_temp: number;
  ideal_min: number;
  ideal_max: number;
  started_at: string;
  ended_at: string;
  started_by: string | null;
  ended_by: string | null;
  measure_plan: number | null;
  destination: string | null;
  origin: string | null;
  condition_initial: string | null;
  description: string | null;
  duration_minutes: number | null;
  created_at: string;
}

export interface TemperatureAlertRow {
  id: string;
  reading_id: string | null;
  tunnel_id: number;
  process_id: string | null;
  alert_time: string;
  alert_type: 'warning' | 'alarm';
  sensor_name: string;
  alert_value: number;
  threshold_value: number;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

export interface UserRow {
  id: string;
  user_id: string;
  password_hash: string;
  full_name: string;
  role_id: number | null;
  email: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  last_logout: string | null;
}

export interface RoleRow {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}
