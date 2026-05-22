import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { userRepository } from '../repositories/UserRepository';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class PushService {
  async register(userId: string): Promise<string | null> {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      })
    ).data;

    await userRepository.updatePushToken(userId, token);
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Nosotros',
        importance: Notifications.AndroidImportance.MAX,
      });
    }
    return token;
  }
}

export const pushService = new PushService();
