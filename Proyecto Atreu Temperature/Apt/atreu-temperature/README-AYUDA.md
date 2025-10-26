# 📋 **Atreu Temperature - Sistema de Monitoreo de Túneles de Refrigeración**

## 🎯 **Descripción del Sistema**

**Atreu Temperature** es un sistema de monitoreo en tiempo real desarrollado para La Hornilla, diseñado para supervisar 7 túneles de refrigeración de frutas. El sistema implementa un patrón de arquitectura cliente-servidor con una base de datos relacional embebida, proporcionando monitoreo continuo de temperaturas, gestión de procesos de refrigeración y generación de alertas automáticas.

---

## 🏗️ **Arquitectura del Sistema**

### **Stack Tecnológico**

#### **Frontend**
- **React 19.1.1**: Framework de componentes para interfaces de usuario
- **TypeScript**: Superset tipado de JavaScript para mayor robustez
- **Vite 7.1.6**: Build tool moderno con Hot Module Replacement
- **TailwindCSS 4.1.13**: Framework de utilidades CSS para diseño responsivo
- **React Router DOM 7.9.1**: Enrutamiento del lado del cliente
- **ECharts 5.6.0**: Librería de visualización de datos
- **jsPDF 3.0.3**: Generación de documentos PDF

#### **Backend**
- **Node.js**: Runtime de JavaScript para el servidor
- **Express 4.21.2**: Framework web minimalista
- **better-sqlite3 9.6.0**: Driver de base de datos SQLite optimizado
- **CORS 2.8.5**: Middleware para Cross-Origin Resource Sharing

---

## 📊 **Patrón de Base de Datos: Modelo Relacional Normalizado**

### **Estrategia de Diseño**

La base de datos implementa un **modelo relacional normalizado** con las siguientes características:

#### **1. Normalización en Tercera Forma Normal (3NF)**
- **Eliminación de redundancia**: Cada dato se almacena una sola vez
- **Integridad referencial**: Claves foráneas mantienen consistencia
- **Dependencias funcionales**: Cada atributo depende únicamente de la clave primaria

#### **2. Patrón Time-Series para Lecturas**
- **Optimización temporal**: Índices optimizados para consultas por tiempo
- **Particionado implícito**: Datos organizados por túnel y timestamp
- **Retención configurable**: Política de limpieza de datos históricos

#### **3. Patrón State Machine para Procesos**
- **Estados finitos**: idle → running → paused → finished
- **Transiciones controladas**: Validación de cambios de estado
- **Auditoría completa**: Historial de cambios de estado

### **Modelo de Datos**

#### **Entidad: Tunnels (Túneles)**
```sql
CREATE TABLE tunnels (
  id     INTEGER PRIMARY KEY,  -- Clave primaria natural
  fruit  TEXT NOT NULL         -- Atributo descriptivo
);
```

**Características del modelo**:
- **Cardinalidad fija**: 7 registros (túneles físicos)
- **Clave natural**: ID numérico secuencial
- **Inmutabilidad**: Estructura estable durante la operación

#### **Entidad: Readings (Lecturas de Sensores)**
```sql
CREATE TABLE readings (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  tunnel_id     INTEGER NOT NULL,
  ts            TEXT NOT NULL,        -- Timestamp ISO 8601
  amb_out       REAL,                 -- Sensor ambiente exterior
  amb_ret       REAL,                 -- Sensor ambiente retorno
  izq_ext_ent   REAL,                 -- Sensor izquierda exterior entrada
  izq_int_ent   REAL,                 -- Sensor izquierda interior entrada
  der_int_ent   REAL,                 -- Sensor derecha interior entrada
  der_ext_ent   REAL,                 -- Sensor derecha exterior entrada
  -- ... sensores de salida
  FOREIGN KEY (tunnel_id) REFERENCES tunnels(id) ON DELETE CASCADE
);
```

**Patrón de diseño aplicado**:
- **Time-Series**: Optimizado para consultas temporales
- **Sparse Data**: Campos NULL permitidos para sensores no disponibles
- **Cascade Delete**: Integridad referencial automática

#### **Entidad: Processes (Procesos Activos)**
```sql
CREATE TABLE processes (
  tunnel_id     INTEGER PRIMARY KEY,
  status        TEXT NOT NULL CHECK(status IN ('idle', 'running', 'paused', 'finished')),
  fruit         TEXT NOT NULL,
  min_temp      REAL NOT NULL,
  max_temp      REAL NOT NULL,
  ideal_min     REAL NOT NULL,
  ideal_max     REAL NOT NULL,
  started_at    TEXT,
  started_by    TEXT,
  -- ... metadatos operativos
  FOREIGN KEY (tunnel_id) REFERENCES tunnels(id) ON DELETE CASCADE
);
```

