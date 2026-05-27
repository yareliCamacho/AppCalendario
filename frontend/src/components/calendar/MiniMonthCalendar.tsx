import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, radii, spacing } from '../../config/theme';

const WEEKDAYS = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];

type Props = {
  year: number;
  month: number;
  selectedDay: number;
  markedDays?: Set<number>;
  compact?: boolean;
  onSelectDay?: (day: number) => void;
};

export function MiniMonthCalendar({
  year,
  month,
  selectedDay,
  markedDays,
  compact,
  onSelectDay,
}: Props) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = (new Date(year, month - 1, 1).getDay() + 6) % 7;

  const cells = useMemo(() => {
    const arr: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [daysInMonth, firstDay]);

  const monthLabel = new Date(year, month - 1).toLocaleDateString('es-MX', {
    month: 'long',
    year: 'numeric',
  });

  const cellSize = compact ? 28 : 32;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.monthTitle, compact && styles.monthTitleCompact]}>{monthLabel}</Text>
      <View style={styles.grid}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={[styles.weekDay, { width: cellSize }]}>
            {compact ? d.slice(0, 1) : d}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (!day) {
            return <View key={`e-${i}`} style={{ width: cellSize, height: cellSize }} />;
          }
          const marked = markedDays?.has(day);
          const selected = day === selectedDay;
          const content = (
            <View
              style={[
                styles.dayBubble,
                { width: cellSize, height: cellSize, borderRadius: cellSize / 2 },
                marked && styles.dayMarked,
                selected && styles.daySelected,
              ]}
            >
              {marked ? (
                <Text style={[styles.heart, selected && styles.heartSelected]}>♥</Text>
              ) : (
                <Text style={[styles.dayNum, selected && styles.dayNumSelected]}>{day}</Text>
              )}
            </View>
          );
          if (onSelectDay) {
            return (
              <Pressable key={day} onPress={() => onSelectDay(day)} style={{ width: cellSize, height: cellSize }}>
                {content}
              </Pressable>
            );
          }
          return <View key={day}>{content}</View>;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  monthTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'capitalize',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  monthTitleCompact: { fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  weekDay: {
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 4,
  },
  dayBubble: { alignItems: 'center', justifyContent: 'center' },
  dayMarked: { backgroundColor: '#FFE8F2' },
  daySelected: { backgroundColor: colors.primaryPinkDark },
  dayNum: { fontSize: 12, fontWeight: '600', color: colors.text },
  dayNumSelected: { color: colors.white },
  heart: { fontSize: 12, color: colors.primaryPinkDark },
  heartSelected: { color: colors.white },
});
