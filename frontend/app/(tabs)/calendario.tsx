import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCoupleContext } from '../../src/config/CoupleProvider';
import { eventRepository } from '../../src/repositories/EventRepository';
import { eventService } from '../../src/services/EventService';
import { mapError } from '../../src/utils/errors';
import { Button } from '../../src/components/ui/Button';
import { ErrorBanner } from '../../src/components/ui/ErrorBanner';
import { TabScreenShell, scrollOnAppBackground } from '../../src/components/ui/TabScreenShell';
import { SoftCard } from '../../src/components/ui/SoftCard';
import { colors, spacing, contentMaxWidth, radii, glass } from '../../src/config/theme';
import { useTabScrollInsets } from '../../src/hooks/useTabScrollInsets';
import { formatDateLong, daysUntil } from '../../src/utils/formatDate';
import {
  isReminderOnlyEvent,
  pickPreferredDayEventForDate,
} from '../../src/utils/eventKind';
import { invalidateAfterEventDelete } from '../../src/utils/invalidateEventQueries';
import { TopSandwichMenu } from '../../src/components/ui/TopSandwichMenu';

const WEEKDAYS = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];
export default function CalendarioScreen() {
  const { date: focusDate, fromHome } = useLocalSearchParams<{
    date?: string;
    fromHome?: string;
  }>();
  const hideCalendar = fromHome === '1' || fromHome === 'true';
  const insets = useSafeAreaInsets();
  const { contentContainerStyle: tabScrollStyle } = useTabScrollInsets();
  const qc = useQueryClient();
  const { coupleId, userId } = useCoupleContext();
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const now = new Date();
  const [viewDate, setViewDate] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(now.getDate());

  useEffect(() => {
    if (!focusDate) return;
    const [y, m, d] = focusDate.split('-').map(Number);
    if (y && m && d) {
      setViewDate(new Date(y, m - 1, 1));
      setSelectedDay(d);
    }
  }, [focusDate]);

  useEffect(() => {
    if (!hideCalendar || !focusDate) return;
    router.replace({
      pathname: '/calendar/day-detail',
      params: { date: focusDate, fromHome: '1' },
    });
  }, [hideCalendar, focusDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1;

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', coupleId, year, month],
    enabled: Boolean(coupleId && userId),
    queryFn: () => eventRepository.listByMonth(coupleId!, userId!, year, month),
  });

  const markedDates = useMemo(() => new Set(events.map((e) => e.event_date)), [events]);
  const markedDays = useMemo(() => {
    const set = new Set<number>();
    for (const iso of markedDates) {
      const [, m, d] = iso.split('-').map(Number);
      if (m === month) set.add(d);
    }
    return set;
  }, [markedDates, month]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = (new Date(year, month - 1, 1).getDay() + 6) % 7;

  const cells = useMemo(() => {
    const arr: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [daysInMonth, firstDay]);

  const isoDay = (day: number) =>
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const selectDay = (day: number) => setSelectedDay(day);

  const shiftMonth = (delta: number) => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
    setSelectedDay(1);
  };

  const selectedDate = isoDay(selectedDay);
  const selectedEvent = pickPreferredDayEventForDate(events, selectedDate);
  const isReminderDay = isReminderOnlyEvent(selectedEvent);

  const enableMemoriesForDay = async () => {
    if (!selectedEvent || !coupleId || !userId) return;
    setError('');
    try {
      await eventRepository.update(selectedEvent.id, coupleId, userId, {
        reminder_only: false,
      });
      await qc.invalidateQueries({ queryKey: ['events', coupleId, year, month] });
      await qc.invalidateQueries({ queryKey: ['event', coupleId, selectedDate] });
      await qc.invalidateQueries({ queryKey: ['home', coupleId] });
      router.push({
        pathname: '/calendar/day-detail',
        params: { date: selectedDate, fromHome: '1' },
      });
    } catch (e) {
      setError(mapError(e));
    }
  };

  const monthLabel = new Date(year, month - 1).toLocaleDateString('es-MX', {
    month: 'long',
    year: 'numeric',
  });

  const confirmDeleteEvent = () => {
    if (!selectedEvent || !coupleId || !userId) return;
    Alert.alert(
      'Eliminar del calendario',
      `¿Eliminar «${selectedEvent.title}» del ${formatDateLong(selectedEvent.event_date)}? Se quitará de Inicio, notificaciones y se borrarán fotos y ubicaciones.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            void handleDeleteEvent();
          },
        },
      ],
    );
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent || !coupleId || !userId) return;
    setError('');
    setDeleting(true);
    try {
      const deleted = selectedEvent;
      await eventService.deleteEvent(coupleId, userId, deleted.id);
      await invalidateAfterEventDelete(qc, coupleId, {
        eventId: deleted.id,
        eventDate: deleted.event_date,
        year,
        month,
      });
    } catch (e) {
      setError(mapError(e));
    } finally {
      setDeleting(false);
    }
  };

  if (hideCalendar) {
    return (
      <TabScreenShell>
        <View style={styles.redirecting}>
          <ActivityIndicator color={colors.primaryPinkDark} />
        </View>
      </TabScreenShell>
    );
  }

  return (
    <TabScreenShell>
      <ScrollView
        style={[scrollOnAppBackground, styles.scroll]}
        contentContainerStyle={[
          styles.container,
          tabScrollStyle,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ErrorBanner message={error} />

        <View style={styles.titleRow}>
          <Text style={styles.screenTitle}>
            {hideCalendar ? 'Recuerdos del día' : 'Calendario'}
          </Text>
          <View style={styles.titleActions}>
            <TopSandwichMenu />
          </View>
        </View>

        {!hideCalendar ? (
          <SoftCard style={styles.monthCard}>
            <View style={styles.monthHeader}>
              <Pressable onPress={() => shiftMonth(-1)} hitSlop={12} style={styles.arrowBtn}>
                <Text style={styles.monthArrow}>‹</Text>
              </Pressable>
              <Text style={styles.monthTitle}>{monthLabel}</Text>
              <Pressable onPress={() => shiftMonth(1)} hitSlop={12} style={styles.arrowBtn}>
                <Text style={styles.monthArrow}>›</Text>
              </Pressable>
            </View>

            <View style={styles.grid}>
              {WEEKDAYS.map((d) => (
                <Text key={d} style={styles.weekDay}>
                  {d}
                </Text>
              ))}
            </View>

            {isLoading ? (
              <ActivityIndicator
                color={colors.primaryPinkDark}
                style={{ marginVertical: spacing.lg }}
              />
            ) : (
              <View style={styles.grid}>
                {cells.map((day, i) => {
                  if (!day) return <View key={`e-${i}`} style={styles.cellEmpty} />;
                  const dateIso = isoDay(day);
                  const marked = markedDates.has(dateIso);
                  const selected = day === selectedDay;
                  return (
                    <Pressable key={dateIso} style={styles.cell} onPress={() => selectDay(day)}>
                      <View style={styles.dayBubble}>
                        {marked ? (
                          <View style={styles.markedDayWrap}>
                            <Text
                              style={[
                                styles.heartBehind,
                                selected && styles.heartBehindSelected,
                              ]}
                            >
                              ♥
                            </Text>
                            <Text style={styles.dayOnHeart}>
                              {day}
                            </Text>
                          </View>
                        ) : (
                          <Text style={[styles.dayNum, selected && styles.dayNumSelected]}>
                            {day}
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </SoftCard>
        ) : null}

        {selectedEvent ? (
          <View style={styles.memoriesBlock}>
            <SoftCard style={styles.eventCard}>
              <Text style={styles.eventDateBadge}>
                {isReminderDay ? '🔔' : '💕'} {formatDateLong(selectedEvent.event_date)}
              </Text>
              {isReminderDay ? (
                <View style={styles.reminderBody}>
                  <Text style={styles.eventTitle}>{selectedEvent.title}</Text>
                  {selectedEvent.description ? (
                    <Text style={styles.eventDescription} numberOfLines={4}>
                      {selectedEvent.description}
                    </Text>
                  ) : null}
                  <Text style={styles.reminderMeta}>
                    Recordatorio · te avisamos {selectedEvent.reminder_days} día
                    {selectedEvent.reminder_days === 1 ? '' : 's'} antes
                    {daysUntil(selectedEvent.event_date) > 0
                      ? ` · faltan ${daysUntil(selectedEvent.event_date)}`
                      : ''}
                  </Text>
                  <Text style={styles.reminderNote}>
                    Las fechas con recordatorio activado no llevan fotos ni ubicación.
                  </Text>
                  <Button
                    title="Guardar fotos y ubicación en este día"
                    variant="secondary"
                    onPress={() => void enableMemoriesForDay()}
                    style={styles.enableMemoriesBtn}
                  />
                </View>
              ) : (
                <View style={styles.eventTitleCol}>
                  <Text style={styles.eventTitle}>{selectedEvent.title}</Text>
                  {selectedEvent.description || selectedEvent.romantic_note ? (
                    <Text style={styles.eventDescription} numberOfLines={2}>
                      {selectedEvent.description ?? selectedEvent.romantic_note}
                    </Text>
                  ) : null}
                  <Pressable
                    style={styles.detailBtn}
                    onPress={() =>
                      router.push({
                        pathname: '/calendar/day-detail',
                        params: { date: selectedEvent.event_date, fromHome: '1' },
                      })
                    }
                  >
                    <Text style={styles.detailBtnText}>Ver recuerdos del día ›</Text>
                  </Pressable>
                </View>
              )}
            </SoftCard>
          </View>
        ) : (
          <SoftCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Sin recuerdos este día</Text>
            <Text style={styles.emptySub}>
              {hideCalendar
                ? 'Aún no hay fotos ni lugares guardados para esta fecha.'
                : 'Guarda fotos y lugares en Recuerdos del día, o agrega una fecha especial con recordatorio.'}
            </Text>
            {!hideCalendar ? (
              <Pressable
                style={styles.detailBtn}
                onPress={() =>
                  router.push({
                    pathname: '/calendar/day-detail',
                    params: { date: selectedDate, fromHome: '1' },
                  })
                }
              >
                <Text style={styles.detailBtnText}>Ver recuerdos del día ›</Text>
              </Pressable>
            ) : null}
          </SoftCard>
        )}

        {!hideCalendar && !isReminderDay ? (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/calendar/add-event',
                params: { date: selectedDate },
              })
            }
          >
            <LinearGradient
              colors={[colors.gradientPink, colors.primaryPinkDark]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.addBtn}
            >
              <Text style={styles.addText}>+ Agregar nueva fecha</Text>
            </LinearGradient>
          </Pressable>
        ) : null}

        {!hideCalendar && selectedEvent ? (
          <Button
            title={deleting ? 'Eliminando...' : 'Eliminar del calendario'}
            variant="danger"
            onPress={confirmDeleteEvent}
            disabled={deleting}
            style={styles.deleteEventBtn}
          />
        ) : null}
      </ScrollView>
    </TabScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    zIndex: 2,
  },
  container: {
    paddingHorizontal: spacing.md,
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  titleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    flex: 1,
  },
  redirecting: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 },
  monthCard: { marginBottom: spacing.md },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  arrowBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(255, 232, 242, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthArrow: { color: colors.primaryPinkDark, fontSize: 28, fontWeight: '300' },
  monthTitle: { fontSize: 18, fontWeight: '700', color: colors.text, textTransform: 'capitalize' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekDay: {
    width: '14.28%',
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  cellEmpty: { width: '14.28%', aspectRatio: 1 },
  dayBubble: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNum: { fontSize: 15, fontWeight: '600', color: colors.text },
  dayNumSelected: { color: colors.primaryPinkDark, fontWeight: '800' },
  markedDayWrap: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBehind: {
    position: 'absolute',
    fontSize: 44,
    lineHeight: 48,
    color: colors.primaryPinkDark,
    includeFontPadding: false,
  },
  heartBehindSelected: {
    fontSize: 48,
    lineHeight: 52,
  },
  dayOnHeart: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
    zIndex: 1,
    includeFontPadding: false,
    textShadowColor: 'rgba(180, 40, 100, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  memoriesBlock: {
    marginBottom: spacing.sm,
  },
  eventCard: { marginBottom: spacing.md },
  eventDateBadge: { color: colors.primaryPinkDark, fontWeight: '700', fontSize: 13, marginBottom: spacing.xs },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  eventTitleCol: { flex: 1, minWidth: 0 },
  reminderBody: { gap: spacing.xs, marginTop: spacing.sm },
  reminderMeta: { color: colors.primaryPinkDark, fontSize: 13, fontWeight: '600', marginTop: spacing.xs },
  reminderNote: { color: colors.textMuted, fontSize: 12, marginTop: spacing.sm, lineHeight: 16 },
  quoteCard: { marginBottom: spacing.md, alignItems: 'center' },
  quoteMark: { fontSize: 28, color: colors.primaryPinkLight, alignSelf: 'flex-start' },
  quote: {
    fontStyle: 'italic',
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginVertical: spacing.xs,
  },
  quoteMarkEnd: { fontSize: 28, color: colors.primaryPinkLight, alignSelf: 'flex-end' },
  quoteMeta: { color: colors.textMuted, fontSize: 12, marginTop: spacing.sm },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
    width: '100%',
  },
  stat: { alignItems: 'center' },
  statIcon: { fontSize: 18 },
  statVal: { color: colors.textMuted, fontSize: 12, marginTop: 4, fontWeight: '600' },
  emptyMapCard: { marginBottom: spacing.md },
  emptyPhotosCard: { marginBottom: spacing.md },
  noMap: { color: colors.textMuted, marginBottom: spacing.sm, textAlign: 'center' },
  memoryActions: { gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.lg },
  eventTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  eventDescription: { marginTop: spacing.xs, color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  pin: { fontSize: 14 },
  locationText: { color: colors.text, fontWeight: '600', fontSize: 14 },
  detailBtn: { marginTop: spacing.md },
  detailBtnText: { color: colors.primaryPinkDark, fontWeight: '700', fontSize: 14 },
  loadMorePhotos: { alignItems: 'center', marginTop: -spacing.sm, marginBottom: spacing.md },
  loadMorePhotosText: { color: colors.primaryPinkDark, fontWeight: '600', fontSize: 13 },
  emptyCard: { marginBottom: spacing.md, alignItems: 'center' },
  emptyTitle: { fontWeight: '700', color: colors.text },
  emptySub: { color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
  mapCard: { marginBottom: spacing.md, overflow: 'hidden' },
  mapLabel: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  mapLabelPin: { fontSize: 16 },
  mapLabelTitle: { fontWeight: '700', color: colors.text },
  mapLabelSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  addBtn: {
    paddingVertical: spacing.md + 2,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  addText: { fontWeight: '700', color: colors.white, fontSize: 16 },
  deleteEventBtn: { marginTop: spacing.md, marginBottom: spacing.lg },
  enableMemoriesBtn: { marginTop: spacing.md },
});
