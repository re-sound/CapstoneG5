/**
 * Utilidades para hashing de contraseñas en el frontend
 * Utiliza la Web Crypto API para SHA-256 con salt
 * 
 * Implementación de seguridad:
 * 1. Salt del sistema + ID de usuario = salt único por usuario
 * 2. Previene ataques rainbow table
 * 3. Hash diferente para misma contraseña entre usuarios
 */

// Salt fijo para el sistema (en producción debería estar en variables de entorno)
const SYSTEM_SALT = 'atreu_temperature_salt_2025';

/**
 * Hash una contraseña usando SHA-256 con salt
 * @param password - La contraseña en texto plano
 * @param customSalt - Salt personalizado (opcional)
 * @returns Promise<string> - Hash hexadecimal de la contraseña con salt
 */
export async function hashPassword(password: string, customSalt?: string): Promise<string> {
  const salt = customSalt || SYSTEM_SALT;
  
  // Combinar contraseña con salt
  const saltedPassword = password + salt;
  
  // Convertir a bytes
  const encoder = new TextEncoder();
  const data = encoder.encode(saltedPassword);
  
  // Generar el hash SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convertir el buffer a hexadecimal
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Hash una contraseña con salt específico del usuario
 * @param password - La contraseña en texto plano
 * @param userId - ID del usuario para generar salt único
 * @returns Promise<string> - Hash hexadecimal con salt de usuario
 */
export async function hashPasswordWithUserSalt(password: string, userId: string): Promise<string> {
  const userSalt = `${SYSTEM_SALT}_user_${userId}`;
  return await hashPassword(password, userSalt);
}

/**
 * Verifica si la Web Crypto API está disponible
 * @returns boolean - true si está disponible
 */
export function isWebCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && 
         typeof crypto.subtle !== 'undefined' && 
         typeof crypto.subtle.digest === 'function';
}