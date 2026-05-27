import * as Notifications from 'expo-notifications';
import type { Event } from '../types/database';

export class ReminderScheduler {
  async scheduleEventReminder(event: Event) {
    const eventDate = new Date(event.event_date);
    const triggerDate = new Date(eventDate);
    triggerDate.setDate(triggerDate.getDate() - event.reminder_days);

    if (triggerDate <= new Date()) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Próxima fecha especial 💕',
        body: `${event.title} — en ${event.reminder_days} día(s)`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  }

  async cancelAll() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

export const reminderScheduler = new ReminderScheduler();
