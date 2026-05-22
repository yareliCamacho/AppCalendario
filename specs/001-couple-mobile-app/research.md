# Research: Aplicación móvil para parejas

**Feature**: `001-couple-mobile-app` | **Date**: 2026-05-22

## 1. Expo Router vs React Navigation standalone

**Decision**: Expo Router (file-based) con grupo `(tabs)` y `(auth)`.

**Rationale**: Integración nativa con Expo, deep linking, y separación clara auth/app sin boilerplate manual.

**Alternatives considered**: React Navigation manual — más flexible pero más configuración inicial para MVP.

## 2. Supabase Auth + perfil en `users`

**Decision**: `auth.users` (Supabase) + tabla pública `users` sincronizada vía trigger `on_auth_user_created`.

**Rationale**: RLS usa `auth.uid()`; perfil extendido (display_name, avatar_url) en `users.id = auth.uid()`.

**Alternatives considered**: Solo metadata en auth — insuficiente para queries de pareja y joins.

## 3. Límite de 2 miembros

**Decision**: Constraint + RPC `join_couple_by_code`:
- `couple_members` UNIQUE (`couple_id`, `user_id`)
- Trigger o check: `COUNT(*) <= 2` por `couple_id`
- RPC valida código, expiración 24 h, y cupo antes de INSERT

**Rationale**: Defensa en profundidad (cliente + DB) alineado a FR-003/FR-005 y constitución V.

**Alternatives considered**: Solo validación en app — rechazado por riesgo de bypass.

## 4. Realtime + notificaciones

**Decision**:
- **Realtime**: suscripciones postgres_changes en `events`, `wishes`, `goals`, `notifications`, `event_photos` filtradas por `couple_id` del hook `useCouple`.
- **Push**: fila en `notifications` → Database Webhook o Edge Function `send-push` → FCM con token guardado en `users.push_token`.
- **In-app**: Expo Notifications para foreground/local scheduling de recordatorios de eventos (1–15 días).

**Rationale**: Cumple FR-023 y SC-004; Realtime para UI instantánea, FCM cuando app en background.

**Alternatives considered**: Solo polling — peor UX y batería.

## 5. Fotos: optimización y Storage

**Decision**:
1. `expo-image-manipulator`: resize max width 1920, compress 0.8
2. Path Storage: `{couple_id}/{event_id}/{uuid}.jpg`
3. Progreso: callback `upload` de supabase-js reportado en UI (%)
4. Galería: `FlatList` + thumbnails signed URLs (transform/query params) paginados

**Rationale**: Constitución IV (FR-026, FR-027); reduce costo y tiempo de subida.

**Alternatives considered**: Subir original — rechazado por tamaño y rendimiento móvil.

## 6. Google Maps en Expo

**Decision**: `react-native-maps` con provider Google; Places Autocomplete vía REST (proxy en Edge Function opcional para ocultar API key) o `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` restringida por bundle ID/package.

**Rationale**: Requisito de mapa, pin y sugerencias cercanas (FR-014).

**Alternatives considered**: Mapbox — no solicitado por stakeholder.

## 7. Proveedor de IA (OpenAI vs Gemini)

**Decision**: `AiSuggestionService` con adaptador único; selección por env `AI_PROVIDER=openai|gemini` y clave en EAS Secret. Respuestas solo en cliente bajo demanda (botón “Sugerir”), sin persistir prompts con PII.

**Rationale**: Usuario indicó ambos; abstracción evita lock-in.

**Alternatives considered**: Solo catálogo local — insuficiente para “sugerencia IA” en fechas.

## 8. Hitos (Conteo de días)

**Decision**: Tabla `milestones` (`couple_id`, `type` enum, title, date, description, photo_path) además de tablas solicitadas.

**Rationale**: Spec FR-018 exige cuatro tipos fijos; no sobrecargar `events`.

**Alternatives considered**: `events` con tag — mezcla calendario con hitos históricos.

## 9. Mensaje bonito rotatorio (3 días)

**Decision**: Campos en `couples`: `home_message_id`, `home_message_shown_at`; catálogo `romance_messages` (seed); job cliente al abrir Inicio compara `now - shown_at >= 3 days`.

**Rationale**: SC-006; funciona offline con caché AsyncStorage.

## 10. Testing stack

**Decision**: Jest + RTL para hooks/servicios; `@supabase/supabase-js` contra Supabase local CLI en integration; Maestro YAML para E2E vinculación y subida.

**Rationale**: Constitución II dominios obligatorios.

**Alternatives considered**: Solo manual QA — no cumple principio II.

## 11. Temas visuales

**Decision**: Tabla `themes` + tokens en `src/config/theme.ts` (azul claro `#B3D9FF`, rosa claro `#FFB3D9` por defecto). `couples.theme_id` FK.

**Rationale**: FR-007 y pantalla Configuración.

## Resolved Clarifications

No quedan NEEDS CLARIFICATION del Technical Context; stack definido por el usuario en `/speckit.plan`.
