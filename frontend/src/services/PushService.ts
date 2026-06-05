import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { userRepository } from '../repositories/UserRepository';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export class PushService {
  private resolveProjectId(): string | undefined {
    return (
      process.env.EXPO_PUBLIC_PROJECT_ID ??
      process.env.EAS_PROJECT_ID ??
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId
    );
  }

  async register(userId: string): Promise<string | null> {
    if (Platform.OS === 'web') return null;

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    const projectId = this.resolveProjectId();
    if (!projectId) return null;

    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
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
