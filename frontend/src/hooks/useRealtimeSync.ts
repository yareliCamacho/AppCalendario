import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../config/supabase';
import { isSupabaseConfigured } from '../config/env';

const TABLES = [
  'events',
  'event_photos',
  'event_locations',
  'wishes',
  'goals',
  'notifications',
  'couple_members',
] as const;

export function useRealtimeSync(coupleId: string | null, userId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase || !coupleId) return;

    const channels = TABLES.map((table) => {
      const filter =
        table === 'notifications'
          ? `user_id=eq.${userId}`
          : `couple_id=eq.${coupleId}`;

      return supabase
        .channel(`${table}-${coupleId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table, filter },
          () => {
            queryClient.invalidateQueries({ queryKey: [table, coupleId] });
            queryClient.invalidateQueries({ queryKey: ['home', coupleId] });
          },
        )
        .subscribe();
    });

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [coupleId, userId, queryClient]);
}
