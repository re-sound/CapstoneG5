import { db } from "./db.js";

function jitter(base: number, spread = 0.6) {
  return +(base + (Math.random() - 0.5) * spread).toFixed(1);
}

function seedOne(tunnelId: number) {
  // base por túnel (sólo ejemplo)
  const base = 8 + (tunnelId % 3) * 0.7;

  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO readings
    (tunnel_id, ts, amb_out, amb_ret, izq_ext_ent, izq_int_ent, der_int_ent, der_ext_ent,
     izq_ext_sal, izq_int_sal, der_int_sal, der_ext_sal)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    tunnelId, now,
    jitter(base + 1.8),    // AMB_OUT (ambiente)
    jitter(base - 0.6),    // AMB_RET (retorno)
    jitter(base + 0.2),    // IZQ_EXT_ENT
    jitter(base - 0.1),    // IZQ_INT_ENT
    jitter(base - 0.3),    // DER_INT_ENT
    jitter(base + 0.3),    // DER_EXT_ENT
    null, null, null, null // SALIDA (si no hay, null)
  );
}

console.log("Simulador ON (insertando lecturas cada ~40s)...");
seedAll();
setInterval(seedAll, 40000); // 40s

function seedAll() {
  for (let id = 1; id <= 7; id++) seedOne(id);
}
