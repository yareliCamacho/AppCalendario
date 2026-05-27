import type { Milestone } from '../types/database';

export const MILESTONE_MAX_PHOTOS = 3;

export function getMilestonePhotoPaths(
  m: Pick<Milestone, 'photo_path' | 'photo_paths'> | null | undefined,
): string[] {
  if (!m) return [];
  if (m.photo_paths?.length) return m.photo_paths.filter(Boolean);
  if (m.photo_path) return [m.photo_path];
  return [];
}
