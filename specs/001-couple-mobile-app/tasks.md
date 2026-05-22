---
description: "Tareas de implementación — aplicación móvil para parejas"
---

# Tasks: Aplicación móvil para parejas

**Input**: `specs/001-couple-mobile-app/` (plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md)

**Prerequisites**: Plan y spec aprobados; rama `001-couple-mobile-app`

**Tests**: Obligatorios por constitución (Principio II) en lógica crítica: auth, pareja, eventos, fotos, deseos, metas, notificaciones.

**Organization**: Fases alineadas a historias de usuario (US1–US7) + infraestructura transversal.

## Cobertura de áreas solicitadas

| # | Área | Fase principal |
|---|------|----------------|
| 1 | Configuración inicial del proyecto | Phase 1 |
| 2 | Estructura de carpetas | Phase 1 |
| 3 | Autenticación Supabase | Phase 3 (US1) |
| 4 | Vinculación QR / código 6 dígitos | Phase 3 (US1) |
| 5 | Modelo PostgreSQL | Phase 2 |
| 6 | Row Level Security | Phase 2 |
| 7 | Pantalla Inicio | Phase 4 (US2) |
| 8 | Pantalla Calendario | Phase 5 (US3) |
| 9 | Agregar fechas especiales | Phase 5 (US3) |
| 10 | Agregar ubicaciones con mapa | Phase 5 (US3) |
| 11 | Subida y visualización de fotos | Phase 5 (US3) |
| 12 | Conteo de días juntos | Phase 6 (US4) |
| 13 | Lista de deseos | Phase 7 (US5) |
| 14 | Metas con barra de progreso | Phase 8 (US6) |
| 15 | Configuración cuenta y pareja | Phase 9 (US7) |
| 16 | Tema azul claro / rosa claro | Phase 2 + transversal |
| 17 | Notificaciones push | Phase 9 (US7) |
| 18 | Sincronización Realtime | Phase 2 + Phase 9 |
| 19 | Sugerencias IA | Phase 10 (Polish) |
| 20 | Pruebas básicas | Por fase + Phase 10 |
| 21 | Optimización imágenes y rendimiento | Phase 5 + Phase 10 |
| 22 | Preparación Android e iOS | Phase 1 + Phase 10 |

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Paralelizable (archivos distintos, sin dependencias pendientes)
- **[USn]**: Historia de usuario de spec.md
- **Verificación**: Cada tarea incluye criterio verificable al final cuando aplica

---

## Phase 1: Configuración inicial y estructura (Áreas 1, 2, 22)

**Purpose**: Proyecto Expo + TypeScript listo para desarrollo en Android e iOS.

**Verificación de fase**: `npx expo start` arranca; TypeScript compila sin errores; estructura `app/` y `src/` existe.

- [x] T001 Inicializar proyecto Expo con TypeScript en raíz (`package.json`, `app.json`, `tsconfig.json`) — verificar: `npx expo start` OK
- [x] T002 Instalar dependencias del plan en `package.json` (expo-router, supabase-js, react-query, zod, maps, image-picker, notifications) — verificar: `npm install` sin conflictos
- [x] T003 [P] Configurar ESLint y Prettier en `.eslintrc.cjs` y `.prettierrc` — verificar: `npm run lint` pasa
- [x] T004 [P] Crear `.env.example` con variables de `quickstart.md` en raíz — verificar: documentadas URL y anon key
- [x] T005 [P] Configurar `eas.json` y perfiles build development/preview/production — verificar: `eas build:configure` válido
- [x] T006 Crear estructura de carpetas `app/`, `src/components`, `src/hooks`, `src/services`, `src/repositories`, `src/types`, `src/utils`, `src/config`, `supabase/`, `tests/` — verificar: árbol coincide con `plan.md`
- [x] T007 Configurar Expo Router en `app/_layout.tsx` con grupos `(auth)` y `(tabs)` — verificar: navegación raíz renderiza
- [x] T008 [P] Añadir `app.config.ts` plugins para maps, notifications y FCM (`google-services.json`, `GoogleService-Info.plist` placeholders) — verificar: prebuild sin error en CI local

