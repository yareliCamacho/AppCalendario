import { BaseRepository } from './BaseRepository';
import type { Theme } from '../types/database';

export class ThemeRepository extends BaseRepository {
  async list(): Promise<Theme[]> {
    const { data, error } = await this.client.from('themes').select('*');
    if (error) throw error;
    return (data ?? []) as Theme[];
  }

  async getDefault(): Promise<Theme | null> {
    const { data, error } = await this.client
      .from('themes')
      .select('*')
      .eq('is_default', true)
      .maybeSingle();
    if (error) throw error;
    return data as Theme | null;
  }
}

export const themeRepository = new ThemeRepository();