**Patrón State Machine implementado**:
- **Estados válidos**: Constraint CHECK para validación
- **Transiciones**: Lógica de negocio en la aplicación
- **Auditoría**: Timestamps de cambios de estado

#### **Entidad: Process_History (Historial de Procesos)**
```sql
CREATE TABLE process_history (
  id            TEXT PRIMARY KEY,     -- Clave compuesta
  tunnel_id     INTEGER NOT NULL,
  fruit         TEXT NOT NULL,
  -- ... snapshot del proceso
  FOREIGN KEY (tunnel_id) REFERENCES tunnels(id) ON DELETE CASCADE
);
```

**Patrón de diseño**:
- **Snapshot Pattern**: Captura completa del estado al finalizar
- **Clave compuesta**: `{tunnel_id}-{timestamp}` para unicidad
- **Inmutabilidad**: Datos históricos no se modifican

---

## 🔗 **Modelo Relacional: Diagrama de Entidad-Relación**

### **Relaciones Implementadas**

#### **1. Tunnels → Readings (1:N)**
- **Cardinalidad**: Uno a Muchos
- **Integridad**: `readings.tunnel_id` → `tunnels.id`
- **Comportamiento**: CASCADE DELETE
- **Propósito**: Agregación de lecturas por túnel

#### **2. Tunnels → Processes (1:1)**
- **Cardinalidad**: Uno a Uno
- **Integridad**: `processes.tunnel_id` → `tunnels.id`
- **Comportamiento**: CASCADE DELETE
- **Propósito**: Un proceso activo por túnel

#### **3. Tunnels → Process_History (1:N)**
- **Cardinalidad**: Uno a Muchos
- **Integridad**: `process_history.tunnel_id` → `tunnels.id`
- **Comportamiento**: CASCADE DELETE
- **Propósito**: Historial de procesos por túnel

### **Índices Estratégicos**

#### **Índice Compuesto Principal**
```sql
CREATE INDEX idx_readings_tunnel_ts 
ON readings (tunnel_id, ts DESC);
```

**Justificación del diseño**:
- **Ordenamiento**: `ts DESC` para consultas de datos recientes
- **Filtrado**: `tunnel_id` para consultas específicas por túnel
- **Performance**: Consultas O(log n) en lugar de O(n)

---

## 🏛️ **Patrón de Arquitectura: Layered Architecture**

### **Capa de Presentación (Presentation Layer)**
- **Responsabilidad**: Interfaz de usuario y presentación de datos
- **Tecnologías**: React, TypeScript, TailwindCSS
- **Patrones**: Component Pattern, Container/Presenter Pattern

### **Capa de Aplicación (Application Layer)**
- **Responsabilidad**: Lógica de negocio y orquestación
- **Tecnologías**: React Hooks, Context API
- **Patrones**: Custom Hooks, State Management

### **Capa de Servicios (Service Layer)**
- **Responsabilidad**: Comunicación con APIs externas
- **Tecnologías**: Fetch API, Axios
- **Patrones**: Repository Pattern, API Client

### **Capa de Acceso a Datos (Data Access Layer)**
- **Responsabilidad**: Persistencia y recuperación de datos
- **Tecnologías**: better-sqlite3, SQL
- **Patrones**: Data Mapper, Active Record

### **Capa de Base de Datos (Database Layer)**
- **Responsabilidad**: Almacenamiento físico de datos
- **Tecnologías**: SQLite, WAL Mode
- **Patrones**: Database per Service

---

## 🔄 **Patrones de Diseño Implementados**

### **1. Repository Pattern**
```typescript
// Abstracción del acceso a datos
export function getProcess(tunnelId: number): TunnelProcess | null {
  const existing = state.byId.get(tunnelId);
  if (existing) return existing;
  return null;
}
```

### **2. Observer Pattern**
```typescript
// Sistema de notificaciones
const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}
```

### **3. State Machine Pattern**
```typescript
// Transiciones de estado controladas
export function pauseProcess(tunnelId: number) {
  const p = getProcess(tunnelId);
  if (!p || p.status !== "running") return;
  state.byId.set(tunnelId, { ...p, status: "paused" });
}
```

### **4. Factory Pattern**
```typescript
// Creación de objetos complejos
function defaultProcess(tunnelId: number): TunnelProcess {
  return {
    tunnelId,
    status: "idle",
    fruit: "GENÉRICA",
    ranges: { min: 3.5, max: 12, idealMin: 4, idealMax: 9 }
  };
}
```

---

## 📊 **Patrón de Datos: Time-Series Optimization**

### **Estrategia de Almacenamiento**

#### **1. Particionado Temporal**
- **Granularidad**: Lecturas cada 40 segundos
- **Retención**: 7 días por defecto
- **Limpieza**: Función `purgeOlderThan()` para mantenimiento