---

## Phase 2: Fundamentos — Base de datos, RLS, tema y núcleo (Áreas 5, 6, 16, 18 parcial)

**Purpose**: Backend Supabase y capa cliente base; bloquea todas las historias de usuario.

**⚠️ CRITICAL**: No iniciar pantallas de producto hasta completar checkpoint.

**Verificación de fase**: Migración aplica en Supabase; RLS impide lectura cross-couple; tema por defecto cargado en app.

- [x] T009 Inicializar Supabase CLI y carpeta `supabase/config.toml` — verificar: `supabase status` local o link remoto
- [x] T010 Crear migración `supabase/migrations/001_schema.sql` desde `contracts/schema.sql` — verificar: todas las tablas existen en Dashboard
- [x] T011 [P] Crear migración `supabase/migrations/002_rls_policies.sql` desde `contracts/rls-policies.md` — verificar: usuario A no lee datos de pareja B
- [x] T012 [P] Crear bucket Storage `couple-photos` y políticas en `supabase/migrations/003_storage.sql` — verificar: upload solo con path `{couple_id}/...`
- [x] T013 Crear `supabase/seed.sql` con temas por defecto y `romance_messages` (español) — verificar: ≥10 mensajes home y ≥20 frases calendario
- [x] T014 [P] Habilitar Realtime en tablas de `data-model.md` vía `supabase/migrations/004_realtime.sql` — verificar: publication incluye events, photos, wishes, goals, notifications
- [x] T015 Implementar cliente Supabase en `src/config/supabase.ts` con tipos generados — verificar: sesión persiste tras reinicio app
- [x] T016 [P] Definir tokens de tema en `src/config/theme.ts` (azul `#B3D9FF`, rosa `#FFB3D9`) — verificar: export de colores y espaciado responsive
- [x] T017 [P] Crear `src/types/database.ts` y esquemas zod en `src/types/schemas.ts` — verificar: tipos alineados a `data-model.md`
- [x] T018 Implementar `src/repositories/BaseRepository.ts` con `assertCoupleAccess(coupleId)` — verificar: test unitario lanza FORBIDDEN sin membresía
- [x] T019 [P] Crear `src/components/ui/` base (`Button`, `Input`, `ErrorBanner`, `LoadingOverlay`) — verificar: Storybook o pantalla demo interna
- [x] T020 Implementar `src/hooks/useCouple.ts` y `CoupleContext` en `src/config/CoupleProvider.tsx` — verificar: expone `coupleId` tras login
- [x] T021 Implementar `src/hooks/useRealtimeSync.ts` suscribiendo tablas por `couple_id` — verificar: invalidación React Query al INSERT remoto
- [x] T022 [P] Configurar React Query en `app/_layout.tsx` — verificar: queries cachean y revalidan

**Checkpoint**: Fundación lista — comenzar US1.

---

## Phase 3: User Story 1 — Cuenta y vinculación (Áreas 3, 4) 🎯 MVP

**Goal**: Registro, login y espacio de pareja de 2 miembros vía QR o código de 6 dígitos.

**Independent Test**: Dos cuentas se vinculan; tercer intento falla; cada usuario solo ve su pareja.

### Tests (US1)

- [x] T023 [P] [US1] Tests unitarios `AuthService` en `tests/unit/services/AuthService.test.ts` — verificar: signUp/signIn/signOut mockeados
- [x] T024 [P] [US1] Tests `PairingService` y límite 2 miembros en `tests/unit/services/PairingService.test.ts` — verificar: código expirado y pareja llena fallan
- [x] T025 [US1] Test integración RPC `join_couple_by_code` en `tests/integration/pairing.test.ts` — verificar: segundo usuario une; tercero recibe error

### Implementation (US1)

