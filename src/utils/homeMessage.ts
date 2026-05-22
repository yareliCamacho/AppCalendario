const ROTATION_MS = 3 * 24 * 60 * 60 * 1000;

export function shouldRotateHomeMessage(shownAtIso: string | null): boolean {
  if (!shownAtIso) return true;
  const shown = new Date(shownAtIso).getTime();
  return Date.now() - shown >= ROTATION_MS;
}
