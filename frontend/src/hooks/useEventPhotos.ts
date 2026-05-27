import { useInfiniteQuery } from '@tanstack/react-query';
import { photoRepository } from '../repositories/PhotoRepository';

const PAGE_SIZE = 20;

export function useEventPhotos(
  eventId: string | undefined,
  coupleId: string | undefined,
  userId: string | undefined,
) {
  return useInfiniteQuery({
    queryKey: ['event_photos_gallery', eventId],
    enabled: Boolean(eventId && coupleId && userId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const photos = await photoRepository.listByEvent(
        eventId!,
        coupleId!,
        userId!,
        pageParam,
      );
      const items = await Promise.all(
        photos.map(async (p) => ({
          id: p.id,
          uri: await photoRepository.getSignedUrl(p.storage_path),
          isFavorite: Boolean(p.is_favorite),
        })),
      );
      return { items, nextPage: photos.length === PAGE_SIZE ? pageParam + 1 : undefined };
    },
    getNextPageParam: (last) => last.nextPage,
  });
}
