import { Tabs } from 'expo-router';
import { colors } from '../../src/config/theme';
import { Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';

function HomeTabIcon({ focused }: { focused: boolean }) {
  const size = focused ? 24 : 22;
  const stroke = focused ? '#F52DA8' : '#E96AB8';
  const accent = focused ? '#F79AD2' : '#F5B8DA';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.5 11.4L12 3.3L21.5 11.4"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M4.5 10.4V20H19.5V10.4" stroke={stroke} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M14.5 5.4H18V8.4" stroke={accent} strokeWidth={2} strokeLinecap="round" />
      <Path d="M9.5 20V14.2H14.5V20" stroke={accent} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.appShellBg },
        tabBarActiveTintColor: colors.primaryPinkDark,
        tabBarInactiveTintColor: colors.bellMuted,
        tabBarStyle: {
          display: 'none',
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ focused }) => <HomeTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="calendario"
        options={{
          tabBarLabel: 'Calendario',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ color, fontSize: focused ? 20 : 18 }}>📅</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="dias"
        options={{
          tabBarLabel: 'Conteo de días',
          tabBarIcon: ({ focused }) => <Text style={{ fontSize: focused ? 22 : 20 }}>🩷</Text>,
        }}
      />
      <Tabs.Screen
        name="deseos"
        options={{
          tabBarLabel: 'Lista de deseos',
          tabBarIcon: ({ focused }) => <Text style={{ fontSize: focused ? 22 : 20 }}>🤞🏻</Text>,
        }}
      />
      <Tabs.Screen
        name="metas"
        options={{
          tabBarLabel: 'Metas',
          tabBarIcon: ({ focused }) => <Text style={{ fontSize: focused ? 22 : 20 }}>🏆</Text>,
        }}
      />
      <Tabs.Screen
        name="config"
        options={{
          tabBarLabel: 'Ajustes',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ color, fontSize: focused ? 20 : 18 }}>⚙</Text>
          ),
        }}
      />
    </Tabs>
  );
}
