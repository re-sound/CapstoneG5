import { insertReading } from "./supabase-db-real.js";

/**
 * Simulador de datos para Supabase (esquema real)
 * Genera lecturas realistas cada 40 segundos
 */

/**
 * Genera un valor aleatorio con mayor variación
 * @param min - Valor mínimo
 * @param max - Valor máximo
 * @returns Temperatura redondeada a 1 decimal
 */
function randomTemp(min: number, max: number): number {
  return +(min + Math.random() * (max - min)).toFixed(1);
}

/**
 * Genera lecturas para un túnel con variación realista (3-15°C)
 * Ocasionalmente genera valores extremos para activar alarmas
 */
async function seedOne(tunnelId: number) {
  const now = new Date().toISOString();
  
  // 20% de probabilidad de generar datos anómalos (para activar alarmas)
  const isAnomalous = Math.random() < 0.2;
  
  // 5% de probabilidad de que un sensor esté desconectado
  const sensorOut = () => Math.random() < 0.05 ? null : undefined;

  let ambOut, ambRet, izqExtEnt, izqIntEnt, derIntEnt, derExtEnt;
  let izqExtSal, izqIntSal, derIntSal, derExtSal;

  if (isAnomalous) {
    // Datos anómalos: temperaturas muy bajas o muy altas
    const anomalyType = Math.random();
    
    if (anomalyType < 0.3) {
      // Temperatura MUY BAJA (puede activar alarma)
      ambOut = randomTemp(1.5, 3.5);
      ambRet = randomTemp(1.0, 3.0);
      izqExtEnt = randomTemp(2.0, 4.0);
      izqIntEnt = randomTemp(1.5, 3.5);
      derIntEnt = randomTemp(2.0, 3.5);
      derExtEnt = randomTemp(1.8, 3.8);
    } else if (anomalyType < 0.6) {
      // Temperatura MUY ALTA (puede activar alarma)
      ambOut = randomTemp(12.0, 15.0);
      ambRet = randomTemp(11.0, 14.0);
      izqExtEnt = randomTemp(11.5, 14.5);
      izqIntEnt = randomTemp(12.0, 15.0);
      derIntEnt = randomTemp(11.5, 14.0);
      derExtEnt = randomTemp(12.5, 15.0);
    } else {
      // Temperatura MIXTA (algunos sensores altos, otros bajos)
      ambOut = randomTemp(10.0, 13.0);
      ambRet = randomTemp(2.0, 4.0);
      izqExtEnt = randomTemp(11.0, 14.0);
      izqIntEnt = randomTemp(3.0, 5.0);
      derIntEnt = randomTemp(2.5, 4.5);
      derExtEnt = randomTemp(12.0, 15.0);
    }
    
    // Sensores de salida con valores anómalos
    izqExtSal = randomTemp(10.0, 14.0);
    izqIntSal = randomTemp(2.0, 5.0);
    derIntSal = randomTemp(11.0, 15.0);
    derExtSal = randomTemp(1.5, 4.0);
    
  } else {
    // Datos normales: rango típico de refrigeración (3-9°C)
    // Cada túnel tiene una "base" ligeramente diferente
    const baseTemp = 5.0 + (tunnelId % 3) * 1.5; // 5.0, 6.5, 8.0
    
    ambOut = randomTemp(baseTemp - 1.0, baseTemp + 3.0);
    ambRet = randomTemp(baseTemp - 1.5, baseTemp + 2.0);
    izqExtEnt = randomTemp(baseTemp - 0.5, baseTemp + 2.5);
    izqIntEnt = randomTemp(baseTemp - 0.8, baseTemp + 2.0);
    derIntEnt = randomTemp(baseTemp - 0.6, baseTemp + 2.2);
    derExtEnt = randomTemp(baseTemp - 0.4, baseTemp + 2.8);
    
    // Sensores de salida (generalmente un poco más cálidos)
    izqExtSal = randomTemp(baseTemp + 0.5, baseTemp + 3.5);
    izqIntSal = randomTemp(baseTemp + 0.3, baseTemp + 3.0);
    derIntSal = randomTemp(baseTemp + 0.4, baseTemp + 3.2);
    derExtSal = randomTemp(baseTemp + 0.6, baseTemp + 3.8);
  }

  // Aplicar posibilidad de sensor desconectado
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
    await insertReading({
      tunnel_id: tunnelId,
      process_id: null, // Por ahora null, se puede asociar después
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
      fruit: null,
      min_temp: null,
      max_temp: null,
      ideal_min: null,
      ideal_max: null
    });

    // Log para debugging (opcional)
    if (isAnomalous) {
      console.log(`⚠️  Túnel ${tunnelId}: Lectura anómala generada (AMB_OUT: ${values.ambOut}°C)`);
    }
  } catch (error) {
    console.error(`❌ Error insertando lectura para túnel ${tunnelId}:`, error);
  }
}

console.log("🔄 Simulador Supabase Real ON - Generando lecturas cada ~40s");
console.log("📊 Rango de temperaturas: 3°C - 15°C");
console.log("⚠️  20% de probabilidad de datos anómalos por ciclo");
console.log("🔗 Base de datos: Supabase (Esquema Real)");
console.log("---");

async function seedAll() {
  const timestamp = new Date().toLocaleTimeString('es-ES');
  console.log(`[${timestamp}] Insertando lecturas para 7 túneles...`);
  
  try {
    // Ejecutar todas las inserciones en paralelo
    await Promise.all(
      Array.from({ length: 7 }, (_, i) => seedOne(i + 1))
    );
    console.log(`✅ [${timestamp}] Lecturas insertadas exitosamente`);
  } catch (error) {
    console.error(`❌ [${timestamp}] Error insertando lecturas:`, error);
  }
}

// Ejecutar inmediatamente y luego cada 40 segundos
seedAll();
setInterval(seedAll, 40000); // 40s
