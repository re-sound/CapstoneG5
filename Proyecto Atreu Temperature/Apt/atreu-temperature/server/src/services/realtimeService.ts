import { supabaseTyped } from '../lib/supabase'

export class RealtimeService {
  static subscribeToTemperatures(tunelId: number, callback: (data: any) => void) {
    return supabaseTyped
      .channel(`temperaturas:${tunelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'temperaturas',
          filter: `tunel_id=eq.${tunelId}`
        },
        callback
      )
      .subscribe()
  }

  static subscribeToAlarms(callback: (data: any) => void) {
    return supabaseTyped
      .channel('alarmas')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alarmas'
        },
        callback
      )
      .subscribe()
  }

  static subscribeToProcesses(tunelId: number, callback: (data: any) => void) {
    return supabaseTyped
      .channel(`procesos:${tunelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'procesos',
          filter: `tunel_id=eq.${tunelId}`
        },
        callback
      )
      .subscribe()
  }
}