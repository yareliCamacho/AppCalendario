import { BaseRepository } from './BaseRepository';
import type { UserProfile } from '../types/database';

export class UserRepository extends BaseRepository {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data as UserProfile | null;
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await this.client
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data as UserProfile;
  }

  async updatePushToken(userId: string, token: string) {
    return this.updateProfile(userId, { push_token: token });
  }
}

export const userRepository = new UserRepository();
