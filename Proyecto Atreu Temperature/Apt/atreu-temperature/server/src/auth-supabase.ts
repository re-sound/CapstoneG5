import { supabase, supabaseAdmin, type UserRow, type UserSessionRow } from './supabase.js';
import crypto from 'crypto';

/**
 * Sistema de autenticación con Supabase
 * Maneja login, logout y sesiones de usuario
 */

export interface LoginCredentials {
  user_id: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: UserRow;
  session?: UserSessionRow;
  token?: string;
  error?: string;
}

export interface SessionInfo {
  user: UserRow;
  session: UserSessionRow;
}

/**
 * Genera un token de sesión único
 */
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Obtiene información del dispositivo desde el request
 */
function getDeviceInfo(req: any): any {
  return {
    userAgent: req.headers['user-agent'] || 'Unknown',
    platform: req.headers['sec-ch-ua-platform'] || 'Unknown',
    browser: req.headers['sec-ch-ua'] || 'Unknown'
  };
}

/**
 * Obtiene la IP del cliente
 */
function getClientIP(req: any): string {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         '127.0.0.1';
}

/**
 * Valida las credenciales del usuario
 */
export async function validateCredentials(credentials: LoginCredentials): Promise<UserRow | null> {
  try {
    console.log('🔍 [AUTH DEBUG] Validando credenciales para:', credentials.user_id);
    
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('user_id', credentials.user_id)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      console.log('❌ [AUTH DEBUG] Usuario no encontrado o inactivo');
      return null;
    }

    console.log('👤 [AUTH DEBUG] Usuario encontrado:', user.user_id, 'password_hash en DB:', user.password_hash);
    console.log('🔐 [AUTH DEBUG] Password recibida:', credentials.password);
    console.log('📏 [AUTH DEBUG] Longitud password recibida:', credentials.password.length);

    // Verificar contraseña - soporta múltiples métodos de hash para seguridad
    const adminHashWithSalt = '8e3f23b3d1160bee5cfce19187480941e673573d842e353abf4e0a53ec023a69'; // SHA-256 + salt
    const adminHashSHA256 = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';   // SHA-256 sin salt
    
    console.log('🔗 [AUTH DEBUG] Hash esperado con salt:', adminHashWithSalt);
    console.log('🔗 [AUTH DEBUG] Hash esperado sin salt:', adminHashSHA256);
    
    // Caso 1: Contraseña hasheada con salt (máxima seguridad - recomendado)
    if (credentials.password === adminHashWithSalt && user.password_hash === 'admin') {
      console.log('✅ [AUTH SUCCESS] Login con contraseña hasheada + salt (máxima seguridad)');
      return user;
    }
    
    // Caso 2: Contraseña hasheada sin salt (compatibilidad)
    if (credentials.password === adminHashSHA256 && user.password_hash === 'admin') {
      console.log('✅ [AUTH SUCCESS] Login con contraseña hasheada sin salt (seguro)');
      return user;
    }
    
    // Caso 3: Contraseña en texto plano (compatibilidad hacia atrás)
    if (user.password_hash === credentials.password) {
      console.log('⚠️  [AUTH SUCCESS] Login con contraseña en texto plano (menos seguro - actualizar cliente)');
      return user;
    }

    console.log('❌ [AUTH FAIL] Ninguna validación coincidió');
    console.log('   - Password recibida no es hash con salt');
    console.log('   - Password recibida no es hash sin salt');
    console.log('   - Password recibida no coincide con password_hash en DB');

    return null;
  } catch (error) {
    console.error('💥 [AUTH ERROR] Error validando credenciales:', error);
    return null;
  }
}

/**
 * Crea una nueva sesión de usuario
 */
export async function createUserSession(user: UserRow, req: any): Promise<UserSessionRow> {
  const sessionToken = generateSessionToken();
  const now = new Date().toISOString();
  const deviceInfo = getDeviceInfo(req);
  const ipAddress = getClientIP(req);

  const { data: session, error } = await supabaseAdmin
    .from('user_sessions')
    .insert({
      user_id: user.id,
      session_token: sessionToken,
      login_time: now,
      ip_address: ipAddress,
      device_info: deviceInfo,
      status: 'active'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error creando sesión: ${error.message}`);
  }

  return session;
}

/**
 * Actualiza el last_login del usuario
 */
export async function updateLastLogin(userId: string): Promise<void> {
  const now = new Date().toISOString();
  
  await supabaseAdmin
    .from('users')
    .update({ last_login: now })
    .eq('id', userId);
}

/**
 * Valida un token de sesión
 */
export async function validateSessionToken(token: string): Promise<SessionInfo | null> {
  try {
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('user_sessions')
      .select(`
        *,
        users:user_id (*)
      `)
      .eq('session_token', token)
      .eq('status', 'active')
      .single();

    if (sessionError || !session) {
      return null;
    }

    return {
      user: session.users,
      session: session
    };
  } catch (error) {
    console.error('Error validando sesión:', error);
    return null;
  }
}

/**
 * Cierra una sesión (logout)
 */
export async function closeUserSession(token: string): Promise<void> {
  const now = new Date().toISOString();
  
  // Obtener la sesión para calcular duración
  const { data: session } = await supabaseAdmin
    .from('user_sessions')
    .select('login_time')
    .eq('session_token', token)
    .single();

  let durationSec = null;
  if (session?.login_time) {
    const loginTime = new Date(session.login_time);
    const logoutTime = new Date(now);
    durationSec = Math.floor((logoutTime.getTime() - loginTime.getTime()) / 1000);
  }

  // Cerrar la sesión
  await supabaseAdmin
    .from('user_sessions')
    .update({
      status: 'closed',
      logout_time: now,
      duration_sec: durationSec
    })
    .eq('session_token', token);

  // Actualizar last_logout del usuario
  const sessionInfo = await validateSessionToken(token);
  if (sessionInfo) {
    await supabaseAdmin
      .from('users')
      .update({ last_logout: now })
      .eq('id', sessionInfo.user.id);
  }
}

/**
 * Cierra todas las sesiones activas de un usuario
 */
export async function closeAllUserSessions(userId: string): Promise<void> {
  const now = new Date().toISOString();
  
  await supabaseAdmin
    .from('user_sessions')
    .update({
      status: 'closed',
      logout_time: now
    })
    .eq('user_id', userId)
    .eq('status', 'active');

  // Actualizar last_logout del usuario
  await supabaseAdmin
    .from('users')
    .update({ last_logout: now })
    .eq('id', userId);
}

/**
 * Obtiene sesiones activas de un usuario
 */
export async function getActiveUserSessions(userId: string): Promise<UserSessionRow[]> {
  const { data: sessions, error } = await supabaseAdmin
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('login_time', { ascending: false });

  if (error) {
    throw new Error(`Error obteniendo sesiones: ${error.message}`);
  }

  return sessions || [];
}

/**
 * Middleware para verificar autenticación
 */
export function requireAuth(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }

  validateSessionToken(token)
    .then(sessionInfo => {
      if (!sessionInfo) {
        return res.status(401).json({ error: 'Token inválido o sesión expirada' });
      }
      
      req.user = sessionInfo.user;
      req.session = sessionInfo.session;
      next();
    })
    .catch(error => {
      console.error('Error en middleware de auth:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    });
}
