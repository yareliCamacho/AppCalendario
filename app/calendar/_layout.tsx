import { Stack } from 'expo-router';
import { colors } from '../../src/config/theme';

export default function CalendarLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primaryBlue },
        headerTintColor: colors.text,
      }}
    />
  );
}
