import { useState } from 'react';
import { ScrollView, StyleSheet, Text, Switch, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as Location from 'expo-location';
import { useCoupleContext } from '../../src/config/CoupleProvider';
import { coupleRepository } from '../../src/repositories/CoupleRepository';
import { locationRepository } from '../../src/repositories/LocationRepository';
import { notificationService } from '../../src/services/NotificationService';
import { mapsService } from '../../src/services/MapsService';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { CoupleMap } from '../../src/components/maps/CoupleMap';
import { colors, spacing } from '../../src/config/theme';

export default function AddLocationScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { coupleId, userId } = useCoupleContext();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showOnMap, setShowOnMap] = useState(true);
  const [lat, setLat] = useState(19.4326);
  const [lng, setLng] = useState(-99.1332);
  const [suggestions, setSuggestions] = useState<{ name: string }[]>([]);

  const pickCurrent = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({});
    setLat(loc.coords.latitude);
    setLng(loc.coords.longitude);
    const label = await mapsService.reverseGeocode(loc.coords.latitude, loc.coords.longitude);
    setName(label);
    const nearby = await mapsService.searchNearby(loc.coords.latitude, loc.coords.longitude);
    setSuggestions(nearby);
  };

  const save = async () => {
    if (!eventId || !coupleId || !userId || !name.trim()) return;
    await locationRepository.create(eventId, coupleId, userId, {
      name: name.trim(),
      latitude: lat,
      longitude: lng,
      description: description || null,
      show_on_map: showOnMap,
      place_id: null,
    });
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Agregar ubicación</Text>
      <Button title="Usar mi ubicación" variant="secondary" onPress={pickCurrent} />
      <CoupleMap latitude={lat} longitude={lng} title={name} />
      <Input label="Nombre del lugar" value={name} onChangeText={setName} />
      <Input label="Descripción" value={description} onChangeText={setDescription} />
      <View style={styles.row}>
        <Text>Mostrar en mapa</Text>
        <Switch value={showOnMap} onValueChange={setShowOnMap} />
      </View>
      {suggestions.map((s) => (
        <Button key={s.name} title={s.name} variant="ghost" onPress={() => setName(s.name)} />
      ))}
      <Button title="Guardar ubicación" onPress={save} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  heading: { fontWeight: '700', marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: spacing.md },
});
