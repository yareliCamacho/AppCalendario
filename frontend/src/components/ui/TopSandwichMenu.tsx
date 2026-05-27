import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, glass, radii, spacing } from '../../config/theme';

export function TopSandwichMenu() {
  const [expanded, setExpanded] = useState(false);

  const go = (
    path:
      | '/'
      | '/calendario'
      | '/dias'
      | '/deseos'
      | '/metas'
      | '/config'
      | '/notifications',
  ) => {
    router.navigate(path);
    setExpanded(false);
  };

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.menuBtn} onPressIn={() => setExpanded((v) => !v)}>
        <Text style={styles.menuBtnIcon}>{expanded ? '✕' : '☰'}</Text>
      </Pressable>
      {expanded ? (
        <View style={styles.menuPanel}>
          <Pressable onPressIn={() => go('/')} style={styles.menuItem} hitSlop={8}>
            <Text style={styles.menuItemIcon}>🏡</Text><Text style={styles.menuItemText}>Inicio</Text>
          </Pressable>
          <Pressable onPressIn={() => go('/calendario')} style={styles.menuItem} hitSlop={8}>
            <Text style={styles.menuItemIcon}>📅</Text><Text style={styles.menuItemText}>Calendario</Text>
          </Pressable>
          <Pressable onPressIn={() => go('/dias')} style={styles.menuItem} hitSlop={8}>
            <Text style={styles.menuItemIcon}>🩷</Text><Text style={styles.menuItemText}>Conteo</Text>
          </Pressable>
          <Pressable onPressIn={() => go('/deseos')} style={styles.menuItem} hitSlop={8}>
            <Text style={styles.menuItemIcon}>🤞🏻</Text><Text style={styles.menuItemText}>Deseos</Text>
          </Pressable>
          <Pressable onPressIn={() => go('/metas')} style={styles.menuItem} hitSlop={8}>
            <Text style={styles.menuItemIcon}>🏆</Text><Text style={styles.menuItemText}>Metas</Text>
          </Pressable>
          <Pressable onPressIn={() => go('/config')} style={styles.menuItem} hitSlop={8}>
            <Text style={styles.menuItemIcon}>⚙</Text><Text style={styles.menuItemText}>Ajustes</Text>
          </Pressable>
          <Pressable onPressIn={() => go('/notifications')} style={styles.menuItem} hitSlop={8}>
            <Text style={styles.menuItemIcon}>🔔</Text><Text style={styles.menuItemText}>Notificaciones</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', zIndex: 8 },
  menuBtn: {
    minWidth: 56,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtnIcon: {
    color: colors.primaryPinkDark,
    fontSize: 40,
    fontWeight: '700',
    marginTop: -1,
  },
  menuPanel: {
    position: 'absolute',
    top: 60,
    right: 0,
    borderRadius: radii.md,
    padding: spacing.xs,
    minWidth: 170,
    ...glass.panel,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderColor: 'rgba(255, 255, 255, 0.92)',
    shadowColor: colors.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 1,
    minHeight: 52,
  },
  menuItemIcon: { fontSize: 20 },
  menuItemText: { color: colors.text, fontSize: 15, fontWeight: '700' },
});
