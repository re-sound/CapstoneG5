-- ⚠️ IMPORTANTE: Ejecutar este script en Supabase SQL Editor
-- Este script agrega las columnas necesarias para los timestamps de pausa/reanudación/finalización

-- 1. Agregar columnas a la tabla processes
ALTER TABLE processes
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resumed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP WITH TIME ZONE;

-- 2. Agregar columnas a la tabla process_history
ALTER TABLE process_history
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resumed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP WITH TIME ZONE;

-- 3. Agregar comentarios para documentación
COMMENT ON COLUMN processes.paused_at IS 'Timestamp de cuando se pausó el proceso por última vez';
COMMENT ON COLUMN processes.resumed_at IS 'Timestamp de cuando se reanudó el proceso por última vez';
COMMENT ON COLUMN processes.finalized_at IS 'Timestamp de cuando se finalizó el proceso';

COMMENT ON COLUMN process_history.paused_at IS 'Timestamp de cuando se pausó el proceso';
COMMENT ON COLUMN process_history.resumed_at IS 'Timestamp de cuando se reanudó el proceso';
COMMENT ON COLUMN process_history.finalized_at IS 'Timestamp de cuando se finalizó el proceso';

-- 4. Verificar que las columnas se crearon correctamente
SELECT 
    table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('processes', 'process_history')
  AND column_name IN ('paused_at', 'resumed_at', 'finalized_at')
ORDER BY table_name, ordinal_position;

-- ✅ Si ves 6 filas en el resultado (3 para cada tabla), la migración fue exitosa
