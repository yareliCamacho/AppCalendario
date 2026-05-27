import { Text, View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../config/theme';

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View style={styles.box}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#FFE5E5',
    padding: spacing.md,
    borderRadius: 10,
    marginBottom: spacing.md,
  },
  text: { color: colors.error, fontSize: 14 },
});
