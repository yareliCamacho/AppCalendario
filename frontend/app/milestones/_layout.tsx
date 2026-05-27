import { Stack } from 'expo-router';
import { stackScreenOptionsNoHeader } from '../../src/config/navigation';

export default function MilestonesLayout() {
  return <Stack screenOptions={stackScreenOptionsNoHeader} />;
}