#### **2. Índices Optimizados**
```sql
-- Índice para consultas temporales
CREATE INDEX idx_readings_tunnel_ts 
ON readings (tunnel_id, ts DESC);

-- Índice para consultas de estado
CREATE INDEX idx_processes_status 
ON processes (status);
```

#### **3. Consultas Eficientes**
```sql
-- Última lectura por túnel
SELECT * FROM readings 
WHERE tunnel_id = ? 
ORDER BY ts DESC 
LIMIT 1;

-- Histórico de últimas N horas
SELECT * FROM readings 
WHERE tunnel_id = ? 
  AND ts >= datetime('now', '-2 hours')
ORDER BY ts ASC;
```

---

## 🎯 **Patrón de Monitoreo: Observer + Strategy**

### **Sistema de Alertas**

#### **Strategy Pattern para Evaluación**
```typescript
// Diferentes estrategias de evaluación
export function evalStatus(value: number | "OUT", range: Range): Status {
  if (value === "OUT") return "out";
  if (value < range.min) return "alarm";
  if (value > range.max) return "alarm";
  if (value < range.min + (range.warnDelta || 0.3)) return "warn";
  if (value > range.max - (range.warnDelta || 0.3)) return "warn";
  return "ok";
}
```

#### **Observer Pattern para Notificaciones**
```typescript
// Sistema de suscripción a cambios
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
```

---

## 🔧 **Configuración de Base de Datos**

### **Pragmas SQLite Optimizados**
```sql
PRAGMA journal_mode = WAL;        -- Write-Ahead Logging
PRAGMA synchronous = NORMAL;      -- Balance seguridad/velocidad
PRAGMA foreign_keys = ON;         -- Integridad referencial
```

### **Configuración de Rendimiento**
- **WAL Mode**: Permite lecturas concurrentes durante escrituras
- **Synchronous NORMAL**: Balance entre integridad y velocidad
- **Foreign Keys**: Validación automática de integridad

---

## 📈 **Métricas de Rendimiento**

### **Capacidad del Sistema**
- **Lecturas por hora**: 630 (7 túneles × 90 lecturas)
- **Tamaño de datos**: ~150KB/día
- **Tiempo de respuesta**: <5ms para consultas típicas
- **Concurrencia**: Múltiples lectores simultáneos

### **Optimizaciones Implementadas**
- **Índices compuestos**: Consultas O(log n)
- **Prepared statements**: Reutilización de consultas
- **WAL mode**: Lecturas no bloqueantes
- **Cascade deletes**: Limpieza automática de datos huérfanos

---

## 🚀 **Escalabilidad y Mantenimiento**

### **Estrategias de Escalabilidad**
- **Horizontal**: Particionado por túnel
- **Vertical**: Índices optimizados
- **Temporal**: Limpieza automática de datos antiguos

### **Patrones de Mantenimiento**
- **Backup**: Copia del archivo `apt.db`
- **Limpieza**: Función `purgeOlderThan()`
- **Monitoreo**: Logs de operaciones críticas

---

## 📋 **Resumen Técnico**

**Atreu Temperature** implementa una arquitectura robusta basada en patrones de diseño establecidos:

1. **Modelo Relacional Normalizado** con integridad referencial
2. **Patrón Time-Series** para optimización de consultas temporales
3. **State Machine Pattern** para gestión de procesos
4. **Layered Architecture** para separación de responsabilidades
5. **Observer Pattern** para sistema de alertas reactivo

La base de datos SQLite proporciona un almacén de datos eficiente y confiable, mientras que el patrón de arquitectura en capas asegura mantenibilidad y escalabilidad del sistema.

---

## 🛠️ **Instalación y Configuración**

### **Requisitos del Sistema**
- Node.js 18+ 
- npm 8+
- Navegador moderno (Chrome, Firefox, Safari, Edge)

### **Instalación Frontend**
```bash
cd Fase\ 2/Sprint\ 2/Apt/atreu-temperature
npm install
npm run dev
```

### **Instalación Backend**
```bash
cd server
npm install
npm run dev
```

### **Estructura del Proyecto**
```
atreu-temperature/
├── src/                    # Frontend React
│   ├── components/         # Componentes reutilizables
│   ├── pages/             # Páginas de la aplicación
│   ├── hooks/             # Hooks personalizados
│   ├── state/             # Gestión de estado
│   └── utils/             # Utilidades
├── server/                # Backend Node.js
│   ├── src/               # Código fuente del servidor
│   └── data/              # Base de datos SQLite
└── README-AYUDA.md        # Este archivo
```

---

## 📞 **Soporte y Contacto**

Para soporte técnico o consultas sobre el sistema, contactar al equipo de desarrollo.

**Versión**: 1.0.0  
**Última actualización**: Diciembre 2024

