import { insertReading, getProcess } from "./supabase-db-real.js";
import { processReadingForAlerts } from "./alerts-supabase.js";

/**
 * Simulador de datos para Supabase (esquema real)
 * Genera lecturas realistas cada 40 segundos
 * Inserta SIEMPRE lecturas para el dashboard en tiempo real.
 * Las alertas SOLO se evalúan cuando hay proceso activo.
 */

function randomTemp(min: number, max: number): number {
  return +(min + Math.random() * (max - min)).toFixed(1);
}

async function seedOne(tunnelId: number) {
  const now = new Date().toISOString();

  const isAnomalous = Math.random() < 0.2; // 20% anomalías
  const sensorOut = () => (Math.random() < 0.05 ? null : undefined); // 5% OUT

  let ambOut, ambRet, izqExtEnt, izqIntEnt, derIntEnt, derExtEnt;
  let izqExtSal, izqIntSal, derIntSal, derExtSal;

  if (isAnomalous) {
    const anomalyType = Math.random();
    if (anomalyType < 0.3) {
      ambOut = randomTemp(1.5, 3.5);
      ambRet = randomTemp(1.0, 3.0);
      izqExtEnt = randomTemp(2.0, 4.0);
      izqIntEnt = randomTemp(1.5, 3.5);
      derIntEnt = randomTemp(2.0, 3.5);
      derExtEnt = randomTemp(1.8, 3.8);
    } else if (anomalyType < 0.6) {
      ambOut = randomTemp(12.0, 15.0);
      ambRet = randomTemp(11.0, 14.0);
      izqExtEnt = randomTemp(11.5, 14.5);
      izqIntEnt = randomTemp(12.0, 15.0);
      derIntEnt = randomTemp(11.5, 14.0);
      derExtEnt = randomTemp(12.5, 15.0);
    } else {
      ambOut = randomTemp(10.0, 13.0);
      ambRet = randomTemp(2.0, 4.0);
      izqExtEnt = randomTemp(11.0, 14.0);
      izqIntEnt = randomTemp(3.0, 5.0);
      derIntEnt = randomTemp(2.5, 4.5);
      derExtEnt = randomTemp(12.0, 15.0);
    }
    izqExtSal = randomTemp(10.0, 14.0);
    izqIntSal = randomTemp(2.0, 5.0);
    derIntSal = randomTemp(11.0, 15.0);
    derExtSal = randomTemp(1.5, 4.0);
  } else {
    const baseTemp = 5.0 + (tunnelId % 3) * 1.5; // 5.0, 6.5, 8.0
    ambOut = randomTemp(baseTemp - 1.0, baseTemp + 3.0);
    ambRet = randomTemp(baseTemp - 1.5, baseTemp + 2.0);
    izqExtEnt = randomTemp(baseTemp - 0.5, baseTemp + 2.5);
    izqIntEnt = randomTemp(baseTemp - 0.8, baseTemp + 2.0);
    derIntEnt = randomTemp(baseTemp - 0.6, baseTemp + 2.2);
    derExtEnt = randomTemp(baseTemp - 0.4, baseTemp + 2.8);
    izqExtSal = randomTemp(baseTemp + 0.5, baseTemp + 3.5);
    izqIntSal = randomTemp(baseTemp + 0.3, baseTemp + 3.0);
    derIntSal = randomTemp(baseTemp + 0.4, baseTemp + 3.2);
    derExtSal = randomTemp(baseTemp + 0.6, baseTemp + 3.8);
  }

  const values = {
    ambOut: sensorOut() ?? ambOut,
    ambRet: sensorOut() ?? ambRet,
    izqExtEnt: sensorOut() ?? izqExtEnt,
    izqIntEnt: sensorOut() ?? izqIntEnt,
    derIntEnt: sensorOut() ?? derIntEnt,
    derExtEnt: sensorOut() ?? derExtEnt,
    izqExtSal: sensorOut() ?? izqExtSal,
    izqIntSal: sensorOut() ?? izqIntSal,
    derIntSal: sensorOut() ?? derIntSal,
    derExtSal: sensorOut() ?? derExtSal,
  };

  try {
    const process = await getProcess(tunnelId);

    // Insertar lectura SIEMPRE (independiente de proceso)
    const reading = await insertReading({
      tunnel_id: tunnelId,
      process_id: process ? process.id : null,
      ts: now,
      amb_out: values.ambOut,
      amb_ret: values.ambRet,
      izq_ext_ent: values.izqExtEnt,
      izq_int_ent: values.izqIntEnt,
      der_int_ent: values.derIntEnt,
      der_ext_ent: values.derExtEnt,
      izq_ext_sal: values.izqExtSal,
      izq_int_sal: values.izqIntSal,
      der_int_sal: values.derIntSal,
      der_ext_sal: values.derExtSal,
      fruit: process ? process.fruit : null,
      min_temp: process ? process.min_temp : null,
      max_temp: process ? process.max_temp : null,
      ideal_min: process ? process.ideal_min : null,
      ideal_max: process ? process.ideal_max : null,
    });

    // Procesar alertas SOLO si hay proceso activo
    if (process) {
      const alerts = await processReadingForAlerts(
        reading.id,
        tunnelId,
        process.id,
        process.fruit,
        {
          amb_out: values.ambOut ?? "OUT",
          amb_ret: values.ambRet ?? "OUT",
          izq_ext_ent: values.izqExtEnt ?? "OUT",
          izq_int_ent: values.izqIntEnt ?? "OUT",
          der_int_ent: values.derIntEnt ?? "OUT",
          der_ext_ent: values.derExtEnt ?? "OUT",
          izq_ext_sal: values.izqExtSal ?? "OUT",
          izq_int_sal: values.izqIntSal ?? "OUT",
          der_int_sal: values.derIntSal ?? "OUT",
          der_ext_sal: values.derExtSal ?? "OUT",
        },
        {
          min_temp: process.min_temp,
          max_temp: process.max_temp,
        }
      );

      if (isAnomalous) {
        console.log(`⚠️  Túnel ${tunnelId}: Lectura anómala (AMB_OUT: ${values.ambOut ?? "OUT"}°C)`);
      }
      if (alerts.length > 0) {
        console.log(`🚨 Túnel ${tunnelId}: ${alerts.length} alertas generadas`);
      }
    } else {
      if (isAnomalous) {
        console.log(`⚠️  Túnel ${tunnelId}: Lectura anómala sin proceso (AMB_OUT: ${values.ambOut ?? "OUT"}°C)`);
      }
    }
  } catch (error) {
    console.error(`❌ Error insertando lectura para túnel ${tunnelId}:`, error);
  }
}

