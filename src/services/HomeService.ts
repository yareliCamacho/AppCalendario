import { coupleRepository } from '../repositories/CoupleRepository';
import { eventRepository } from '../repositories/EventRepository';
import { goalRepository } from '../repositories/GoalRepository';
import { wishRepository } from '../repositories/WishRepository';
import { locationRepository } from '../repositories/LocationRepository';
import { supabase } from '../config/supabase';
import { shouldRotateHomeMessage } from '../utils/homeMessage';
import { calculateDaysTogether } from '../utils/daysTogether';

export class HomeService {
  async getDashboard(coupleId: string, userId: string) {
    const couple = await coupleRepository.getCouple(coupleId, userId);
    if (!couple) throw new Error('Pareja no encontrada');
    const now = new Date();
    const events = await eventRepository.listByMonth(
      coupleId,
      userId,
      now.getFullYear(),
      now.getMonth() + 1,
    );
    const upcoming = events
      .filter((e) => e.event_date >= now.toISOString().slice(0, 10))
      .sort((a, b) => a.event_date.localeCompare(b.event_date))[0];

    const goals = await goalRepository.list(coupleId, userId);
    const wishes = await wishRepository.list(coupleId, userId, 'pending');
    const recentEvent = events.sort((a, b) => b.event_date.localeCompare(a.event_date))[0];

    let homeMessage = 'Cada día contigo es un regalo.';
    if (shouldRotateHomeMessage(couple.home_message_shown_at)) {
      const { data: messages } = await supabase
        .from('romance_messages')
        .select('id, body')
        .eq('kind', 'home')
        .limit(20);
      if (messages?.length) {
        const pick = messages[Math.floor(Math.random() * messages.length)];
        homeMessage = pick.body;
        await coupleRepository.updateCouple(coupleId, userId, {
          home_message_id: pick.id,
          home_message_shown_at: new Date().toISOString(),
        });
      }
    }

    const locationsCount = recentEvent
      ? (await locationRepository.listByEvent(recentEvent.id, coupleId, userId)).length
      : 0;

    return {
      homeMessage,
      daysTogether: calculateDaysTogether(couple.relationship_start_date),
      upcomingEvent: upcoming ?? null,
      recentEvent,
      goalsCount: goals.length,
      wishesCount: wishes.length,
      locationsCount,
      couple,
    };
  }
}

export const homeService = new HomeService();
