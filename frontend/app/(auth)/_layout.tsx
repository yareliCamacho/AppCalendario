import { Stack } from 'expo-router';
import { stackScreenOptionsWithHeader } from '../../src/config/navigation';

export default function AuthLayout() {
  return <Stack screenOptions={stackScreenOptionsWithHeader} />;
}