- [x] T026 [P] [US1] Implementar `src/repositories/AuthRepository.ts` — verificar: registro crea fila en `users`
- [x] T027 [P] [US1] Implementar `src/repositories/UserRepository.ts` — verificar: perfil actualizable
- [x] T028 [US1] Implementar `src/services/AuthService.ts` — verificar: mensajes de error claros en español
- [x] T029 [P] [US1] Implementar `src/repositories/PairingRepository.ts` y RPC join — verificar: código 6 dígitos único activo
- [x] T030 [US1] Implementar `src/services/PairingService.ts` (crear pareja, generar QR payload, expiración 24h) — verificar: QR escaneable contiene código
- [x] T031 [P] [US1] Pantallas `app/(auth)/login.tsx` y `register.tsx` — verificar: flujo completo en emulador
- [x] T032 [P] [US1] Pantallas `app/(auth)/pair-link.tsx` y `qr-scan.tsx` con `expo-camera` y `react-native-qrcode-svg` — verificar: B une a A por código y por QR
- [x] T033 [US1] Guard de rutas en `app/_layout.tsx` redirige a auth si sin sesión o sin pareja — verificar: usuario sin pareja va a pair-link

**Checkpoint**: MVP US1 — vinculación funcional.

---

## Phase 4: User Story 2 — Pantalla Inicio (Área 7)

**Goal**: Dashboard romántico con mensaje rotatorio, resumen y acceso a notificaciones.

**Independent Test**: Inicio muestra todos los bloques con datos de prueba; mensaje cambia tras 3 días simulados.

### Tests (US2)

- [x] T034 [P] [US2] Test utilidad rotación mensaje en `tests/unit/utils/homeMessage.test.ts` — verificar: lógica 3 días correcta

### Implementation (US2)

- [x] T035 [P] [US2] Implementar `src/repositories/CoupleRepository.ts` — verificar: lee/actualiza `couples` y `home_message_*`
- [x] T036 [US2] Implementar `src/services/HomeService.ts` (agregados próximo evento, recuerdo, contadores) — verificar: datos coherentes con tablas
- [x] T037 [P] [US2] Componentes `HeartPhoto`, `CountdownCard`, `HomeMessageCard` en `src/components/home/` — verificar: forma corazón y tipografía tema
- [x] T038 [US2] Hook `src/hooks/useHomeDashboard.ts` — verificar: caché offline último mensaje en AsyncStorage
- [x] T039 [US2] Pantalla `app/(tabs)/index.tsx` con campana y secciones spec FR-010 — verificar: checklist visual vs spec
- [x] T040 [P] [US2] Tab bar `app/(tabs)/_layout.tsx` con 6 tabs (Inicio, Calendario, Días, Deseos, Metas, Config) — verificar: navegación clara

---

## Phase 5: User Story 3 — Calendario, fechas, ubicaciones y fotos (Áreas 8–11, 21 parcial)

**Goal**: Calendario mensual, detalle de día, CRUD fechas/ubicaciones/fotos con mapa y progreso de carga.

**Independent Test**: Fecha marcada con corazón; detalle expandible con mapa; fotos suben con % visible.

### Tests (US3)

- [x] T041 [P] [US3] Tests validación `reminder_days` 1–15 en `tests/unit/schemas/eventSchema.test.ts` — verificar: rechaza 0 y 16
- [x] T042 [P] [US3] Tests `optimizeImage` en `tests/unit/utils/imageOptimize.test.ts` — verificar: reduce dimensiones bajo 1920px
- [x] T043 [US3] Test integración upload progreso en `tests/integration/photoUpload.test.ts` — verificar: callback % invocado

### Implementation (US3)

