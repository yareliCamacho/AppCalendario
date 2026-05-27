import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCoupleContext } from '../../src/config/CoupleProvider';
import { homeService } from '../../src/services/HomeService';
import { photoRepository } from '../../src/repositories/PhotoRepository';
import { HeartPhoto } from '../../src/components/home/HeartPhoto';
import { MemoryLoveTree } from '../../src/components/home/MemoryLoveTree';
import { HomeStatCard } from '../../src/components/home/HomeStatCard';
import { TabScreenShell, scrollOnAppBackground } from '../../src/components/ui/TabScreenShell';
import { SoftCard } from '../../src/components/ui/SoftCard';
import { colors, spacing, contentMaxWidth, radii } from '../../src/config/theme';
import { useTabScrollInsets } from '../../src/hooks/useTabScrollInsets';
import { Button } from '../../src/components/ui/Button';
import { formatDateLong, daysUntil } from '../../src/utils/formatDate';
import { TopSandwichMenu } from '../../src/components/ui/TopSandwichMenu';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { contentContainerStyle } = useTabScrollInsets();
  const { coupleId, userId, hasCouple } = useCoupleContext();
  const [couplePhotoUri, setCouplePhotoUri] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['home', coupleId],
    enabled: Boolean(coupleId && userId),
    queryFn: () => homeService.getDashboard(coupleId!, userId!),
  });

  const { data: treeLeaves = [], isLoading: treeLoading } = useQuery({
    queryKey: ['home', 'memoryTree', coupleId],
    enabled: Boolean(coupleId && userId),
    queryFn: () => homeService.getMemoryTreeLeaves(coupleId!, userId!),
  });

  useEffect(() => {
    if (!data?.couple.display_photo_path) {
      setCouplePhotoUri(null);
      return;
    }
    photoRepository
      .getSignedUrl(data.couple.display_photo_path)
      .then(setCouplePhotoUri)
      .catch(() => setCouplePhotoUri(null));
  }, [data?.couple.display_photo_path]);

  if (!hasCouple) {
    return (
      <TabScreenShell>
        <View
          style={[styles.center, styles.emptyWrap, styles.aboveHearts, { paddingTop: insets.top + spacing.lg }]}
        >
          <Text style={styles.headerTitle}>¡Hola, amor! 💕</Text>
          <Text style={styles.headerSub}>Cada día contigo es mi favorito.</Text>
          <Text style={styles.helper}>Explora la app y vincula a tu pareja cuando quieras.</Text>
          <MemoryLoveTree leaves={[]} loading={false} />
          <Button
            title="Vincular desde ajustes"
            onPress={() => router.push('/(tabs)/config')}
            style={styles.emptyBtn}
          />
        </View>
      </TabScreenShell>
    );
  }

  const upcoming = data?.upcomingSpecial ?? null;
  const countdown = upcoming ? daysUntil(upcoming.event_date) : 0;

  return (
    <TabScreenShell>
      <ScrollView
        style={scrollOnAppBackground}
        contentContainerStyle={[styles.container, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>¡Hola, amor! 💕</Text>
            <Text style={styles.headerSub}>
              {data?.homeMessage ?? 'Cada día contigo es mi favorito.'}
            </Text>
          </View>
          <TopSandwichMenu />
        </View>

        <MemoryLoveTree leaves={treeLeaves} loading={treeLoading || isLoading} />

        {isLoading || !data ? (
          <View style={styles.inlineLoader}>
            <ActivityIndicator color={colors.primaryPinkDark} />
            <Text style={styles.muted}>Cargando el resto...</Text>
          </View>
        ) : null}

        {!isLoading && data ? (
          <>

        {upcoming ? (
          <SoftCard style={[styles.block, styles.upcomingBlock]}>
            <Text style={styles.sectionLabel}>Próxima fecha especial</Text>
            <Text style={styles.sectionHint}>
              Solo aviso en el calendario · no es un recuerdo con fotos
            </Text>
            <View style={styles.upcomingRow}>
              <View style={styles.iconSquare}>
                <Text style={styles.iconSquareEmoji}>
                  {upcoming.kind === 'anniversary' ? '💗' : '📅'}
                </Text>
              </View>
              <View style={styles.upcomingBody}>
                <Text style={styles.featureTitle} numberOfLines={2}>
                  {upcoming.title} 💕
                </Text>
                <Text style={styles.featureDate}>{formatDateLong(upcoming.event_date)}</Text>
              </View>
              <View style={styles.countdownCol}>
                <Text style={styles.countdownLabel}>Faltan</Text>
                <Text style={styles.countdownNum}>{countdown}</Text>
                <Text style={styles.countdownLabel}>días</Text>
              </View>
            </View>
          </SoftCard>
        ) : null}

        {data.recentEvent ? (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/calendar/day-detail',
                params: { date: data.recentEvent.event_date, fromHome: '1' },
              })
            }
          >
          <SoftCard style={styles.block}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionLabel}>Recuerdo reciente</Text>
                <Text style={styles.sectionHint}>
                  Días con fotos o fechas especiales que ya vivieron
                </Text>
              </View>
              <Text style={styles.link}>Entrar al recuerdo ›</Text>
            </View>
            <View style={styles.memoryRow}>
              <View style={styles.memoryThumb}>
                {couplePhotoUri ? (
                  <Image source={{ uri: couplePhotoUri }} style={styles.memoryImage} />
                ) : (
                  <View style={styles.memoryPlaceholder}>
                    <Text style={styles.memoryPlaceholderIcon}>💕</Text>
                  </View>
                )}
              </View>
              <View style={styles.memoryText}>
                <Text style={styles.featureTitle} numberOfLines={1}>
                  {data.recentEvent.title} 💕
                </Text>
                <Text style={styles.featureDate}>{formatDateLong(data.recentEvent.event_date)}</Text>
                <Text style={styles.romantic} numberOfLines={3}>
                  {data.recentEvent.romantic_note ??
                    data.recentEvent.description ??
                    'Uno de esos días mágicos que quedan para siempre.'}
                </Text>
              </View>
            </View>
          </SoftCard>
          </Pressable>
        ) : null}

        <View style={styles.statsRow}>
          <HomeStatCard label="Días juntos" value={data.daysTogether} accent="pink" />
          <HomeStatCard label="Momentos" value={data.eventsCount} accent="purple" />
          <HomeStatCard label="Lugares" value={data.locationsCount} accent="mint" />
          <HomeStatCard label="Metas" value={data.goalsCount} accent="gold" />
        </View>

        <LinearGradient
          colors={[colors.gradientPink, colors.gradientPurple]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.banner}
        >
          <Text style={styles.bannerSparkle}>✦</Text>
          <Text style={styles.bannerText}>Nunca dejes de crear recuerdos juntos.</Text>
          <View style={styles.bannerHeart}>
            <HeartPhoto uri={couplePhotoUri} size={52} />
          </View>
        </LinearGradient>
          </>
        ) : null}
      </ScrollView>
    </TabScreenShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  aboveHearts: { zIndex: 2 },
  emptyWrap: { paddingHorizontal: spacing.lg },
  emptyBtn: { marginTop: spacing.lg, width: '100%' },
  muted: { color: colors.textMuted, marginTop: spacing.sm },
  inlineLoader: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  helper: { color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' },
  container: {
    paddingHorizontal: spacing.md,
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerText: { flex: 1, paddingRight: spacing.sm },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerSub: { color: colors.textMuted, marginTop: 4, fontSize: 15, lineHeight: 20 },
  block: { marginBottom: spacing.md },
  upcomingBlock: { marginTop: spacing.sm },
  sectionLabel: { fontWeight: '700', fontSize: 15, color: colors.text, marginBottom: spacing.xs },
  sectionHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  sectionHeaderText: { flex: 1, minWidth: 0 },
  link: { color: colors.primaryPinkDark, fontWeight: '600', fontSize: 13 },
  upcomingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconSquare: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    backgroundColor: '#FFE8F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSquareEmoji: { fontSize: 22 },
  upcomingBody: { flex: 1, minWidth: 0 },
  featureTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  featureDate: { color: colors.textMuted, marginTop: 4, fontSize: 13 },
  countdownCol: { alignItems: 'center', minWidth: 56 },
  countdownLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  countdownNum: { fontSize: 28, fontWeight: '800', color: colors.primaryPinkDark, lineHeight: 32 },
  memoryRow: { flexDirection: 'row', gap: spacing.md },
  memoryThumb: {
    width: 88,
    height: 88,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.softRose,
  },
  memoryImage: { width: '100%', height: '100%' },
  memoryPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.softLavender,
  },
  memoryPlaceholderIcon: { fontSize: 28 },
  memoryText: { flex: 1, minWidth: 0 },
  romantic: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginTop: 6 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  banner: {
    marginTop: spacing.lg,
    borderRadius: radii.xl,
    padding: spacing.lg,
    paddingRight: 100,
    minHeight: 88,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bannerText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    maxWidth: '85%',
  },
  bannerSparkle: {
    position: 'absolute',
    top: 12,
    right: 90,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  bannerHeart: {
    position: 'absolute',
    right: -4,
    top: '50%',
    marginTop: -36,
  },
});
