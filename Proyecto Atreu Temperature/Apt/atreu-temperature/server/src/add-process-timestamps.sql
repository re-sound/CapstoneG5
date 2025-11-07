-- Agregar columnas para timestamps de pausa, reanudación y finalización
-- Ejecutar este script en Supabase SQL Editor

-- Agregar columnas a la tabla processes
ALTER TABLE processes
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resumed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP WITH TIME ZONE;

-- Agregar columnas a la tabla process_history
ALTER TABLE process_history
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resumed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP WITH TIME ZONE;

-- Comentarios para documentación
COMMENT ON COLUMN processes.paused_at IS 'Timestamp de cuando se pausó el proceso por última vez';
COMMENT ON COLUMN processes.resumed_at IS 'Timestamp de cuando se reanudó el proceso por última vez';
COMMENT ON COLUMN processes.finalized_at IS 'Timestamp de cuando se finalizó el proceso';

COMMENT ON COLUMN process_history.paused_at IS 'Timestamp de cuando se pausó el proceso';
COMMENT ON COLUMN process_history.resumed_at IS 'Timestamp de cuando se reanudó el proceso';
COMMENT ON COLUMN process_history.finalized_at IS 'Timestamp de cuando se finalizó el proceso';

-- Verificar las columnas agregadas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'processes' 
  AND column_name IN ('paused_at', 'resumed_at', 'finalized_at')
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'process_history' 
  AND column_name IN ('paused_at', 'resumed_at', 'finalized_at')
ORDER BY ordinal_position;
