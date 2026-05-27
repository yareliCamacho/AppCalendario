# EAS Build — Android e iOS

Requisito previo: **Supabase remoto configurado** (`docs/SUPABASE-REMOTO.md`) y `frontend/.env` funcionando con `npx expo start` desde `frontend/`.

## 1. Cuenta Expo

```powershell
npm install -g eas-cli
eas login
```

## 2. Vincular proyecto Expo

Desde la carpeta del frontend:

```powershell
cd frontend
eas init
```

- Confirma crear proyecto Expo si no existe  
- Se añadirá `extra.eas.projectId` en `frontend/app.config.ts` / `frontend/app.json`

## 3. Secretos EAS (variables de entorno en la nube)

No subas `.env` al repositorio. Configura secretos para builds:

```powershell
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://TU_PROYECTO.supabase.co" --type string
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "TU_ANON_KEY" --type string
```

> No se requiere clave de Google Maps. Mapas y búsqueda usan OpenStreetMap (gratis). Ver [MAPAS-GRATIS.md](MAPAS-GRATIS.md).

Listar:

```powershell
eas secret:list
```

Opcional (IA en build si la usas en runtime con EAS Update):

```powershell
eas secret:create --name OPENAI_API_KEY --value "sk-..." --type string
```

## 4. Perfiles de build (`eas.json`)

| Perfil | Uso |
|--------|-----|
| `development` | Dev client, pruebas internas con depuración |
| `preview` | APK/IPA interno para testers (recomendado primero) |
| `production` | Tiendas App Store / Play Store |

## 5. Build preview (recomendado para probar en teléfono)

Ejecuta los comandos `eas` desde `frontend/` (donde están `eas.json` y `app.config.ts`).

### Android (APK interno)

```powershell
cd frontend
eas build --platform android --profile preview
```

Al terminar, descarga el APK desde el enlace de Expo y instálalo en el dispositivo (habilita “orígenes desconocidos”).

### iOS (requiere Apple Developer)

```powershell
eas build --platform ios --profile preview
```

Necesitas cuenta Apple Developer para instalar en dispositivo físico vía TestFlight o registro UDID (internal distribution).

### Ambas plataformas

```powershell
eas build --platform all --profile preview
```

## 6. Build producción

```powershell
eas build --platform android --profile production
eas build --platform ios --profile production
```

Android genera **AAB** para Google Play. iOS genera archivo para **App Store Connect**.

## 7. Mapas en builds nativos (gratis)

Los mapas usan **OpenStreetMap** en la app. No configures secretos de Google.

Ver [MAPAS-GRATIS.md](MAPAS-GRATIS.md).

## 8. Push notifications (FCM / APNs)

### Android

1. Proyecto Firebase → añade app Android con package `com.coupleapp.nosotros`
2. Descarga `google-services.json`
3. Sube credenciales FCM a EAS:

```powershell
eas credentials -p android
```

4. Coloca `google-services.json` en la raíz (no commitear si es sensible; usar EAS credentials)

### iOS

1. Firebase o APNs directo en Apple Developer  
2. `GoogleService-Info.plist` si usas FCM  
3. `eas credentials -p ios`

Expo documentación: [Push notifications setup](https://docs.expo.dev/push-notifications/overview/)

## 9. Submit a tiendas (opcional)

Tras build production:

```powershell
eas submit --platform android --profile production
eas submit --platform ios --profile production
```

## 10. Checklist EAS

- [ ] `eas login`  
- [ ] `eas init` (projectId en app)  
- [ ] Secretos Supabase en EAS  
- [ ] `eas build --profile preview` Android OK  
- [ ] App instalada: login + pareja + calendario  
- [ ] (Opcional) iOS preview / production  

## Comandos útiles

```powershell
eas build:list
eas build:view
eas build:cancel
npx expo start
```

## Orden recomendado

1. ✅ Supabase remoto  
2. ✅ `npx expo start` con `.env`  
3. ✅ `eas init` + secretos  
4. ✅ `eas build -p android --profile preview`  
5. Probar en 2 dispositivos  
6. iOS / production cuando Android esté validado