console.log("🔄 Simulador Supabase Real ON - Lecturas dinámicas según measure_plan");
console.log("📊 Rango de temperaturas: 3°C - 15°C");
console.log("⚠️  20% de probabilidad de datos anómalos por ciclo");
console.log("🚨 Sistema de alertas: condicionado al proceso activo");
console.log("✅ Lecturas SIEMPRE activas (dashboard en tiempo real)");
console.log("� Intervalos: 1min (measure_plan=1), 5min (=5), 15min (=15), 40s (sin proceso)");
console.log("�🔗 Base de datos: Supabase (Esquema Real)");
console.log("---");

// Mantener seguimiento del último ciclo de cada túnel
const lastInsertTime: Map<number, number> = new Map();

async function seedAll() {
  const timestamp = new Date().toLocaleTimeString('es-ES');
  const now = Date.now();
  
  console.log(`[${timestamp}] Evaluando lecturas para 7 túneles...`);
  
  try {
    for (let i = 1; i <= 7; i++) {
      const process = await getProcess(i);
      let intervalMs = 40000; // Default: 40s sin proceso
      
      if (process && process.status === 'running') {
        // Usar measure_plan del proceso activo
        const measurePlan = process.measure_plan || 15;
        intervalMs = measurePlan * 60 * 1000; // Convertir minutos a ms
      }
      
      const lastInsert = lastInsertTime.get(i) || 0;
      const elapsed = now - lastInsert;
      
      if (elapsed >= intervalMs) {
        await seedOne(i);
        lastInsertTime.set(i, now);
        
        if (process && process.status === 'running') {
          console.log(`  ✓ Túnel ${i}: Lectura insertada (intervalo: ${process.measure_plan || 15}min)`);
        }
      }
    }
  } catch (error) {
    console.error(`❌ [${timestamp}] Error insertando lecturas:`, error);
  }
}

// Ejecutar cada 10 segundos para evaluar si es momento de insertar
seedAll();
setInterval(seedAll, 10000);