import { Stack } from 'expo-router';
import { stackScreenOptionsNoHeader } from '../../src/config/navigation';

export default function CalendarLayout() {
  return <Stack screenOptions={stackScreenOptionsNoHeader} />;
}
