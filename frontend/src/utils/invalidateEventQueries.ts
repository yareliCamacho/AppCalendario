import type { QueryClient } from '@tanstack/react-query';

/** Refresca pantallas que enlazan con un evento del calendario tras borrarlo */
export async function invalidateAfterEventDelete(
  qc: QueryClient,
  coupleId: string,
  opts: { eventId: string; eventDate: string; year?: number; month?: number },
) {
  const { eventId, eventDate, year, month } = opts;
  const tasks: Promise<unknown>[] = [
    qc.invalidateQueries({ queryKey: ['events'] }),
    qc.invalidateQueries({ queryKey: ['events', coupleId] }),
    qc.invalidateQueries({ queryKey: ['event', coupleId, eventDate] }),
    qc.invalidateQueries({ queryKey: ['locations', eventId] }),
    qc.invalidateQueries({ queryKey: ['event_photos_gallery', eventId] }),
    qc.invalidateQueries({ queryKey: ['home', coupleId] }),
    qc.invalidateQueries({ queryKey: ['home'] }),
    qc.invalidateQueries({ queryKey: ['upcomingSpecial', coupleId] }),
    qc.invalidateQueries({ queryKey: ['couple', coupleId] }),
    qc.invalidateQueries({ queryKey: ['home', 'memoryTree', coupleId] }),
    qc.invalidateQueries({ queryKey: ['notifications'] }),
  ];
  if (year != null && month != null) {
    tasks.push(qc.invalidateQueries({ queryKey: ['events', coupleId, year, month] }));
  }
  await Promise.all(tasks);
}
