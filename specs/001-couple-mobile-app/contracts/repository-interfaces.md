# Repository & Service Contracts

**Feature**: `001-couple-mobile-app`

Capas: **Screen → Hook → Service → Repository → Supabase**.

## AuthRepository

| Method | Input | Output | Errors |
|--------|-------|--------|--------|
| `signUp` | email, password, displayName | Session | `EMAIL_IN_USE`, `WEAK_PASSWORD` |
| `signIn` | email, password | Session | `INVALID_CREDENTIALS` |
| `signOut` | — | void | — |
| `getSession` | — | Session \| null | — |
| `resetPassword` | email | void | — |

## UserRepository

| Method | Input | Output |
|--------|-------|--------|
| `getProfile` | userId | User |
| `updateProfile` | partial User | User |
| `updatePushToken` | token | void |

## CoupleRepository

| Method | Input | Output |
|--------|-------|--------|
| `getCurrentCouple` | — | Couple \| null |
| `createCouple` | — | Couple (owner member) |
| `updateCouple` | CoupleUpdate | Couple |
| `getMembers` | coupleId | CoupleMember[] |

## PairingRepository

| Method | Input | Output |
|--------|-------|--------|
| `createPairCode` | coupleId | PairCode + QR payload |
| `joinByCode` | code: string(6) | coupleId (RPC) |
| `getActiveCode` | coupleId | PairCode \| null |

## EventRepository

| Method | Input | Output |
|--------|-------|--------|
| `listByMonth` | coupleId, year, month | Event[] |
| `getByDate` | coupleId, date | Event \| null |
| `create` | EventCreate | Event |
| `update` | id, EventUpdate | Event |
| `delete` | id | void |

## LocationRepository

| Method | Input | Output |
|--------|-------|--------|
| `listByEvent` | eventId | EventLocation[] |
| `create` | LocationCreate | EventLocation |
| `delete` | id | void |

## PhotoRepository

| Method | Input | Output |
|--------|-------|--------|
| `listByEvent` | eventId, page, pageSize | Paginated<EventPhoto> |
| `upload` | file, eventId, onProgress(%) | EventPhoto |
| `delete` | id | void |
| `getSignedUrl` | storagePath | string |

## WishRepository / GoalRepository / MilestoneRepository

CRUD estándar filtrado por `coupleId`; `WishRepository.markFulfilled(id)`.

## NotificationRepository

| Method | Input | Output |
|--------|-------|--------|
| `listForUser` | page | Notification[] |
| `markRead` | id | void |
| `createForPartner` | type, entityId, title, body | Notification |

## ThemeRepository

| Method | Input | Output |
|--------|-------|--------|
| `list` | — | Theme[] |
| `applyToCouple` | coupleId, themeId | void |

## Services (business rules)

### PairingService

- Genera código 6 dígitos criptográficamente seguro.
- Expiración 24 h; un solo consumo.
- Rechaza join si usuario ya en otra pareja.

### PhotoUploadService

1. `optimizeImage(uri)` → max width 1920, quality 0.8.
2. `PhotoRepository.upload` con callback de progreso.
3. Inserta fila `event_photos` tras upload exitoso.
4. `NotificationService.notifyPartner('photo', ...)`.

### NotificationService

- Crea fila `notifications` para el otro miembro.
- Dispara push vía Edge Function si preferencias activas.
- Local schedule para `reminder_days` en eventos (Expo Notifications).

### AiSuggestionService

```typescript
interface AiSuggestionService {
  suggestRomanticText(context: {
    kind: 'event_description' | 'memory_note' | 'calendar_quote';
    title?: string;
    locale?: string;
  }): Promise<string>;
}
```

Proveedor seleccionado por `AI_PROVIDER` env; timeout 10 s; fallback a catálogo `romance_messages`.

### MapsService (Google)

| Method | Purpose |
|--------|---------|
| `reverseGeocode` | lat/lng → nombre |
| `searchNearby` | sugerencias cercanas |
| `placeDetails` | place_id → coordenadas |

## Realtime subscriptions (useRealtimeSync)

| Channel | Table | Filter |
|---------|-------|--------|
| `couple-events` | events | `couple_id=eq.{id}` |
| `couple-photos` | event_photos | `couple_id=eq.{id}` |
| `couple-wishes` | wishes | `couple_id=eq.{id}` |
| `couple-goals` | goals | `couple_id=eq.{id}` |
| `couple-notifications` | notifications | `user_id=eq.{uid}` |

Invalidar React Query cache en cada `INSERT`/`UPDATE`/`DELETE`.

## UI contracts (responsive)

- Usar `useWindowDimensions` + tokens de espaciado; máx. ancho contenido 600 en tablet.
- `HeartPhoto`, `PhotoGallery` (paginated FlatList), `UploadProgressBar` (%).
- Tabs: iconos + labels; safe area en iOS/Android.
