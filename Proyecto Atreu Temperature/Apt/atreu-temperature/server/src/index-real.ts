import express from "express";
import cors from "cors";
import { 
  getTunnelsWithLastReading, 
  getReadingsHistory, 
  insertReading,
  getAllProcesses,
  getProcess,
  createProcess,
  updateProcess,
  updateProcessByTunnel,
  getProcessHistory,
  insertProcessHistory
} from "./supabase-db-real.js";
import { 
  getActiveAlerts, 
  getAlertsByTunnel, 
  acknowledgeAlert, 
  resolveAlert, 
  getAlertStats 
} from "./alerts-supabase.js";
import { 
  validateCredentials, 
  createUserSession, 
  updateLastLogin, 
  validateSessionToken, 
  closeUserSession, 
  closeAllUserSessions, 
  getActiveUserSessions,
  requireAuth 
} from "./auth-supabase.js";
import { syncTunnelFruitType } from "./sync-fruit-type.js";

const app = express();
app.use(cors());
app.use(express.json());

// Ruta raíz - información de la API
app.get("/", (_req, res) => {
  res.json({
    name: "Atreu Temperature API (Supabase Real)",
    version: "1.0.0",
    status: "running",
    database: "Supabase (Esquema Real)",
    endpoints: {
      health: "GET /api/health",
      tunnels: "GET /api/tunnels",
      history: "GET /api/tunnels/:id/history?minutes=60",
      ingest: "POST /api/tunnels/:id/ingest",
      processes: "GET /api/processes",
      process: "GET /api/processes/:tunnelId",
      startProcess: "POST /api/processes/:tunnelId/start",
      updateRanges: "PUT /api/processes/:tunnelId/ranges",
      pauseProcess: "POST /api/processes/:tunnelId/pause",
      resumeProcess: "POST /api/processes/:tunnelId/resume",
      finalizeProcess: "POST /api/processes/:tunnelId/finalize",
      processHistory: "GET /api/processes/:tunnelId/history"
    },
    documentation: "See README.md for full documentation"
  });
});

