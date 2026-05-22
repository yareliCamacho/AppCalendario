import { BaseRepository } from './BaseRepository';
import type { UserProfile } from '../types/database';

export class AuthRepository extends BaseRepository {
  async signUp(email: string, password: string, displayName: string) {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  async getSession() {
    const { data, error } = await this.client.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async getUser() {
    const { data, error } = await this.client.auth.getUser();
    if (error) throw error;
    return data.user;
  }

  async resetPassword(email: string) {
    const { error } = await this.client.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }
}

export const authRepository = new AuthRepository();
