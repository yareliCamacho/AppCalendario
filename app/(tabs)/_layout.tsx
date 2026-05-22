import { Tabs } from 'expo-router';
import { colors } from '../../src/config/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primaryPinkDark,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.primaryBlue },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarLabel: 'Inicio' }} />
      <Tabs.Screen name="calendario" options={{ title: 'Calendario' }} />
      <Tabs.Screen name="dias" options={{ title: 'Días', tabBarLabel: 'Conteo' }} />
      <Tabs.Screen name="deseos" options={{ title: 'Deseos' }} />
      <Tabs.Screen name="metas" options={{ title: 'Metas' }} />
      <Tabs.Screen name="config" options={{ title: 'Configuración' }} />
    </Tabs>
  );
}
