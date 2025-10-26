import { supabase } from './supabase.js';

/**
 * Script de migración de SQLite a Supabase
 * Ejecutar una sola vez para crear las tablas y datos iniciales
 */

async function createTables() {
  console.log('🔄 Creando tablas en Supabase...');

  // 1. Crear tabla tunnels
  const { error: tunnelsError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS tunnels (
        id INTEGER PRIMARY KEY,
        fruit TEXT NOT NULL
      );
    `
  });

  if (tunnelsError) {
    console.error('Error creando tabla tunnels:', tunnelsError);
    return false;
  }

  // 2. Crear tabla readings
  const { error: readingsError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS readings (
        id SERIAL PRIMARY KEY,
        tunnel_id INTEGER NOT NULL,
        ts TIMESTAMPTZ NOT NULL,
        amb_out REAL,
        amb_ret REAL,
        izq_ext_ent REAL,
        izq_int_ent REAL,
        der_int_ent REAL,
        der_ext_ent REAL,
        izq_ext_sal REAL,
        izq_int_sal REAL,
        der_int_sal REAL,
        der_ext_sal REAL,
        FOREIGN KEY (tunnel_id) REFERENCES tunnels(id) ON DELETE CASCADE
      );
    `
  });

  if (readingsError) {
    console.error('Error creando tabla readings:', readingsError);
    return false;
  }

  // 3. Crear tabla processes
  const { error: processesError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS processes (
        tunnel_id INTEGER PRIMARY KEY,
        status TEXT NOT NULL CHECK(status IN ('idle', 'running', 'paused', 'finished')),
        fruit TEXT NOT NULL,
        min_temp REAL NOT NULL,
        max_temp REAL NOT NULL,
        ideal_min REAL NOT NULL,
        ideal_max REAL NOT NULL,
        started_at TIMESTAMPTZ,
        started_by TEXT,
        ended_at TIMESTAMPTZ,
        ended_by TEXT,
        measure_plan INTEGER,
        destination TEXT,
        origin TEXT,
        condition_initial TEXT,
        state_label TEXT,
        last_change TIMESTAMPTZ,
        FOREIGN KEY (tunnel_id) REFERENCES tunnels(id) ON DELETE CASCADE
      );
    `
  });

  if (processesError) {
    console.error('Error creando tabla processes:', processesError);
    return false;
  }

  // 4. Crear tabla process_history
  const { error: historyError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS process_history (
        id TEXT PRIMARY KEY,
        tunnel_id INTEGER NOT NULL,
        fruit TEXT NOT NULL,
        min_temp REAL NOT NULL,
        max_temp REAL NOT NULL,
        ideal_min REAL NOT NULL,
        ideal_max REAL NOT NULL,
        started_at TIMESTAMPTZ NOT NULL,
        ended_at TIMESTAMPTZ NOT NULL,
        ended_by TEXT NOT NULL,
        measure_plan INTEGER,
        destination TEXT,
        origin TEXT,
        condition_initial TEXT,
        FOREIGN KEY (tunnel_id) REFERENCES tunnels(id) ON DELETE CASCADE
      );
    `
  });

  if (historyError) {
    console.error('Error creando tabla process_history:', historyError);
    return false;
  }

  // 5. Crear índices
  const { error: indexError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE INDEX IF NOT EXISTS idx_readings_tunnel_ts 
      ON readings (tunnel_id, ts DESC);
      
      CREATE INDEX IF NOT EXISTS idx_processes_status 
      ON processes (status);
    `
  });

  if (indexError) {
    console.error('Error creando índices:', indexError);
    return false;
  }

  console.log('✅ Tablas creadas exitosamente');
  return true;
}

async function seedInitialData() {
  console.log('🌱 Insertando datos iniciales...');

  const fruits = [
    "Manzana Gala", "Manzana Fuji", "Pera Packham",
    "Uva Red Globe", "Arándano", "Cereza", "Kiwi"
  ];

  const tunnels = fruits.map((fruit, index) => ({
    id: index + 1,
    fruit
  }));

  const { error } = await supabase
    .from('tunnels')
    .upsert(tunnels, { onConflict: 'id' });

  if (error) {
    console.error('Error insertando túneles:', error);
    return false;
  }

  console.log('✅ Datos iniciales insertados');
  return true;
}

async function migrate() {
  console.log('🚀 Iniciando migración a Supabase...');
  
  try {
    const tablesCreated = await createTables();
    if (!tablesCreated) {
      console.error('❌ Error creando tablas');
      return;
    }

    const dataSeeded = await seedInitialData();
    if (!dataSeeded) {
      console.error('❌ Error insertando datos iniciales');
      return;
    }

    console.log('🎉 Migración completada exitosamente!');
    console.log('📝 Próximos pasos:');
    console.log('1. Configura las variables de entorno SUPABASE_URL y SUPABASE_ANON_KEY');
    console.log('2. Ejecuta el servidor con: npm run dev');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  }
}

// Ejecutar migración si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate();
}

export { migrate };
