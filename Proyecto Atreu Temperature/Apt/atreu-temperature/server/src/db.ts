import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

// Ruta al archivo de base de datos (server/data/apt.db)
const DATA_DIR = path.resolve(process.cwd(), "server", "data");
const DB_FILE = path.join(DATA_DIR, "apt.db");

// Asegura carpeta /data
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Abre/crea la DB
export const db = new Database(DB_FILE);

// Pragmas útiles para SQLite embebido
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");
db.pragma("foreign_keys = ON");

// --- Esquema ---
db.exec(`
  CREATE TABLE IF NOT EXISTS tunnels (
    id     INTEGER PRIMARY KEY,
    fruit  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS readings (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    tunnel_id     INTEGER NOT NULL,
    ts            TEXT NOT NULL, -- ISO string
    amb_out       REAL,
    amb_ret       REAL,
    izq_ext_ent   REAL,
    izq_int_ent   REAL,
    der_int_ent   REAL,
    der_ext_ent   REAL,
    izq_ext_sal   REAL,
    izq_int_sal   REAL,
    der_int_sal   REAL,
    der_ext_sal   REAL,
    FOREIGN KEY (tunnel_id) REFERENCES tunnels(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_readings_tunnel_ts
    ON readings (tunnel_id, ts DESC);

  -- Tabla de procesos activos en cada túnel
  CREATE TABLE IF NOT EXISTS processes (
    tunnel_id     INTEGER PRIMARY KEY,
    status        TEXT NOT NULL CHECK(status IN ('idle', 'running', 'paused', 'finished')),
    fruit         TEXT NOT NULL,
    min_temp      REAL NOT NULL,
    max_temp      REAL NOT NULL,
    ideal_min     REAL NOT NULL,
    ideal_max     REAL NOT NULL,
    started_at    TEXT,
    started_by    TEXT,
    ended_at      TEXT,
    ended_by      TEXT,
    measure_plan  INTEGER,
    destination   TEXT,
    origin        TEXT,
    condition_initial TEXT,
    state_label   TEXT,
    last_change   TEXT,
    FOREIGN KEY (tunnel_id) REFERENCES tunnels(id) ON DELETE CASCADE
  );

  -- Historial de procesos finalizados
  CREATE TABLE IF NOT EXISTS process_history (
    id            TEXT PRIMARY KEY,
    tunnel_id     INTEGER NOT NULL,
    fruit         TEXT NOT NULL,
    min_temp      REAL NOT NULL,
    max_temp      REAL NOT NULL,
    ideal_min     REAL NOT NULL,
    ideal_max     REAL NOT NULL,
    started_at    TEXT NOT NULL,
    ended_at      TEXT NOT NULL,
    ended_by      TEXT NOT NULL,
    measure_plan  INTEGER,
    destination   TEXT,
    origin        TEXT,
    condition_initial TEXT,
    FOREIGN KEY (tunnel_id) REFERENCES tunnels(id) ON DELETE CASCADE
  );
`);

// --- Seed de túneles (1..7) ---
const seedTunnels = db.prepare(`
  INSERT INTO tunnels (id, fruit) VALUES (?, ?)
  ON CONFLICT(id) DO UPDATE SET fruit = excluded.fruit
`);
const fruits = [
  "Manzana Gala", "Manzana Fuji", "Pera Packham",
  "Uva Red Globe", "Arándano", "Cereza", "Kiwi"
];
for (let i = 1; i <= 7; i++) {
  seedTunnels.run(i, fruits[(i - 1) % fruits.length]);
}

// (opcional) util para limpiar lecturas antiguas — no se usa automáticamente
export function purgeOlderThan(days = 7) {
  db.prepare(
    `DELETE FROM readings WHERE ts < datetime('now', ?)`
  ).run(`-${days} days`);
}
