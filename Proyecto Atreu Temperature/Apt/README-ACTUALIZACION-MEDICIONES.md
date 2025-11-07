# 🔄 Actualización del Sistema de Mediciones y Procesos

## 📋 **Resumen de Cambios**

Este documento describe las mejoras implementadas en el sistema Atreu Temperature para:

1. **Mediciones dinámicas según `measure_plan`** (1, 5 o 15 minutos)
2. **Preservar zoom y selección del usuario en gráficos** durante actualizaciones
3. **Registrar timestamps** de pausas, reanudaciones y finalizaciones de procesos
4. **Filtrar historial** según el intervalo de medición configurado

---

## 🚀 **Nuevas Funcionalidades**

### 1. Intervalos de Medición Dinámicos

El simulador ahora respeta el `measure_plan` del proceso activo:

- **1 minuto**: Lecturas cada 1 minuto (alta frecuencia)
- **5 minutos**: Lecturas cada 5 minutos (frecuencia media)
- **15 minutos**: Lecturas cada 15 minutos (frecuencia estándar)
- **Sin proceso**: Lecturas cada 40 segundos (monitoreo continuo)

**Archivo modificado**: `server/src/sim-real.ts`

```typescript
// El simulador ahora evalúa cada 10 segundos si debe insertar datos
// según el intervalo configurado en el proceso
```

### 2. Gráficos que Preservan la Interacción del Usuario

Los gráficos ahora mantienen:
- ✅ Nivel de zoom aplicado por el usuario
- ✅ Sensores seleccionados/deseleccionados en la leyenda
- ✅ Posición del scroll horizontal
- ✅ Configuraciones de dataZoom

**Archivo modificado**: `src/components/ChartTab.tsx`

```typescript
// Usa notMerge:false y lazyUpdate:true para preservar estado
// Restaura zoom y leyenda después de cada actualización
```

### 3. Registro de Eventos del Proceso

El sistema ahora registra timestamps detallados:

#### **Pausa de Proceso**
- ⏸️ Guarda `paused_at` con la hora exacta
- Muestra en UI con indicador visual amarillo

#### **Reanudación de Proceso**
- ▶️ Guarda `resumed_at` con la hora exacta
- Muestra en UI con indicador visual verde

#### **Finalización de Proceso**
- 🏁 Guarda `finalized_at` con la hora exacta
- Incluye en el historial del proceso

**Archivos modificados**:
- `server/src/index-real.ts` (endpoints pause/resume/finalize)
- `server/src/supabase.ts` (tipos TypeScript)
- `src/components/TunnelDetail.tsx` (visualización)
- `src/state/processStore.ts` (estado local)

### 4. Historial Filtrado por Intervalo

El endpoint de historial filtra lecturas según el `measure_plan`:

```typescript
// Si measure_plan = 5, solo muestra lecturas cada 5 minutos
// Reduce ruido visual y mejora claridad del historial
```

**Archivo modificado**: `server/src/supabase-db-real.ts`

---

## 🗄️ **Migración de Base de Datos**

### **Ejecutar en Supabase SQL Editor**

```sql
-- Agregar columnas de timestamps a la tabla processes
ALTER TABLE processes
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resumed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP WITH TIME ZONE;

-- Agregar columnas a la tabla process_history
ALTER TABLE process_history
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resumed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP WITH TIME ZONE;
```

**Archivo SQL**: `server/src/add-process-timestamps.sql`

---

## 📊 **Visualización Mejorada**

### **Indicadores de Estado en Túnel Detail**

```tsx
// Pausado
⏸️ Pausado: 02/11/2025, 14:30:15 (amarillo)

// Reanudado
▶️ Reanudado: 02/11/2025, 14:45:22 (verde)

// Finalizado
🏁 Finalizado: 02/11/2025, 15:00:00 (gris)
```

Los timestamps se muestran automáticamente en la sección de información del proceso.

---

## 🔧 **Configuración y Uso**

### **1. Aplicar Migración de Base de Datos**

1. Abrir Supabase Dashboard
2. Ir a SQL Editor
3. Ejecutar el script `server/src/add-process-timestamps.sql`
4. Verificar que las columnas se crearon correctamente

### **2. Reiniciar Servicios**