- [x] T044 [P] [US3] Implementar `src/repositories/EventRepository.ts` — verificar: listByMonth y CRUD
- [x] T045 [P] [US3] Implementar `src/repositories/LocationRepository.ts` — verificar: ligado a `event_id`
- [x] T046 [P] [US3] Implementar `src/repositories/PhotoRepository.ts` con signed URLs — verificar: path `{couple_id}/events/...`
- [x] T047 [US3] Implementar `src/utils/imageOptimize.ts` con `expo-image-manipulator` — verificar: archivo salida menor que original
- [x] T048 [US3] Implementar `src/services/PhotoUploadService.ts` con progreso % — verificar: UI no bloquea navegación
- [x] T049 [US3] Implementar `src/services/MapsService.ts` (geocode, nearby, place details) — verificar: pin en mapa tras selección
- [x] T050 [P] [US3] Componente `CoupleMap` en `src/components/maps/CoupleMap.tsx` — verificar: muestra ubicación de cita
- [x] T051 [P] [US3] Componente `PhotoGallery` paginado en `src/components/photos/PhotoGallery.tsx` — verificar: carga 20 ítems por página
- [x] T052 [US3] Componente `UploadProgressBar` en `src/components/photos/UploadProgressBar.tsx` — verificar: muestra porcentaje numérico
- [x] T053 [US3] Pantalla `app/(tabs)/calendario.tsx` con marcas corazón — verificar: días con eventos marcados
- [x] T054 [US3] Pantalla `app/calendar/day-detail.tsx` expandible (mapa, frase, fotos, contadores) — verificar: FR-012 cumplido
- [x] T055 [P] [US3] Pantalla `app/calendar/add-event.tsx` (título, color, ícono, recordatorio 1–15) — verificar: guardado en DB
- [x] T056 [P] [US3] Pantalla `app/calendar/add-location.tsx` (mapa, nombre, sugerencias cercanas) — verificar: `show_on_map` persiste
- [x] T057 [US3] Pantalla `app/calendar/add-photos.tsx` (cámara/galería, preview, ubicación opcional) — verificar: recuerdo asociado al día
- [x] T058 [US3] Hook `src/hooks/useEvents.ts` y `src/hooks/usePhotoUpload.ts` — verificar: Realtime actualiza calendario tras cambio pareja

---

## Phase 6: User Story 4 — Conteo de días e hitos (Área 12)

**Goal**: Días juntos, próximo evento y cuatro hitos con foto corazón.

**Independent Test**: Contador correcto desde `relationship_start_date`; hitos editables.

### Tests (US4)

- [x] T059 [P] [US4] Tests cálculo días juntos en `tests/unit/utils/daysTogether.test.ts` — verificar: bordes timezone

### Implementation (US4)

- [x] T060 [P] [US4] Implementar `src/repositories/MilestoneRepository.ts` — verificar: UNIQUE por `couple_id` + `type`
- [x] T061 [US4] Implementar `src/services/DaysTogetherService.ts` — verificar: número grande coincide con fecha inicio
- [x] T062 [P] [US4] Componente `MilestoneHeartCard` en `src/components/milestones/` — verificar: foto enmascarada corazón
- [x] T063 [US4] Pantalla `app/(tabs)/dias.tsx` — verificar: FR-018 completo

---

## Phase 7: User Story 5 — Lista de deseos (Área 13)

**Goal**: Deseos pendientes y cumplidos con sección verde sutil.

**Independent Test**: Marcar cumplido mueve ítem y corazón.

### Tests (US5)

- [x] T064 [P] [US5] Tests transición estado wish en `tests/unit/services/WishService.test.ts` — verificar: pending → fulfilled

### Implementation (US5)

- [x] T065 [P] [US5] Implementar `src/repositories/WishRepository.ts` — verificar: tipos place/purchase
- [x] T066 [US5] Implementar `src/services/WishService.ts` — verificar: notificación al compañero al crear
- [x] T067 [US5] Pantalla `app/(tabs)/deseos.tsx` con secciones activa/cumplida — verificar: título verde sutil en cumplidos

---

## Phase 8: User Story 6 — Metas con progreso (Área 14)

**Goal**: Metas con monto objetivo, ahorrado, % y barra.

