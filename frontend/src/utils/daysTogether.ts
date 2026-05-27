export function calculateDaysTogether(startDateIso: string | null): number {
  if (!startDateIso) return 0;
  const start = new Date(startDateIso);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diff = today.getTime() - start.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}
