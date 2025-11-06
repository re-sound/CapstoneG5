import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY!
);

async function testFruitSync() {
  console.log('🧪 Iniciando prueba de sincronización de fruit_type...\n');

  try {
    // Paso 1: Verificar estado inicial de los túneles
    console.log('📋 Paso 1: Verificando estado inicial de los túneles...');
    const { data: tunnelsInicial, error: errorInicial } = await supabase
      .from('tunnels')
      .select('id, name, fruit_type')
      .order('id');

    if (errorInicial) {
      console.error('❌ Error al obtener túneles iniciales:', errorInicial);
      return;
    }

    console.log('Estado inicial de los túneles:');
    tunnelsInicial.forEach(tunnel => {
      console.log(`  Túnel ${tunnel.id}: ${tunnel.name} - fruit_type: "${tunnel.fruit_type}"`);
    });

    // Seleccionar túnel 1 para la prueba
    const tunnelId = 1;
    const fruitPrueba = 'Manzana Pink Lady';

    // Paso 2: Verificar si hay un proceso activo y eliminarlo si existe
    console.log(`\n🔍 Paso 2: Verificando si hay proceso activo en túnel ${tunnelId}...`);
    const procesoExistente = await fetch(`http://localhost:4000/api/processes/${tunnelId}`);
    const procesoData = await procesoExistente.json();
    
    if (procesoData.status !== 'idle') {
      console.log(`🗑️ Proceso existente encontrado, finalizándolo...`);
      await fetch(`http://localhost:4000/api/processes/${tunnelId}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ended_by: 'Sistema de prueba' })
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Paso 3: Iniciar un proceso en el túnel 1
    console.log(`\n🚀 Paso 3: Iniciando proceso en túnel ${tunnelId} con fruta "${fruitPrueba}"...`);
    
    const responseStart = await fetch(`http://localhost:4000/api/processes/${tunnelId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fruit: fruitPrueba,
        min_temp: 3,
        max_temp: 8,
        ideal_min: 4,
        ideal_max: 7
      })
    });

    if (!responseStart.ok) {
      const error = await responseStart.text();
      console.error('❌ Error al iniciar proceso:', error);
      return;
    }

    const resultStart = await responseStart.json();
    console.log('✅ Proceso iniciado:', resultStart);

    // Esperar un momento para que se actualice
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Paso 3: Verificar que el fruit_type se haya actualizado
    console.log(`\n🔍 Paso 3: Verificando fruit_type después de iniciar proceso...`);
    const { data: tunnelConProceso, error: errorConProceso } = await supabase
      .from('tunnels')
      .select('id, name, fruit_type')
      .eq('id', tunnelId)
      .single();

    if (errorConProceso) {
      console.error('❌ Error al obtener túnel con proceso:', errorConProceso);
      return;
    }

    console.log(`Túnel ${tunnelId} después de iniciar proceso:`);
    console.log(`  fruit_type: "${tunnelConProceso.fruit_type}"`);
    
    if (tunnelConProceso.fruit_type === fruitPrueba) {
      console.log('✅ fruit_type sincronizado correctamente con la fruta del proceso');
    } else {
      console.log(`❌ fruit_type NO coincide. Esperado: "${fruitPrueba}", Actual: "${tunnelConProceso.fruit_type}"`);
    }

    // Paso 4: Finalizar el proceso
    console.log(`\n🏁 Paso 4: Finalizando proceso en túnel ${tunnelId}...`);
    
    const responseFinalize = await fetch(`http://localhost:4000/api/processes/${tunnelId}/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ended_by: 'Sistema de prueba'
      })
    });

    if (!responseFinalize.ok) {
      const error = await responseFinalize.text();
      console.error('❌ Error al finalizar proceso:', error);
      return;
    }

    const resultFinalize = await responseFinalize.json();
    console.log('✅ Proceso finalizado:', resultFinalize);

    // Esperar un momento para que se actualice
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Paso 5: Verificar que el fruit_type haya vuelto a "Sin proceso"
    console.log(`\n🔍 Paso 5: Verificando fruit_type después de finalizar proceso...`);
    const { data: tunnelSinProceso, error: errorSinProceso } = await supabase
      .from('tunnels')
      .select('id, name, fruit_type')
      .eq('id', tunnelId)
      .single();

    if (errorSinProceso) {
      console.error('❌ Error al obtener túnel sin proceso:', errorSinProceso);
      return;
    }

    console.log(`Túnel ${tunnelId} después de finalizar proceso:`);
    console.log(`  fruit_type: "${tunnelSinProceso.fruit_type}"`);
    
    if (tunnelSinProceso.fruit_type === 'Sin proceso') {
      console.log('✅ fruit_type sincronizado correctamente a "Sin proceso" después de finalizar');
    } else {
      console.log(`❌ fruit_type NO es "Sin proceso". Actual: "${tunnelSinProceso.fruit_type}"`);
    }

    console.log('\n🎉 Prueba de sincronización de fruit_type completada');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar la prueba
testFruitSync().catch(console.error);