**Independent Test**: Barra 50 % cuando ahorrado = mitad del objetivo; cap 100 %.

### Tests (US6)

- [x] T068 [P] [US6] Tests cálculo progreso en `tests/unit/services/GoalService.test.ts` — verificar: cap 100 % y excedente

### Implementation (US6)

- [x] T069 [P] [US6] Implementar `src/repositories/GoalRepository.ts` — verificar: montos numeric correctos
- [x] T070 [US6] Implementar `src/services/GoalService.ts` — verificar: porcentaje redondeado coherente
- [x] T071 [P] [US6] Componente `GoalProgressBar` en `src/components/goals/GoalProgressBar.tsx` — verificar: accesible y responsive
- [x] T072 [US6] Pantalla `app/(tabs)/metas.tsx` — verificar: FR-021

---

## Phase 9: User Story 7 — Configuración, push y sync (Áreas 15, 17, 18)

**Goal**: Perfil pareja, preferencias, notificaciones push y sincronización Realtime integrada.

**Independent Test**: Cambio de un miembro visible en otro <1 min; push recibido en background (dispositivo físico).

### Tests (US7)

- [x] T073 [P] [US7] Tests `NotificationService` en `tests/unit/services/NotificationService.test.ts` — verificar: respeta preferencias por tipo
- [x] T074 [US7] Test integración creación notificación en `tests/integration/notifications.test.ts` — verificar: solo destinatario pareja

### Implementation (US7)

- [x] T075 [P] [US7] Implementar `src/repositories/NotificationRepository.ts` — verificar: list y markRead
- [x] T076 [US7] Implementar `src/services/NotificationService.ts` (in-app + disparo push) — verificar: FR-023
- [x] T077 [US7] Configurar `expo-notifications` y tokens FCM en `src/services/PushService.ts` — verificar: `push_token` guardado en `users`
- [x] T078 [US7] Crear Edge Function `supabase/functions/send-push/index.ts` — verificar: invocada al INSERT en notifications
- [x] T079 [P] [US7] Implementar `src/repositories/ThemeRepository.ts` — verificar: cambio tema actualiza `couples.theme_id`
- [x] T080 [US7] Pantalla `app/(tabs)/config.tsx` (Nosotros, miembros, privacidad, tema, sync, logout) — verificar: FR-022
- [x] T081 [US7] Pantalla `app/notifications/index.tsx` enlazada desde campana Inicio — verificar: lista leído/no leído
- [x] T082 [US7] Integrar `useRealtimeSync` en hooks de deseos, metas, eventos y notificaciones — verificar: SC-004 latencia percibida
- [x] T083 [US7] Programar recordatorios locales de eventos (`reminder_days`) en `src/services/ReminderScheduler.ts` — verificar: notificación local N días antes

---

## Phase 10: Polish — IA, pruebas E2E, rendimiento y stores (Áreas 19–22)

**Purpose**: Capacidades transversales y preparación release.

**Verificación de fase**: Suite tests pasa; build EAS preview en ambas plataformas; IA y mapas con fallbacks.

### IA (Área 19)

- [x] T084 [P] Implementar `src/services/AiSuggestionService.ts` con adaptadores OpenAI y Gemini — verificar: selección por `AI_PROVIDER` env
- [x] T085 Integrar botón “Sugerir” en `app/calendar/add-event.tsx` y notas de recuerdo — verificar: texto editable antes de guardar; timeout con fallback catálogo

### Pruebas ampliadas (Área 20)

- [x] T086 [P] Configurar Jest en `jest.config.js` y scripts `npm test` — verificar: cobertura reportada
- [x] T087 Crear flujo E2E Maestro `tests/e2e/pairing.yaml` (registro + vinculación) — verificar: pasa en CI o local
- [x] T088 [P] Crear flujo E2E `tests/e2e/upload-photo.yaml` — verificar: progreso % visible
- [x] T089 Documentar checklist manual RLS en `tests/manual/rls-checklist.md` — verificar: casos cross-couple documentados

