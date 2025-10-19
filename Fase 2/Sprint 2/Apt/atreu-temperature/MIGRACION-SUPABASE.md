# 🚀 Migración de SQLite a Supabase

Esta guía te ayudará a migrar tu proyecto Atreu Temperature de SQLite a Supabase de manera segura.

## 📋 Prerrequisitos

1. **Cuenta de Supabase**: Crea una cuenta en [supabase.com](https://supabase.com)
2. **Proyecto Supabase**: Crea un nuevo proyecto
3. **Variables de entorno**: Obtén tu URL y clave anónima

## 🔧 Configuración Paso a Paso

### 1. Instalar dependencias

```bash
cd server
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `server/`:

```bash
# Copia el archivo de ejemplo
cp env.example .env
```

Edita `.env` con tus credenciales de Supabase:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_clave_anonima_aqui
PORT=4000
```

### 3. Configurar Supabase

Ejecuta el script de configuración:

```bash
npm run setup
```

Este script:
- ✅ Crea las tablas necesarias
- ✅ Configura los índices
- ✅ Inserta los datos iniciales (7 túneles)
- ✅ Verifica la conexión

### 4. Ejecutar la aplicación

```bash
# Opción 1: Solo API con Supabase
npm run dev:supabase

# Opción 2: API + Simulador con Supabase
npm run dev:supabase-full
```

## 📊 Estructura de Base de Datos

### Tablas Creadas

#### `tunnels`
```sql
CREATE TABLE tunnels (
  id INTEGER PRIMARY KEY,
  fruit TEXT NOT NULL
);
```

#### `readings`
```sql
CREATE TABLE readings (
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
```

#### `processes`
```sql
CREATE TABLE processes (
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
```

#### `process_history`
```sql
CREATE TABLE process_history (
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
```

## 🔄 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run setup` | Configura Supabase (crear tablas, datos iniciales) |
| `npm run dev:supabase` | Solo API con Supabase |
| `npm run dev:sim-supabase` | Solo simulador con Supabase |
| `npm run dev:supabase-full` | API + Simulador con Supabase |
| `npm run dev` | SQLite original (para comparación) |

## 🛠️ Archivos Creados/Modificados

### Nuevos Archivos
- `server/src/supabase.ts` - Configuración de Supabase
- `server/src/supabase-db.ts` - Capa de abstracción de BD
- `server/src/index-supabase.ts` - Servidor con Supabase
- `server/src/sim-supabase.ts` - Simulador con Supabase
- `server/src/setup-supabase.ts` - Script de configuración
- `server/env.example` - Variables de entorno de ejemplo

### Archivos Modificados
- `server/package.json` - Dependencias y scripts actualizados

## 🔍 Verificación

### 1. Verificar Conexión
```bash
curl http://localhost:4000/api/health
```

### 2. Verificar Túneles
```bash
curl http://localhost:4000/api/tunnels
```

### 3. Verificar en Supabase Dashboard
- Ve a tu proyecto en Supabase
- Revisa la sección "Table Editor"
- Deberías ver las 4 tablas creadas

## 🚨 Solución de Problemas

### Error: "SUPABASE_URL no está configurado"
- Verifica que el archivo `.env` existe
- Verifica que las variables están correctamente configuradas
- Reinicia el servidor

### Error: "Error creando tabla"
- Verifica que tienes permisos de administrador en Supabase
- Verifica que la URL y clave son correctas
- Revisa los logs en Supabase Dashboard

### Error: "Error insertando datos"
- Verifica que las tablas se crearon correctamente
- Verifica que los datos iniciales no existen ya
- Revisa la consola para más detalles

## 📈 Ventajas de Supabase

1. **Escalabilidad**: Maneja millones de registros
2. **Tiempo Real**: Suscripciones en tiempo real
3. **Autenticación**: Sistema de auth integrado
4. **API REST**: API automática generada
5. **Dashboard**: Interfaz web para administración
6. **Backup**: Respaldos automáticos
7. **Monitoreo**: Métricas y logs integrados

## 🔄 Rollback (Volver a SQLite)

Si necesitas volver a SQLite:

```bash
# Usar el servidor original
npm run dev

# O usar el simulador original
npm run dev:sim
```

Los archivos originales no se modificaron, solo se crearon versiones nuevas.

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs en la consola
2. Verifica las variables de entorno
3. Revisa el dashboard de Supabase
4. Consulta la documentación de Supabase

---

**¡Migración completada!** 🎉

Tu aplicación ahora usa Supabase como base de datos, manteniendo toda la funcionalidad original.
