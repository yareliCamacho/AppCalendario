import { goalRepository } from '../repositories/GoalRepository';
import { notificationService } from './NotificationService';
import { calculateGoalProgress } from '../utils/goalProgress';

export class GoalService {
  async create(
    coupleId: string,
    userId: string,
    partnerUserId: string,
    payload: Parameters<typeof goalRepository.create>[2],
  ) {
    const goal = await goalRepository.create(coupleId, userId, payload);
    await notificationService.notifyPartner({
      coupleId,
      actorId: userId,
      recipientId: partnerUserId,
      type: 'goal',
      title: 'Nueva meta',
      body: goal.title,
      entityId: goal.id,
    });
    return goal;
  }

  async updateSaved(
    goalId: string,
    coupleId: string,
    userId: string,
    partnerUserId: string,
    savedAmount: number,
    targetAmount: number,
  ) {
    const goal = await goalRepository.updateSaved(goalId, coupleId, userId, savedAmount);
    const percent = calculateGoalProgress(savedAmount, targetAmount);
    if (percent > 0 && percent % 25 === 0) {
      await notificationService.notifyPartner({
        coupleId,
        actorId: userId,
        recipientId: partnerUserId,
        type: 'goal',
        title: 'Progreso en meta',
        body: `${goal.title}: ${percent}%`,
        entityId: goal.id,
      });
    }
    return goal;
  }
}

export const goalService = new GoalService();