### Rendimiento (Área 21)

- [x] T090 Auditar listas: `FlatList` + `getItemLayout` donde aplique en galerías — verificar: scroll fluido con 100+ fotos mock
- [x] T091 [P] Memoizar componentes pesados (`HeartPhoto`, `PhotoGallery`) con `React.memo` — verificar: menos re-renders en Profiler
- [x] T092 Revisar tamaño bundle y lazy imports en pantallas secundarias — verificar: tiempo arranque aceptable

### Android e iOS (Área 22)

- [x] T093 [P] Configurar permisos cámara, ubicación y notificaciones en `app.json` (iOS `Info.plist`, Android manifest vía Expo) — verificar: prompts en dispositivo
- [x] T094 Generar build EAS preview iOS y Android — verificar: instalación en TestFlight / APK interno
- [x] T095 [P] Validar responsive en tablet y pantallas pequeñas con `useWindowDimensions` — verificar: sin overflow en Inicio y Calendario
- [x] T096 Actualizar `quickstart.md` con comandos finales verificados post-implementación — verificar: nuevo dev puede arrancar en <30 min

---

## Dependencies & Execution Order

### Phase Dependencies

```text
Phase 1 (Setup) → Phase 2 (Foundation) → US1 → US2–US7 (orden recomendado)
                                                      ↓
                                              Phase 10 (Polish)
```

- **US2** depende de US1 (pareja vinculada)
- **US3–US6** dependen de US1; US3 alimenta datos para US2/US4
- **US7** transversal; integrar Realtime al final de cada módulo de datos
- **Phase 10** después de US1–US7 funcionales

### User Story Order (MVP incremental)

1. **US1** 🎯 MVP — auth + pareja
2. **US2** — Inicio
3. **US3** — Calendario (mayor esfuerzo)
4. **US4** — Días juntos
5. **US5** — Deseos
6. **US6** — Metas
7. **US7** — Config + push + sync completo

### Parallel Opportunities

- Phase 1: T003, T004, T005, T008 en paralelo
- Phase 2: T011+T012, T016+T017+T019, T021+T022
- US1: T023+T024, T026+T027, T031+T032
- US3: T044+T045+T046, T050+T051, T055+T056
- Phase 10: T084+T086+T091+T093+T095

---

## Parallel Example: User Story 3

```bash
# Repos en paralelo:
T044 EventRepository | T045 LocationRepository | T046 PhotoRepository

# Pantallas modales en paralelo (tras servicios):
T055 add-event.tsx | T056 add-location.tsx
```

---

## Implementation Strategy

### MVP First (solo US1)

1. Completar Phase 1 + Phase 2
2. Completar Phase 3 (US1)
3. **VALIDAR**: dos usuarios vinculados; tercero rechazado
4. Demo antes de Inicio/Calendario

### Entrega incremental

1. Setup + Foundation → base lista
2. US1 → pareja funcional (MVP)
3. US2 → Inicio diario
4. US3 → calendario completo (fechas, mapa, fotos)
5. US4–US6 → valor emocional y planificación
6. US7 → notificaciones y sync producción
7. Phase 10 → IA, E2E, stores

---

## Summary

| Métrica | Valor |
|---------|-------|
| **Total tareas** | 96 |
| **Phase 1** | 8 |
| **Phase 2** | 14 |
| **US1** | 11 |
| **US2** | 7 |
| **US3** | 18 |
| **US4** | 5 |
| **US5** | 4 |
| **US6** | 5 |
| **US7** | 11 |
| **Phase 10** | 13 |
| **Con pruebas explícitas** | 18 tareas |
| **Paralelizables [P]** | 38 tareas |

**MVP sugerido**: Phase 1 + Phase 2 + Phase 3 (US1) = 33 tareas.

**Siguiente comando**: `/speckit.implement` para ejecutar tareas por fase.
