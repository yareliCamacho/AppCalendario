import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  Switch,
  View,
  Pressable,
  TextInput,
  ActivityIndicator,
  Keyboard,
  type TextInput as TextInputType,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as Location from 'expo-location';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCoupleContext } from '../../src/config/CoupleProvider';
import { eventRepository } from '../../src/repositories/EventRepository';
import { locationRepository } from '../../src/repositories/LocationRepository';
import { isReminderOnlyEvent } from '../../src/utils/eventKind';
import { mapsService, type PlaceSuggestion } from '../../src/services/MapsService';
import { ScreenBackground, scrollOnAppBackground } from '../../src/components/ui/ScreenBackground';
import { SoftCard } from '../../src/components/ui/SoftCard';
import { CalendarStackHeader } from '../../src/components/calendar/CalendarStackHeader';
import { FormFieldRow } from '../../src/components/calendar/FormFieldRow';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { Button } from '../../src/components/ui/Button';
import { ErrorBanner } from '../../src/components/ui/ErrorBanner';
import { LoadingOverlay } from '../../src/components/ui/LoadingOverlay';
import { CoupleMap } from '../../src/components/maps/CoupleMap';
import { mapError } from '../../src/utils/errors';
import { colors, spacing, contentMaxWidth, radii, glass } from '../../src/config/theme';

const DESC_MAX = 150;

function formatPlaceLabel(place: PlaceSuggestion): string {
  if (place.subtitle) return `${place.name}, ${place.subtitle}`;
  return place.name;
}

