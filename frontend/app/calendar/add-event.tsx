import { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  Switch,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCoupleContext } from '../../src/config/CoupleProvider';
import { coupleRepository } from '../../src/repositories/CoupleRepository';
import { pairingService } from '../../src/services/PairingService';
import { eventService } from '../../src/services/EventService';
import { aiSuggestionService } from '../../src/services/AiSuggestionService';
import { ScreenBackground, scrollOnAppBackground } from '../../src/components/ui/ScreenBackground';
import { SoftCard } from '../../src/components/ui/SoftCard';
import { CalendarStackHeader } from '../../src/components/calendar/CalendarStackHeader';
import { MiniMonthCalendar } from '../../src/components/calendar/MiniMonthCalendar';
import { FormFieldRow } from '../../src/components/calendar/FormFieldRow';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { Button } from '../../src/components/ui/Button';
import { ErrorBanner } from '../../src/components/ui/ErrorBanner';
import { LoadingOverlay } from '../../src/components/ui/LoadingOverlay';
import { mapError } from '../../src/utils/errors';
import { colors, spacing, contentMaxWidth, radii, glass } from '../../src/config/theme';
import { formatDateLong } from '../../src/utils/formatDate';

const TITLE_MAX = 50;
const DESC_MAX = 200;

const iconOptions = [
  { id: 'heart', label: '♥' },
  { id: 'star', label: '★' },
  { id: 'balloon', label: '🎈' },
  { id: 'camera', label: '📷' },
  { id: 'airplane', label: '✈' },
  { id: 'tree', label: '🌳' },
  { id: 'music', label: '♫' },
];

const REMINDER_OPTIONS = [1, 3, 7, 15];

function parseDateParam(date?: string) {
  const d = date ? new Date(`${date}T12:00:00`) : new Date();
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    iso: date ?? d.toISOString().slice(0, 10),
  };
}

