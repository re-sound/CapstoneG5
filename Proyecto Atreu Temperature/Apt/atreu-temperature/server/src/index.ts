import express from "express";
import cors from "cors";
import { db } from "./db.js";

// Tipos para las filas de la base de datos
interface TunnelRow {
  id: number;
  fruit: string;
}

interface ReadingRow {
  id: number;
  tunnel_id: number;
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
}

const app = express();
app.use(cors());
app.use(express.json());

// Ruta raíz - información de la API
app.get("/", (_req, res) => {
  res.json({
    name: "Atreu Temperature API",
    version: "1.0.0",
    status: "running",
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
app.get("/api/tunnels", (req, res) => {
  const tunnels = db.prepare(`SELECT id, fruit FROM tunnels ORDER BY id`).all() as TunnelRow[];
  const lastStmt = db.prepare(`
    SELECT * FROM readings
    WHERE tunnel_id = ?
    ORDER BY ts DESC
    LIMIT 1
  `);
  const result = tunnels.map(t => {
    const last = lastStmt.get(t.id) as ReadingRow | undefined;
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
  });
  res.json(result);
});

// GET /api/tunnels/:id/history?minutes=60
app.get("/api/tunnels/:id/history", (req, res) => {
  const id = Number(req.params.id);
  const minutes = Number(req.query.minutes ?? 60);
  // últimas N lecturas aproximando 1/min (si simulas cada 40s tendrás ~1.5x)
  const rows = db.prepare(`
    SELECT *
    FROM readings
    WHERE tunnel_id = ?
      AND ts >= datetime('now', ?)
    ORDER BY ts ASC
  `).all(id, `-${minutes} minutes`) as ReadingRow[];

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
});

function numOrOut(v: number | null): number | "OUT" {
  return typeof v === "number" ? v : "OUT";
}

// POST /api/tunnels/:id/ingest  → insertar una lectura completa o parcial
app.post("/api/tunnels/:id/ingest", (req, res) => {
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

  const stmt = db.prepare(`
    INSERT INTO readings
    (tunnel_id, ts, amb_out, amb_ret, izq_ext_ent, izq_int_ent, der_int_ent, der_ext_ent,
     izq_ext_sal, izq_int_sal, der_int_sal, der_ext_sal)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id, now,
    AMB_OUT, AMB_RET,
    IZQ_EXT_ENT, IZQ_INT_ENT, DER_INT_ENT, DER_EXT_ENT,
    IZQ_EXT_SAL, IZQ_INT_SAL, DER_INT_SAL, DER_EXT_SAL
  );

  res.json({ ok: true, ts: now });
});

// GET /api/processes → todos los procesos activos
app.get("/api/processes", (_req, res) => {
  const processes = db.prepare(`SELECT * FROM processes`).all();
  res.json(processes);
});

// GET /api/processes/:tunnelId → proceso específico de un túnel
app.get("/api/processes/:tunnelId", (req, res) => {
  const tunnelId = Number(req.params.tunnelId);
  const process = db.prepare(`SELECT * FROM processes WHERE tunnel_id = ?`).get(tunnelId);
  
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
});

// POST /api/processes/:tunnelId/start → iniciar proceso
app.post("/api/processes/:tunnelId/start", (req, res) => {
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

  db.prepare(`
    INSERT INTO processes (
      tunnel_id, status, fruit, min_temp, max_temp, ideal_min, ideal_max,
      started_at, started_by, measure_plan, destination, origin, condition_initial,
      state_label, last_change
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(tunnel_id) DO UPDATE SET
      status = excluded.status,
      fruit = excluded.fruit,
      min_temp = excluded.min_temp,
      max_temp = excluded.max_temp,
      ideal_min = excluded.ideal_min,
      ideal_max = excluded.ideal_max,
      started_at = excluded.started_at,
      started_by = excluded.started_by,
      measure_plan = excluded.measure_plan,
      destination = excluded.destination,
      origin = excluded.origin,
      condition_initial = excluded.condition_initial,
      state_label = excluded.state_label,
      last_change = excluded.last_change
  `).run(
    tunnelId, "running", fruit, min_temp, max_temp, ideal_min, ideal_max,
    now, started_by, measure_plan, destination, origin, condition_initial,
    "Ocupado", now
  );

  res.json({ ok: true, tunnelId, status: "running" });
});

// PUT /api/processes/:tunnelId/ranges → actualizar rangos
app.put("/api/processes/:tunnelId/ranges", (req, res) => {
  const tunnelId = Number(req.params.tunnelId);
  const { min_temp, max_temp, ideal_min, ideal_max } = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE processes 
    SET min_temp = ?, max_temp = ?, ideal_min = ?, ideal_max = ?, last_change = ?
    WHERE tunnel_id = ?
  `).run(min_temp, max_temp, ideal_min, ideal_max, now, tunnelId);

  res.json({ ok: true });
});

// POST /api/processes/:tunnelId/pause → pausar proceso
app.post("/api/processes/:tunnelId/pause", (req, res) => {
  const tunnelId = Number(req.params.tunnelId);
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE processes SET status = 'paused', last_change = ? WHERE tunnel_id = ?
  `).run(now, tunnelId);

  res.json({ ok: true, status: "paused" });
});

// POST /api/processes/:tunnelId/resume → reanudar proceso
app.post("/api/processes/:tunnelId/resume", (req, res) => {
  const tunnelId = Number(req.params.tunnelId);
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE processes SET status = 'running', last_change = ? WHERE tunnel_id = ?
  `).run(now, tunnelId);

  res.json({ ok: true, status: "running" });
});

// POST /api/processes/:tunnelId/finalize → finalizar proceso
app.post("/api/processes/:tunnelId/finalize", (req, res) => {
  const tunnelId = Number(req.params.tunnelId);
  const { ended_by = "Operador" } = req.body;
  const now = new Date().toISOString();

  // Obtener proceso actual
  const process = db.prepare(`SELECT * FROM processes WHERE tunnel_id = ?`).get(tunnelId) as any;
  
  if (!process) {
    return res.status(404).json({ error: "Proceso no encontrado" });
  }

  // Guardar en historial
  const historyId = `${tunnelId}-${now}`;
  db.prepare(`
    INSERT INTO process_history (
      id, tunnel_id, fruit, min_temp, max_temp, ideal_min, ideal_max,
      started_at, ended_at, ended_by, measure_plan, destination, origin, condition_initial
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    historyId, tunnelId, process.fruit, process.min_temp, process.max_temp,
    process.ideal_min, process.ideal_max, process.started_at, now, ended_by,
    process.measure_plan, process.destination, process.origin, process.condition_initial
  );

  // Eliminar proceso activo (volver a idle)
  db.prepare(`DELETE FROM processes WHERE tunnel_id = ?`).run(tunnelId);

  res.json({ ok: true, status: "idle" });
});

// GET /api/processes/:tunnelId/history → historial de procesos
app.get("/api/processes/:tunnelId/history", (req, res) => {
  const tunnelId = Number(req.params.tunnelId);
  const history = db.prepare(`
    SELECT * FROM process_history WHERE tunnel_id = ? ORDER BY ended_at DESC
  `).all(tunnelId);
  
  res.json(history);
});

// Health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
