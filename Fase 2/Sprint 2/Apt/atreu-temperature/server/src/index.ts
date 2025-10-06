import express from "express";
import cors from "cors";
import { db } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

// GET /api/tunnels → lista con última lectura (si existe)
app.get("/api/tunnels", (req, res) => {
  const tunnels = db.prepare(`SELECT id, fruit FROM tunnels ORDER BY id`).all();
  const lastStmt = db.prepare(`
    SELECT * FROM readings
    WHERE tunnel_id = ?
    ORDER BY ts DESC
    LIMIT 1
  `);
  const result = tunnels.map(t => {
    const last = lastStmt.get(t.id);
    return {
      id: t.id,
      fruit: t.fruit,
      sensors: last ? {
        AMB_OUT: last.amb_out,
        AMB_RET: last.amb_ret,
        PULP_1: last.izq_ext_ent,  // mapeo a tus “pulpa” actuales
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
  `).all(id, `-${minutes} minutes`);

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

// Health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