export default function AddEventScreen() {
  const { date: dateParam } = useLocalSearchParams<{ date: string }>();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { coupleId, userId, refresh } = useCoupleContext();

  const initial = useMemo(() => parseDateParam(dateParam), [dateParam]);
  const [day, setDay] = useState(initial.day);
  const year = initial.year;
  const month = initial.month;
  const daysInMonth = new Date(year, month, 0).getDate();
  const safeDay = Math.min(day, daysInMonth);
  const eventDate = `${year}-${String(month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderDays, setReminderDays] = useState(1);
  const [icon, setIcon] = useState('heart');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const markedDays = useMemo(() => new Set([safeDay]), [safeDay]);

  const save = async () => {
    setError('');
    if (!title.trim()) {
      setError('Escribe un título para la fecha especial.');
      return;
    }
    if (!userId) {
      setError('Debes iniciar sesión para guardar.');
      return;
    }

    setSaving(true);
    try {
      let activeCoupleId = coupleId;
      if (!activeCoupleId) {
        activeCoupleId = await pairingService.ensureCoupleForOwner(userId);
        await refresh();
      }

      const members = await coupleRepository.getMembers(activeCoupleId, userId);
      const partner = members.find((m) => m.user_id !== userId)?.user_id ?? null;

      const event = await eventService.createEvent(activeCoupleId, userId, partner, {
        event_date: eventDate,
        title: title.trim().slice(0, TITLE_MAX),
        description: description || null,
        color: colors.primaryPink,
        icon,
        reminder_days: reminderEnabled
          ? Math.min(15, Math.max(1, reminderDays))
          : 1,
        romantic_note: description || null,
        reminder_only: reminderEnabled,
      });

      await qc.invalidateQueries({ queryKey: ['events'] });
      await qc.invalidateQueries({ queryKey: ['event', activeCoupleId, eventDate] });
      await qc.invalidateQueries({ queryKey: ['home', activeCoupleId] });

      if (reminderEnabled) {
        router.replace({
          pathname: '/(tabs)/calendario',
          params: { date: eventDate },
        });
      } else {
        router.replace({
          pathname: '/calendar/add-location',
          params: { eventId: event.id, date: eventDate, fromHome: '1' },
        });
      }
    } catch (e) {
      setError(mapError(e));
    } finally {
      setSaving(false);
    }
  };

  const suggest = async () => {
    const text = await aiSuggestionService.suggestRomanticText({
      kind: 'event_description',
      title,
    });
    setDescription(text.slice(0, DESC_MAX));
  };

  return (
    <ScreenBackground>
      <ScrollView
        style={scrollOnAppBackground}
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <CalendarStackHeader
          title="Nueva fecha especial"
          subtitle="Crea un nuevo recuerdo que celebrar juntos 💕"
        />

        <ErrorBanner message={error} />

        <SoftCard style={styles.previewCard}>
          <View style={styles.previewLeft}>
            <View style={styles.previewIconWrap}>
              <Text style={styles.previewIcon}>📅</Text>
            </View>
            <Text style={styles.previewHint}>
              Así se verá en el calendario. El día seleccionado se mostrará como un corazón rosa 💕
            </Text>
          </View>
          <View style={styles.previewCal}>
            <MiniMonthCalendar
              year={year}
              month={month}
              selectedDay={safeDay}
              markedDays={markedDays}
              compact
              onSelectDay={setDay}
            />
          </View>
        </SoftCard>

        <SoftCard>
          <FormFieldRow icon="📅" label="Fecha">
            <Text style={styles.dateValue}>{formatDateLong(eventDate)}</Text>
          </FormFieldRow>

          <FormFieldRow icon="♥" label="Título">
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={(t) => setTitle(t.slice(0, TITLE_MAX))}
              placeholder="Nuestro aniversario"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.counter}>
              {title.length}/{TITLE_MAX}
            </Text>
          </FormFieldRow>

          <FormFieldRow icon="💬" label="Descripción (opcional)">
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={(t) => setDescription(t.slice(0, DESC_MAX))}
              placeholder="El día que comenzamos nuestra historia juntos. 💕"
              placeholderTextColor={colors.textMuted}
              multiline
            />
            <Text style={styles.counter}>
              {description.length}/{DESC_MAX}
            </Text>
          </FormFieldRow>

          <FormFieldRow icon="🎨" label="Color / Icono">
            <View style={styles.iconsRow}>
              {iconOptions.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => setIcon(item.id)}
                  style={[styles.iconChip, icon === item.id && styles.iconChipActive]}
                >
                  <Text style={styles.iconLabel}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </FormFieldRow>

          <FormFieldRow
            icon="🔔"
            label="Enviar recordatorio"
            hint={reminderEnabled ? 'Te avisaremos antes de esta fecha' : undefined}
          >
            <View style={styles.reminderRow}>
              <Switch
                value={reminderEnabled}
                onValueChange={setReminderEnabled}
                trackColor={{ false: colors.border, true: colors.primaryPinkLight }}
                thumbColor={reminderEnabled ? colors.primaryPinkDark : colors.white}
              />
            </View>
            {reminderEnabled ? (
              <View style={styles.reminderChips}>
                {REMINDER_OPTIONS.map((d) => (
                  <Pressable
                    key={d}
                    style={[styles.reminderChip, reminderDays === d && styles.reminderChipActive]}
                    onPress={() => setReminderDays(d)}
                  >
                    <Text
                      style={[
                        styles.reminderChipText,
                        reminderDays === d && styles.reminderChipTextActive,
                      ]}
                    >
                      {d} día{d > 1 ? 's' : ''} antes
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </FormFieldRow>
        </SoftCard>

        <Button title="Sugerir con IA" variant="secondary" onPress={suggest} style={styles.aiBtn} disabled={saving} />
        <GradientButton
          title={saving ? 'Guardando...' : 'Guardar y continuar'}
          onPress={save}
          icon="✦"
          disabled={saving}
        />
        <Text style={styles.flowHint}>
          {reminderEnabled
            ? 'Con recordatorio activo: aviso en el calendario, sin fotos ni ubicación.'
            : 'Sin recordatorio: podrás agregar fotos y ubicación al guardar.'}
        </Text>
      </ScrollView>
      <LoadingOverlay visible={saving} />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  previewCard: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  previewLeft: { flex: 1 },
  previewIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    backgroundColor: '#FFE8F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  previewIcon: { fontSize: 24 },
  previewHint: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  previewCal: { width: 150 },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 15,
    ...glass.input,
  },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  counter: { textAlign: 'right', fontSize: 11, color: colors.textMuted, marginTop: 4 },
  dateValue: { fontSize: 16, fontWeight: '600', color: colors.text },
  iconsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...glass.surface,
  },
  iconChipActive: { backgroundColor: '#FFE8F2', borderColor: colors.primaryPinkDark },
  iconLabel: { fontSize: 18 },
  reminderRow: { alignItems: 'flex-start' },
  reminderChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  reminderChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    ...glass.surface,
  },
  reminderChipActive: { backgroundColor: colors.primaryPinkDark, borderColor: colors.primaryPinkDark },
  reminderChipText: { fontSize: 12, color: colors.text },
  reminderChipTextActive: { color: colors.white, fontWeight: '600' },
  aiBtn: { marginVertical: spacing.md },
  flowHint: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.sm,
  },
});
