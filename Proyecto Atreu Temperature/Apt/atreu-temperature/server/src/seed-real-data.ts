import { supabase } from './supabase.js';

async function seedRealData() {
  console.log('🌱 Poblando datos iniciales en Supabase (esquema real)...');
  
  try {
    // 1. Crear túneles
    console.log('📋 Creando túneles...');
    const tunnels = [
      { name: "Túnel 1", fruit_type: "Manzana Gala", is_active: true },
      { name: "Túnel 2", fruit_type: "Manzana Fuji", is_active: true },
      { name: "Túnel 3", fruit_type: "Pera Packham", is_active: true },
      { name: "Túnel 4", fruit_type: "Uva Red Globe", is_active: true },
      { name: "Túnel 5", fruit_type: "Arándano", is_active: true },
      { name: "Túnel 6", fruit_type: "Cereza", is_active: true },
      { name: "Túnel 7", fruit_type: "Kiwi", is_active: true }
    ];

    const { error: tunnelsError } = await supabase
      .from('tunnels')
      .upsert(tunnels, { onConflict: 'id' });

    if (tunnelsError) {
      console.error('❌ Error creando túneles:', tunnelsError);
      return false;
    }
    console.log('✅ Túneles creados');

    // 2. Crear roles
    console.log('👥 Creando roles...');
    const roles = [
      { name: "admin", description: "Administrador del sistema" },
      { name: "operador", description: "Operador de túneles" },
      { name: "observador", description: "Solo lectura" }
    ];

    const { error: rolesError } = await supabase
      .from('roles')
      .upsert(roles, { onConflict: 'name' });

    if (rolesError) {
      console.error('❌ Error creando roles:', rolesError);
      return false;
    }
    console.log('✅ Roles creados');

    console.log('🎉 ¡Datos iniciales poblados exitosamente!');
    return true;
    
  } catch (error) {
    console.error('❌ Error durante la población de datos:', error);
    return false;
  }
}

seedRealData();
