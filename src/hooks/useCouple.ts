import { useEffect, useState } from 'react';
import { authRepository } from '../repositories/AuthRepository';
import { coupleRepository } from '../repositories/CoupleRepository';
import { supabase } from '../config/supabase';
import { isSupabaseConfigured } from '../config/env';

export function useCouple() {
  const [userId, setUserId] = useState<string | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    const session = await authRepository.getSession();
    const uid = session?.user?.id ?? null;
    setUserId(uid);
    if (!uid) {
      setCoupleId(null);
      setLoading(false);
      return;
    }
    const member = await coupleRepository.getMembership(uid);
    setCoupleId(member?.couple_id ?? null);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return {
    userId,
    coupleId,
    loading,
    hasCouple: Boolean(coupleId),
    refresh,
  };
}
