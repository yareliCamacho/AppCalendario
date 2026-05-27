import { supabase } from '../config/supabase';
import { getSupabaseConfigHint, isSupabaseConfigured } from '../config/env';
import { AppError } from '../utils/errors';

export abstract class BaseRepository {
  protected get client() {
    if (!isSupabaseConfigured() || !supabase) {
      throw new AppError(
        getSupabaseConfigHint() ?? 'Configura Supabase en frontend/.env',
        'SUPABASE_NOT_CONFIGURED',
      );
    }
    return supabase;
  }

  async assertCoupleAccess(coupleId: string, userId: string): Promise<void> {
    const { data, error } = await this.client
      .from('couple_members')
      .select('id')
      .eq('couple_id', coupleId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new AppError('No perteneces a esta pareja', 'FORBIDDEN');
    }
  }
}