export default function AddLocationScreen() {
  const { eventId, date, fromHome } = useLocalSearchParams<{
    eventId: string;
    date?: string;
    fromHome?: string;
  }>();
  const memoryFlow = fromHome === '1' || fromHome === 'true';
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { coupleId, userId } = useCoupleContext();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!eventId || !coupleId || !userId) return;
    let alive = true;
    eventRepository
      .getById(eventId, coupleId, userId)
      .then((ev) => {
        if (!alive) return;
        if (ev && isReminderOnlyEvent(ev)) {
          setError('Esta fecha es solo un recordatorio y no admite ubicación.');
          setTimeout(() => router.back(), 1200);
        }
      })
      .catch(() => null);
    return () => {
      alive = false;
    };
  }, [eventId, coupleId, userId]);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [addressLabel, setAddressLabel] = useState('');
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [showOnMap, setShowOnMap] = useState(true);
  const [lat, setLat] = useState(20.6534);
  const [lng, setLng] = useState(-101.9653);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<TextInputType>(null);
  const biasRef = useRef({ lat: 20.6534, lng: -101.9653 });

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
    searchInputRef.current?.blur();
    setSearchFocused(false);
  }, []);

  const applyPlace = useCallback(
    (place: PlaceSuggestion) => {
      setLat(place.latitude);
      setLng(place.longitude);
      setName(place.name);
      const label = formatPlaceLabel(place);
      setSearch(label);
      setAddressLabel(label);
      setPlaceId(place.placeId);
      setSuggestions([]);
      dismissKeyboard();
    },
    [dismissKeyboard],
  );

  const onMapCoordinateChange = useCallback(async (newLat: number, newLng: number) => {
    dismissKeyboard();
    setLat(newLat);
    setLng(newLng);
    setSearching(true);
    try {
      const label = await mapsService.reverseGeocode(newLat, newLng);
      const shortName = label.split(',')[0]?.trim() ?? label;
      setName(shortName);
      setSearch(label);
      setAddressLabel(label);
    } finally {
      setSearching(false);
    }
  }, [dismissKeyboard]);

  useEffect(() => {
    biasRef.current = { lat, lng };
  }, [lat, lng]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const q = search.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { lat: biasLat, lng: biasLng } = biasRef.current;
        const results = await mapsService.searchPlaces(q, biasLat, biasLng);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  const pickCurrent = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setError('Activa el permiso de ubicación para usar GPS.');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setLat(loc.coords.latitude);
    setLng(loc.coords.longitude);
    const label = await mapsService.reverseGeocode(loc.coords.latitude, loc.coords.longitude);
    const shortName = label.split(',')[0]?.trim() ?? label;
    setName(shortName);
    setSearch(label);
    setAddressLabel(label);
    const nearby = await mapsService.searchNearby(loc.coords.latitude, loc.coords.longitude);
    setSuggestions(nearby);
    dismissKeyboard();
  };

  const showDropdown = searchFocused && search.trim().length >= 2;

  const goToPhotos = () => {
    if (!eventId) {
      setError('Primero guarda la fecha especial.');
      return;
    }
    router.replace({
      pathname: '/calendar/add-photos',
      params: { eventId, date: date ?? '', fromHome: memoryFlow ? '1' : '' },
    });
  };

  const returnToDayDetail = () => {
    router.replace({
      pathname: '/calendar/day-detail',
      params: { date: date ?? '', fromHome: memoryFlow ? '1' : '' },
    });
  };

  const resetLocationForm = () => {
    setSearch('');
    setName('');
    setAddressLabel('');
    setPlaceId(null);
    setDescription('');
    setShowOnMap(true);
    setSuggestions([]);
  };

  const persistLocation = async (): Promise<boolean> => {
    setError('');
    if (!eventId) {
      setError('No hay fecha guardada. Vuelve atrás y guarda la fecha primero.');
      return false;
    }
    if (!coupleId || !userId) {
      setError('Sesión o espacio de pareja no disponible.');
      return false;
    }
    if (!name.trim()) {
      setError('Escribe el nombre del lugar o elige uno en la búsqueda.');
      return false;
    }

    setSaving(true);
    try {
      await locationRepository.create(eventId, coupleId, userId, {
        name: name.trim(),
        latitude: lat,
        longitude: lng,
        description: description || null,
        show_on_map: showOnMap,
        place_id: placeId,
      });
      await qc.invalidateQueries({ queryKey: ['locations', eventId] });
      await qc.invalidateQueries({ queryKey: ['event', coupleId, date] });
      return true;
    } catch (e) {
      setError(mapError(e));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveAndGoPhotos = async () => {
    if (await persistLocation()) goToPhotos();
  };

  const saveAndAddAnother = async () => {
    if (await persistLocation()) resetLocationForm();
  };

  const saveAndReturn = async () => {
    if (await persistLocation()) returnToDayDetail();
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
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={dismissKeyboard}
      >
        <CalendarStackHeader
          title="Agregar ubicación"
          subtitle="Puedes guardar varios lugares en la misma fecha"
        />
        <ErrorBanner message={error} />

        <View style={styles.searchWrap}>
          <View style={[styles.searchRow, glass.surface, showDropdown && styles.searchRowOpen]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              value={search}
              onChangeText={(t) => {
                setSearch(t);
                setSearchFocused(true);
              }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => {
                setTimeout(() => setSearchFocused(false), 200);
              }}
              placeholder="Buscar ciudad o lugar (ej. Jerecuaro)"
              placeholderTextColor={colors.textMuted}
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={dismissKeyboard}
            />
            {searching ? (
              <ActivityIndicator size="small" color={colors.primaryPinkDark} style={styles.inlineLoader} />
            ) : (
              <Pressable onPress={pickCurrent} style={styles.gpsBtn} accessibilityLabel="Mi ubicación">
                <Text style={styles.gpsIcon}>◎</Text>
              </Pressable>
            )}
          </View>

          {showDropdown ? (
            <View style={[styles.dropdown, glass.surface]}>
              {searching && suggestions.length === 0 ? (
                <Text style={styles.dropdownEmpty}>Buscando…</Text>
              ) : null}
              {suggestions.map((s, index) => (
                <Pressable
                  key={`${s.placeId}-${index}`}
                  style={({ pressed }) => [
                    styles.dropdownItem,
                    index < suggestions.length - 1 && styles.dropdownItemBorder,
                    pressed && styles.dropdownItemPressed,
                  ]}
                  onPress={() => applyPlace(s)}
                >
                  <Text style={styles.dropdownIcon}>📍</Text>
                  <View style={styles.dropdownText}>
                    <Text style={styles.dropdownTitle} numberOfLines={1}>
                      {s.name}
                    </Text>
                    {s.subtitle ? (
                      <Text style={styles.dropdownSub} numberOfLines={2}>
                        {s.subtitle}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
              {!searching && suggestions.length === 0 ? (
                <Text style={styles.dropdownEmpty}>
                  Sin resultados. Prueba otra palabra o toca el mapa.
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        <SoftCard style={styles.mapCard} padded={false}>
          <CoupleMap
            latitude={lat}
            longitude={lng}
            title={name || 'Ubicación'}
            height={220}
            onCoordinateChange={onMapCoordinateChange}
          />
          <Pressable onPress={dismissKeyboard}>
            <Text style={styles.mapHint}>Toca el mapa o arrastra el pin para elegir el lugar</Text>
          </Pressable>
          {name ? (
            <View style={[styles.mapCallout, glass.mapRow]}>
              <Text style={styles.calloutTitle}>{name}</Text>
              {addressLabel ? (
                <Text style={styles.calloutSub} numberOfLines={2}>
                  {addressLabel}
                </Text>
              ) : null}
            </View>
          ) : null}
        </SoftCard>

        <SoftCard>
          <FormFieldRow icon="📍" label="Nombre del lugar">
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ej. Jerecuaro"
              placeholderTextColor={colors.textMuted}
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={dismissKeyboard}
            />
          </FormFieldRow>

          <FormFieldRow icon="💬" label="Descripción (opcional)">
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={(t) => setDescription(t.slice(0, DESC_MAX))}
              placeholder="El lugar donde vimos el atardecer juntos por primera vez."
              placeholderTextColor={colors.textMuted}
              multiline
              blurOnSubmit
              onSubmitEditing={dismissKeyboard}
            />
            <Text style={styles.counter}>
              {description.length}/{DESC_MAX}
            </Text>
          </FormFieldRow>

          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>Mostrar en mapa</Text>
              <Text style={styles.switchHint}>
                Este lugar será visible en nuestro mapa compartido.
              </Text>
            </View>
            <Switch
              value={showOnMap}
              onValueChange={setShowOnMap}
              trackColor={{ false: colors.border, true: colors.primaryPinkLight }}
              thumbColor={showOnMap ? colors.primaryPinkDark : colors.white}
            />
          </View>
        </SoftCard>

        <GradientButton
          title={
            saving
              ? 'Guardando...'
              : memoryFlow
                ? 'Guardar y continuar con fotos'
                : 'Guardar ubicación'
          }
          onPress={() => void (memoryFlow ? saveAndGoPhotos() : saveAndReturn())}
          icon="♥"
          disabled={saving}
        />
        <Button
          title="Guardar y agregar otro lugar"
          variant="secondary"
          onPress={() => void saveAndAddAnother()}
          disabled={saving}
          style={styles.secondaryBtn}
        />
        {memoryFlow ? (
          <Button
            title="Continuar sin ubicación"
            variant="ghost"
            onPress={goToPhotos}
            style={styles.skipBtn}
            disabled={saving}
          />
        ) : (
          <Button
            title="Volver a recuerdos del día"
            variant="ghost"
            onPress={returnToDayDetail}
            style={styles.skipBtn}
            disabled={saving}
          />
        )}
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
  searchWrap: {
    marginBottom: spacing.md,
    zIndex: 20,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
  },
  searchRowOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  searchIcon: { fontSize: 16, marginRight: spacing.sm },
  searchInput: { flex: 1, paddingVertical: spacing.md, color: colors.text, fontSize: 15 },
  inlineLoader: { marginRight: spacing.xs },
  gpsBtn: { padding: spacing.sm },
  gpsIcon: { fontSize: 20, color: colors.primaryPinkDark },
  dropdown: {
    borderTopWidth: 0,
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
    maxHeight: 240,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemPressed: { backgroundColor: 'rgba(255, 200, 225, 0.35)' },
  dropdownIcon: { fontSize: 16 },
  dropdownText: { flex: 1 },
  dropdownTitle: { fontWeight: '700', color: colors.text, fontSize: 15 },
  dropdownSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  dropdownEmpty: {
    padding: spacing.md,
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  mapCard: { marginBottom: spacing.md, overflow: 'hidden' },
  mapHint: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  mapCallout: {
    padding: spacing.md,
  },
  calloutTitle: { fontWeight: '700', color: colors.text },
  calloutSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 15,
    ...glass.input,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  counter: { textAlign: 'right', fontSize: 11, color: colors.textMuted, marginTop: 4 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  switchText: { flex: 1 },
  switchTitle: { fontWeight: '700', color: colors.text },
  switchHint: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  secondaryBtn: { marginTop: spacing.sm },
  skipBtn: { marginTop: spacing.sm },
});
