Proposed fixes to resolve TypeScript build issues in server:

1) Replace `import { supabaseTyped } from '../lib/supabase'` with `import { supabase } from '../supabase.js'` in `src/services/realtimeService.ts`, and update usages to `supabase.channel(...)`. Also adjust table names to `readings`, `temperature_alerts`, and `processes`, and column `tunnel_id`.

2) In `src/supabase-db.ts` and `src/supabase-db-real.ts`, change `insertReading(reading: Omit<ReadingRow, 'id'>)` to accept partial fields: `insertReading(reading: Partial<ReadingRow> & Pick<ReadingRow, 'tunnel_id' | 'ts'>)`. Inside, build the payload by defaulting the remaining fields to `null`.

3) In `src/setup-supabase.ts`, remove the `import.meta.url` check. Use a `process.argv` based check:

```
const isDirectRun = typeof process !== 'undefined' && Array.isArray(process.argv)
  && process.argv[1] && process.argv[1].includes('setup-supabase');
if (isDirectRun) setupSupabase();
```

After applying these changes, re-run `npm run build` in `server` to verify.