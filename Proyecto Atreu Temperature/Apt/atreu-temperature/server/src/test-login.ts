import { validateCredentials, createUserSession } from "./auth-supabase.js";

/**
 * Script para probar el login
 */

async function testLogin() {
  console.log("🧪 Probando login...");
  
  try {
    // 1. Probar validación de credenciales
    console.log("🔍 Validando credenciales...");
    const user = await validateCredentials({
      user_id: "admin",
      password: "admin"
    });

    if (!user) {
      console.log("❌ Credenciales inválidas");
      return;
    }

    console.log("✅ Usuario encontrado:", user);

    // 2. Crear sesión
    console.log("🔍 Creando sesión...");
    const mockReq = {
      headers: {
        'user-agent': 'test-script',
        'x-forwarded-for': '127.0.0.1'
      }
    };

    const session = await createUserSession(user, mockReq);
    console.log("✅ Sesión creada:", session);

    // 3. Probar validación de token
    console.log("🔍 Validando token...");
    const { validateSessionToken } = await import("./auth-supabase.js");
    const sessionInfo = await validateSessionToken(session.session_token);
    
    if (sessionInfo) {
      console.log("✅ Token válido:", sessionInfo);
    } else {
      console.log("❌ Token inválido");
    }

  } catch (error) {
    console.error("❌ Error en la prueba:", error);
  }
}

// Ejecutar prueba
testLogin().then(() => {
  console.log("🏁 Prueba completada");
  process.exit(0);
}).catch(error => {
  console.error("💥 Error fatal:", error);
  process.exit(1);
});