// GET /api/tunnels → lista con última lectura (si existe)
app.get("/api/tunnels", async (req, res) => {
  try {
    const result = await getTunnelsWithLastReading();
    res.json(result);
  } catch (error) {
    console.error('Error en GET /api/tunnels:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/tunnels/:id/history?minutes=60
app.get("/api/tunnels/:id/history", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const minutes = Number(req.query.minutes ?? 60);
    
    const rows = await getReadingsHistory(id, minutes);

    // Adaptamos al shape que espera tu Chart/Histórico:
    const payload = rows.map(r => ({
      ts: r.ts,
      AMB_OUT: numOrOut(r.amb_out),
      AMB_RET: numOrOut(r.amb_ret),
      IZQ_EXT_ENT: numOrOut(r.izq_ext_ent),
      IZQ_INT_ENT: numOrOut(r.izq_int_ent),
      DER_INT_ENT: numOrOut(r.der_int_ent),
      DER_EXT_ENT: numOrOut(r.der_ext_ent),
      IZQ_EXT_SAL: numOrOut(r.izq_ext_sal),
      IZQ_INT_SAL: numOrOut(r.izq_int_sal),
      DER_INT_SAL: numOrOut(r.der_int_sal),
      DER_EXT_SAL: numOrOut(r.der_ext_sal),
      // Compatibilidad con tus labels viejos (PULP_1..4) por si algo los lee:
      PULP_1: numOrOut(r.izq_ext_ent),
      PULP_2: numOrOut(r.izq_int_ent),
      PULP_3: numOrOut(r.der_int_ent),
      PULP_4: numOrOut(r.der_ext_ent),
    }));

    res.json(payload);
  } catch (error) {
    console.error('Error en GET /api/tunnels/:id/history:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

function numOrOut(v: number | null): number | "OUT" {
  return typeof v === "number" ? v : "OUT";
}

// POST /api/tunnels/:id/ingest  → insertar una lectura completa o parcial
app.post("/api/tunnels/:id/ingest", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const now = new Date().toISOString();

    const {
      AMB_OUT = null,
      AMB_RET = null,
      IZQ_EXT_ENT = null,
      IZQ_INT_ENT = null,
      DER_INT_ENT = null,
      DER_EXT_ENT = null,
      IZQ_EXT_SAL = null,
      IZQ_INT_SAL = null,
      DER_INT_SAL = null,
      DER_EXT_SAL = null
    } = req.body ?? {};

    await insertReading({
      tunnel_id: id,
      process_id: null, // Por ahora null, se puede asociar después
      ts: now,
      amb_out: AMB_OUT,
      amb_ret: AMB_RET,
      izq_ext_ent: IZQ_EXT_ENT,
      izq_int_ent: IZQ_INT_ENT,
      der_int_ent: DER_INT_ENT,
      der_ext_ent: DER_EXT_ENT,
      izq_ext_sal: IZQ_EXT_SAL,
      izq_int_sal: IZQ_INT_SAL,
      der_int_sal: DER_INT_SAL,
      der_ext_sal: DER_EXT_SAL,
      fruit: null,
      min_temp: null,
      max_temp: null,
      ideal_min: null,
      ideal_max: null
    });

    res.json({ ok: true, ts: now });
  } catch (error) {
    console.error('Error en POST /api/tunnels/:id/ingest:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/processes → todos los procesos activos
app.get("/api/processes", async (req, res) => {
  try {
    const processes = await getAllProcesses();
    res.json(processes);
  } catch (error) {
    console.error('Error en GET /api/processes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/processes/:tunnelId → proceso específico de un túnel
app.get("/api/processes/:tunnelId", async (req, res) => {
  try {
    const tunnelId = Number(req.params.tunnelId);
    const process = await getProcess(tunnelId);
    
    if (!process) {
      // Retornar proceso por defecto si no existe
      return res.json({
        tunnel_id: tunnelId,
        status: "idle",
        fruit: "GENÉRICA",
        min_temp: 3.5,
        max_temp: 12,
        ideal_min: 4,
        ideal_max: 9,
        state_label: "Libre"
      });
    }
    
    res.json(process);
  } catch (error) {
    console.error('Error en GET /api/processes/:tunnelId:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/processes/:tunnelId/start → iniciar proceso
app.post("/api/processes/:tunnelId/start", requireAuth, async (req, res) => {
  try {
    const tunnelId = Number(req.params.tunnelId);
    const now = new Date().toISOString();
    const userId = req.user.id; // Usuario actual autenticado
    const {
      fruit,
      min_temp,
      max_temp,
      ideal_min,
      ideal_max,
      measure_plan = 15,
      destination = "",
      origin = "",
      condition_initial = "",
      description = ""
    } = req.body;

    console.log(`🔄 Iniciando proceso en túnel ${tunnelId} por usuario ${userId}`);

    // Verificar si ya existe un proceso activo
    const existingProcess = await getProcess(tunnelId);
    if (existingProcess) {
      return res.status(400).json({ error: "Ya existe un proceso activo en este túnel" });
    }

    const newProcess = await createProcess({
      tunnel_id: tunnelId,
      status: "running",
      fruit,
      min_temp,
      max_temp,
      ideal_min,
      ideal_max,
      started_at: now,
      ended_at: null,
      started_by: userId, // Usuario que inicia el proceso
      ended_by: null,
      measure_plan,
      destination,
      origin,
      condition_initial,
      description,
      state_label: "En curso",
      last_change: now
    });

    console.log(`✅ Proceso creado con ID: ${newProcess.id}`);

    // Sincronizar el fruit_type del túnel con la fruta del proceso
    await syncTunnelFruitType(tunnelId);
    console.log(`✅ Fruit_type del túnel ${tunnelId} sincronizado con: ${fruit}`);

    res.json({ ok: true, tunnelId, status: "running", processId: newProcess.id });
  } catch (error) {
    console.error('Error en POST /api/processes/:tunnelId/start:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/processes/:tunnelId/ranges → actualizar rangos
app.put("/api/processes/:tunnelId/ranges", async (req, res) => {
  try {
    const tunnelId = Number(req.params.tunnelId);
    const { min_temp, max_temp, ideal_min, ideal_max } = req.body;
    const now = new Date().toISOString();

    const updatedProcess = await updateProcessByTunnel(tunnelId, {
      min_temp,
      max_temp,
      ideal_min,
      ideal_max,
      last_change: now
    });

    if (!updatedProcess) {
      return res.status(404).json({ error: "Proceso no encontrado" });
    }

    // Sincronizar el fruit_type después de actualizar el proceso
    await syncTunnelFruitType(tunnelId);
    console.log(`✅ Fruit_type del túnel ${tunnelId} sincronizado después de actualizar rangos`);

    res.json({ ok: true });
  } catch (error) {
    console.error('Error en PUT /api/processes/:tunnelId/ranges:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/processes/:tunnelId/pause → pausar proceso
app.post("/api/processes/:tunnelId/pause", async (req, res) => {
  try {
    const tunnelId = Number(req.params.tunnelId);
    const now = new Date().toISOString();

    const updatedProcess = await updateProcessByTunnel(tunnelId, {
      status: "paused",
      last_change: now
    });

    if (!updatedProcess) {
      return res.status(404).json({ error: "Proceso no encontrado" });
    }

    // Sincronizar el fruit_type después de pausar el proceso
    await syncTunnelFruitType(tunnelId);
    console.log(`✅ Fruit_type del túnel ${tunnelId} sincronizado después de pausar`);

    res.json({ ok: true, status: "paused" });
  } catch (error) {
    console.error('Error en POST /api/processes/:tunnelId/pause:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/processes/:tunnelId/resume → reanudar proceso
app.post("/api/processes/:tunnelId/resume", async (req, res) => {
  try {
    const tunnelId = Number(req.params.tunnelId);
    const now = new Date().toISOString();

    const updatedProcess = await updateProcessByTunnel(tunnelId, {
      status: "running",
      last_change: now
    });

    if (!updatedProcess) {
      return res.status(404).json({ error: "Proceso no encontrado" });
    }

    // Sincronizar el fruit_type después de reanudar el proceso
    await syncTunnelFruitType(tunnelId);
    console.log(`✅ Fruit_type del túnel ${tunnelId} sincronizado después de reanudar`);

    res.json({ ok: true, status: "running" });
  } catch (error) {
    console.error('Error en POST /api/processes/:tunnelId/resume:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/processes/:tunnelId/finalize → finalizar proceso
app.post("/api/processes/:tunnelId/finalize", requireAuth, async (req, res) => {
  try {
    const tunnelId = Number(req.params.tunnelId);
    const now = new Date().toISOString();
    const userId = req.user.id; // Usuario actual autenticado

    // Obtener proceso actual
    const process = await getProcess(tunnelId);
    
    if (!process) {
      return res.status(404).json({ error: "Proceso no encontrado" });
    }

    console.log(`📝 Guardando proceso en historial - Túnel: ${tunnelId}, Usuario: ${userId}`);

    // Guardar en historial
    const historyEntry = await insertProcessHistory({
      tunnel_id: tunnelId,
      fruit: process.fruit,
      min_temp: process.min_temp,
      max_temp: process.max_temp,
      ideal_min: process.ideal_min,
      ideal_max: process.ideal_max,
      started_at: process.started_at || now,
      ended_at: now,
      started_by: process.started_by,
      ended_by: userId, // Usuario que finaliza el proceso
      measure_plan: process.measure_plan,
      destination: process.destination,
      origin: process.origin,
      condition_initial: process.condition_initial,
      description: process.description,
      duration_minutes: process.started_at ? 
        Math.round((new Date(now).getTime() - new Date(process.started_at).getTime()) / (1000 * 60)) : 
        null
    });

    console.log(`✅ Proceso guardado en historial con ID: ${historyEntry.id}`);

    // Marcar proceso como finalizado
    console.log(`🔄 Finalizando proceso ${process.id} del túnel ${tunnelId}`);
    
    const updatedProcess = await updateProcess(process.id, {
      status: "finished",
      ended_at: now,
      ended_by: null, // Por ahora null
      last_change: now
    });

    console.log(`✅ Proceso ${process.id} finalizado correctamente. Estado: ${updatedProcess.status}`);

    // Sincronizar el fruit_type después de finalizar el proceso (cambiará a "Sin proceso")
    await syncTunnelFruitType(tunnelId);
    console.log(`✅ Fruit_type del túnel ${tunnelId} sincronizado a 'Sin proceso' después de finalizar`);

    res.json({ ok: true, status: "finished", process: updatedProcess });
  } catch (error) {
    console.error('Error en POST /api/processes/:tunnelId/finalize:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/processes/:tunnelId/history → historial de procesos
app.get("/api/processes/:tunnelId/history", async (req, res) => {
  try {
    const tunnelId = Number(req.params.tunnelId);
    const history = await getProcessHistory(tunnelId);
    
    res.json(history);
  } catch (error) {
    console.error('Error en GET /api/processes/:tunnelId/history:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== ENDPOINTS DE AUTENTICACIÓN =====

// POST /api/auth/login → iniciar sesión
app.post("/api/auth/login", async (req, res) => {
  try {
    const { user_id, password } = req.body;

    if (!user_id || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'user_id y password son requeridos' 
      });
    }

    // Validar credenciales
    const user = await validateCredentials({ user_id, password });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Credenciales inválidas' 
      });
    }

    // Crear sesión
    const session = await createUserSession(user, req);
    
    // Actualizar last_login
    await updateLastLogin(user.id);

    res.json({
      success: true,
      user: {
        id: user.id,
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role_id: user.role_id
      },
      session: {
        token: session.session_token,
        login_time: session.login_time
      }
    });

  } catch (error) {
    console.error('Error en POST /api/auth/login:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// POST /api/auth/logout → cerrar sesión
app.post("/api/auth/logout", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token de sesión requerido' 
      });
    }

    await closeUserSession(token);

    res.json({
      success: true,
      message: 'Sesión cerrada correctamente'
    });

  } catch (error) {
    console.error('Error en POST /api/auth/logout:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// GET /api/auth/me → obtener información del usuario actual
app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      user_id: req.user.user_id,
      full_name: req.user.full_name,
      email: req.user.email,
      role_id: req.user.role_id,
      last_login: req.user.last_login,
      last_logout: req.user.last_logout
    },
    session: {
      id: req.session.id,
      login_time: req.session.login_time,
      ip_address: req.session.ip_address,
      device_info: req.session.device_info
    }
  });
});

// GET /api/auth/sessions → obtener sesiones activas del usuario
app.get("/api/auth/sessions", requireAuth, async (req, res) => {
  try {
    const sessions = await getActiveUserSessions(req.user.id);
    
    res.json({
      success: true,
      sessions: sessions.map(session => ({
        id: session.id,
        login_time: session.login_time,
        ip_address: session.ip_address,
        device_info: session.device_info,
        status: session.status
      }))
    });

  } catch (error) {
    console.error('Error en GET /api/auth/sessions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// POST /api/auth/logout-all → cerrar todas las sesiones
app.post("/api/auth/logout-all", requireAuth, async (req, res) => {
  try {
    await closeAllUserSessions(req.user.id);
    
    res.json({
      success: true,
      message: 'Todas las sesiones cerradas correctamente'
    });

  } catch (error) {
    console.error('Error en POST /api/auth/logout-all:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// ===== ENDPOINTS DE ALERTAS =====

// GET /api/alerts → alertas activas
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await getActiveAlerts();
    res.json(alerts);
  } catch (error) {
    console.error('Error en GET /api/alerts:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/alerts/tunnel/:tunnelId → alertas por túnel
app.get("/api/alerts/tunnel/:tunnelId", async (req, res) => {
  try {
    const tunnelId = Number(req.params.tunnelId);
    const alerts = await getAlertsByTunnel(tunnelId);
    res.json(alerts);
  } catch (error) {
    console.error('Error en GET /api/alerts/tunnel/:tunnelId:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/alerts/:alertId/acknowledge → reconocer alerta
app.post("/api/alerts/:alertId/acknowledge", async (req, res) => {
  try {
    const alertId = req.params.alertId;
    const { acknowledged_by = "Sistema" } = req.body;
    
    const alert = await acknowledgeAlert(alertId, acknowledged_by);
    res.json(alert);
  } catch (error) {
    console.error('Error en POST /api/alerts/:alertId/acknowledge:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/alerts/:alertId/resolve → resolver alerta
app.post("/api/alerts/:alertId/resolve", async (req, res) => {
  try {
    const alertId = req.params.alertId;
    
    const alert = await resolveAlert(alertId);
    res.json(alert);
  } catch (error) {
    console.error('Error en POST /api/alerts/:alertId/resolve:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/alerts/stats → estadísticas de alertas
app.get("/api/alerts/stats", async (req, res) => {
  try {
    const stats = await getAlertStats();
    res.json(stats);
  } catch (error) {
    console.error('Error en GET /api/alerts/stats:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 API Supabase Real listening on http://localhost:${PORT}`);
  console.log(`📊 Database: Supabase (Esquema Real)`);
  console.log(`🔗 URL: https://bspnwhogpxjkxitrlnug.supabase.co`);
});
