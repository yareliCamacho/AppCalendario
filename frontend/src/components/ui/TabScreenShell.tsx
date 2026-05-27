import { ViewStyle } from 'react-native';
import { FloatingHearts } from '../calendar/FloatingHearts';
import { ScreenBackground } from './ScreenBackground';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

/** Fondo degradado animado + corazones flotantes en todas las pestañas */
export function TabScreenShell({ children, style }: Props) {
  return (
    <ScreenBackground style={style}>
      <FloatingHearts active />
      {children}
    </ScreenBackground>
  );
}

export { scrollOnAppBackground } from './ScreenBackground';