```powershell
# Detener servicios actuales (Ctrl+C en cada terminal)

# Desde la carpeta Apt/
.\start-all.bat

# O alternativamente:
cd atreu-temperature
npm run start:all
```

### **3. Crear un Proceso con Intervalo Personalizado**

1. Abrir un túnel en el Dashboard
2. Configurar el proceso:
   - Seleccionar fruta
   - **Elegir intervalo de medición**: 1, 5 o 15 minutos
   - Iniciar proceso

3. Observar:
   - El simulador insertará datos según el intervalo
   - El gráfico se actualizará preservando tu zoom
   - Los timestamps se registrarán en pausas/reanudaciones

### **4. Verificar Funcionalidad**

#### **Probar Mediciones Dinámicas**:
```bash
# Revisar logs del simulador
# Verás mensajes como:
# "✓ Túnel 1: Lectura insertada (intervalo: 5min)"
```

#### **Probar Preservación de Zoom**:
1. Abrir gráfico de un túnel
2. Hacer zoom en una sección
3. Deseleccionar algunos sensores
4. Esperar actualización de datos
5. ✅ Zoom y selección se mantienen

#### **Probar Timestamps**:
1. Pausar un proceso → Ver timestamp de pausa
2. Reanudar proceso → Ver timestamp de reanudación
3. Finalizar proceso → Ver timestamp de finalización

---

## 📁 **Archivos Modificados**

### **Backend**
- ✅ `server/src/index-real.ts` - Endpoints pause/resume/finalize con timestamps
- ✅ `server/src/supabase.ts` - Tipos con nuevos campos
- ✅ `server/src/supabase-db-real.ts` - Filtrado de historial por measure_plan
- ✅ `server/src/sim-real.ts` - Simulador con intervalos dinámicos
- ✅ `server/src/add-process-timestamps.sql` - Script de migración SQL

### **Frontend**
- ✅ `src/components/ChartTab.tsx` - Preservación de estado del gráfico
- ✅ `src/components/TunnelDetail.tsx` - Visualización de timestamps
- ✅ `src/state/processStore.ts` - Estado con nuevos campos
- ✅ `src/hooks/useProcessSync.ts` - Sincronización de timestamps
- ✅ `src/api/client.ts` - Tipos actualizados

---

## 🐛 **Solución de Problemas**

### **Las mediciones no cambian de intervalo**

1. Verificar que el proceso tiene `measure_plan` configurado
2. Revisar logs del simulador para confirmar el intervalo
3. Esperar hasta 10 segundos (ciclo de evaluación del simulador)

### **Los timestamps no aparecen en la UI**

1. Verificar que la migración SQL se ejecutó correctamente
2. Refrescar la página del frontend
3. Revisar consola del navegador por errores

### **El zoom del gráfico se resetea**

1. Verificar que `notMerge={false}` está en `ChartTab.tsx`
2. Limpiar cache del navegador (Ctrl+Shift+Del)
3. Verificar que no hay errores de React en consola

### **El historial muestra demasiadas lecturas**

1. El filtrado se aplica solo cuando hay proceso activo
2. Sin proceso, muestra todas las lecturas (cada 40s)
3. Verificar que `measure_plan` está configurado en el proceso

---

## 🎯 **Próximos Pasos Sugeridos**

1. **Exportar historial filtrado** a PDF/Excel
2. **Notificaciones** cuando se pausa/reanuda un proceso
3. **Dashboard de eventos** con línea de tiempo visual
4. **Comparar intervalos** de diferentes procesos
5. **Alertas inteligentes** según frecuencia de medición

---

## 📞 **Soporte**

Si encuentras algún problema o tienes sugerencias:

1. Revisar la consola del navegador (F12)
2. Revisar logs del servidor backend
3. Verificar que todos los servicios están corriendo
4. Consultar este README para troubleshooting

---

## ✅ **Checklist de Verificación**

- [ ] Migración SQL ejecutada en Supabase
- [ ] Servicios backend reiniciados
- [ ] Frontend actualizado y compilado
- [ ] Proceso creado con measure_plan configurado
- [ ] Timestamps visibles en UI
- [ ] Gráfico preserva zoom/selección
- [ ] Historial muestra intervalo correcto
- [ ] Simulador respeta intervalos de medición

---

**¡Sistema actualizado y listo para usar!** 🚀
