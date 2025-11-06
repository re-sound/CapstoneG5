import express from "express";
import cors from "cors";
import { 
  getTunnels, 
  getLastReading, 
  getReadingsHistory, 
  insertReading,
  getAllProcesses,
  getProcess,
  upsertProcess,
  updateProcess,
  deleteProcess,
  getProcessHistory,
  insertProcessHistory
} from "./supabase-db.js";
import { syncTunnelFruitType } from "./sync-fruit-type.js";
import { supabase } from "./supabase.js";

const app = express();
app.use(cors());
app.use(express.json());

// Ruta raíz - información de la API
app.get("/", (_req, res) => {
  res.json({
    name: "Atreu Temperature API (Supabase)",
    version: "1.0.0",
    status: "running",
    database: "Supabase",
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
    const tunnels = await getTunnels();
    const result = await Promise.all(tunnels.map(async (t) => {
      const last = await getLastReading(t.id);
      return {
        id: t.id,
        fruit: t.fruit,
        sensors: last ? {
          AMB_OUT: last.amb_out,
          AMB_RET: last.amb_ret,
          PULP_1: last.izq_ext_ent,  // mapeo a tus "pulpa" actuales
          PULP_2: last.izq_int_ent,
          PULP_3: last.der_int_ent,
          PULP_4: last.der_ext_ent
        } : null
      };
    }));
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
      der_ext_sal: DER_EXT_SAL
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
app.post("/api/processes/:tunnelId/start", async (req, res) => {
  try {
    const tunnelId = Number(req.params.tunnelId);
    const now = new Date().toISOString();
    const {
      fruit,
      min_temp,
      max_temp,
      ideal_min,
      ideal_max,
      started_by = "Operador",
      measure_plan = 15,
      destination = "",
      origin = "",
      condition_initial = ""
    } = req.body;

    // Verificar si ya existe un proceso activo
    const existingProcess = await getProcess(tunnelId);
    
    if (existingProcess) {
      // Si existe, actualizar el proceso existente
      await updateProcess(tunnelId, {
        status: "running",
        fruit,
        min_temp,
        max_temp,
        ideal_min,
        ideal_max,
        started_at: now,
        started_by,
        ended_at: null,
        ended_by: null,
        measure_plan,
        destination,
        origin,
        condition_initial,
        state_label: "Ocupado",
        last_change: now
      });
    } else {
      // Si no existe, crear un nuevo proceso
      const newProcess = {
        tunnel_id: tunnelId,
        status: "running" as const,
        fruit,
        min_temp,
        max_temp,
        ideal_min,
        ideal_max,
        started_at: now,
        started_by,
        ended_at: null,
        ended_by: null,
        measure_plan,
        destination,
        origin,
        condition_initial,
        state_label: "Ocupado" as const,
        last_change: now
      };

      // Insertar directamente sin upsert (solo los campos necesarios)
      const { error: insertError } = await supabase
        .from('processes')
        .insert([{
          tunnel_id: tunnelId,
          status: "running",
          fruit,
          min_temp,
          max_temp,
          ideal_min,
          ideal_max,
          started_at: now,
          started_by,
          measure_plan,
          destination,
          origin,
          condition_initial,
          state_label: "Ocupado",
          last_change: now
        }]);

      if (insertError) {
        throw new Error(`Error creando proceso: ${insertError.message}`);
      }
    }

    // Sincronizar el fruit_type del túnel con la fruta del proceso
    await syncTunnelFruitType(tunnelId);
    console.log(`✅ Fruit_type del túnel ${tunnelId} sincronizado con: ${fruit}`);

    res.json({ ok: true, tunnelId, status: "running" });
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

    await updateProcess(tunnelId, {
      min_temp,
      max_temp,
      ideal_min,
      ideal_max,
      last_change: now
    });

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

    await updateProcess(tunnelId, {
      status: "paused",
      last_change: now
    });

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

    await updateProcess(tunnelId, {
      status: "running",
      last_change: now
    });

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
app.post("/api/processes/:tunnelId/finalize", async (req, res) => {
  try {
    const tunnelId = Number(req.params.tunnelId);
    const { ended_by = "Operador" } = req.body;
    const now = new Date().toISOString();

    // Obtener proceso actual
    const process = await getProcess(tunnelId);
    
    if (!process) {
      return res.status(404).json({ error: "Proceso no encontrado" });
    }

    // Guardar en historial
    const historyId = `${tunnelId}-${now}`;
    await insertProcessHistory({
      id: historyId,
      tunnel_id: tunnelId,
      fruit: process.fruit,
      min_temp: process.min_temp,
      max_temp: process.max_temp,
      ideal_min: process.ideal_min,
      ideal_max: process.ideal_max,
      started_at: process.started_at || now,
      ended_at: now,
      ended_by,
      measure_plan: process.measure_plan,
      destination: process.destination,
      origin: process.origin,
      condition_initial: process.condition_initial
    });

    // Eliminar proceso activo (volver a idle)
    await deleteProcess(tunnelId);

    // Sincronizar el fruit_type después de finalizar el proceso (cambiará a "Sin proceso")
    await syncTunnelFruitType(tunnelId);
    console.log(`✅ Fruit_type del túnel ${tunnelId} sincronizado a 'Sin proceso' después de finalizar`);

    res.json({ ok: true, status: "idle" });
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

// Health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 API Supabase listening on http://localhost:${PORT}`);
  console.log(`📊 Database: Supabase`);
});
