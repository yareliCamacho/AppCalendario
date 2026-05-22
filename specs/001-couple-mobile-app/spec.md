# Feature Specification: Aplicación móvil para parejas

**Feature Branch**: `001-couple-mobile-app`

**Created**: 2026-05-22

**Status**: Draft

**Input**: User description: Crear una aplicación móvil para parejas que permita crear una cuenta, vincularse con la pareja mediante código QR o código de 6 dígitos, compartir recuerdos, fechas especiales, fotos, lugares visitados, lista de deseos, metas y notificaciones. Pantallas: Inicio, Calendario, Conteo de días, Lista de deseos, Metas, Configuración. Reglas: máximo dos miembros, vínculo por QR o código de 6 dígitos, recuerdos por fecha, fotos asociables a fechas y ubicaciones, app privada, romántica, moderna, rápida y fácil de usar.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cuenta y vinculación de pareja (Priority: P1)

Como persona en una relación, quiero crear mi cuenta e invitar o unirme a mi pareja mediante QR o un código de 6 dígitos, para tener un espacio privado compartido solo entre nosotros dos.

**Why this priority**: Sin cuenta y vínculo no existe el producto; todas las demás funciones dependen del espacio de pareja de dos miembros.

**Independent Test**: Dos usuarios de prueba completan registro, uno genera código/QR y el otro se une; ambos ven el mismo espacio y un tercer intento de unirse es rechazado.

**Acceptance Scenarios**:

1. **Given** un usuario sin cuenta, **When** completa registro con datos válidos, **Then** obtiene acceso a la app y puede crear o unirse a un espacio de pareja.
2. **Given** un usuario con espacio vacío (solo él), **When** genera código de 6 dígitos o QR de invitación, **Then** la pareja puede escanear o ingresar el código para vincularse.
3. **Given** un espacio ya con dos miembros vinculados, **When** un tercer usuario intenta unirse con cualquier código, **Then** el sistema rechaza la vinculación con mensaje claro.
4. **Given** dos miembros vinculados, **When** cualquiera inicia sesión, **Then** solo ve datos del espacio compartido de esa pareja.

---

### User Story 2 - Pantalla Inicio (Priority: P2)

Como miembro de la pareja, quiero ver en Inicio un resumen romántico de nuestra relación (mensaje, foto principal, próximos eventos, recuerdos y metas), para sentir conexión al abrir la app.

**Why this priority**: Es la pantalla principal de uso diario y agrega valor inmediato tras el vínculo.

**Independent Test**: Con pareja vinculada y datos de ejemplo cargados, Inicio muestra todos los bloques definidos y el mensaje bonito rota según regla de 3 días.

**Acceptance Scenarios**:

1. **Given** pareja vinculada con datos existentes, **When** el usuario abre Inicio, **Then** ve mensaje bonito, foto principal en forma de corazón, campana de notificaciones, próxima fecha especial, cuenta regresiva, recuerdo reciente (foto, texto romántico, contador pequeño de días juntos), momentos vividos, lugares visitados y metas registradas.
2. **Given** un mensaje bonito asignado hace menos de 3 días, **When** el usuario abre Inicio, **Then** ve el mismo mensaje hasta cumplirse el período de 3 días.
3. **Given** han pasado 3 días desde el último cambio de mensaje, **When** el usuario abre Inicio, **Then** ve un mensaje bonito diferente del conjunto disponible.
4. **Given** el usuario toca la campana, **When** hay notificaciones pendientes, **Then** accede a la lista o detalle de notificaciones.

---

### User Story 3 - Calendario, recuerdos, fechas, ubicaciones y fotos (Priority: P3)

Como pareja, quiero un calendario mensual con nuestras fechas y recuerdos marcados, y poder agregar fechas, ubicaciones y fotos al día seleccionado, para revivir citas y momentos con contexto visual.

**Why this priority**: El calendario es el núcleo de memoria compartida (fechas, mapa, fotos, frases).

**Independent Test**: Usuario marca fechas en calendario, expande detalle de un día con mapa y fotos, y completa flujos Agregar fecha, Agregar ubicación y Agregar fotos con progreso de carga visible.

**Acceptance Scenarios**:

1. **Given** un mes con fechas que tienen recuerdos o citas, **When** el usuario ve Calendario, **Then** esas fechas aparecen marcadas con un corazón.
2. **Given** una fecha marcada, **When** el usuario la selecciona, **Then** ve mapa con sitio de la cita, fecha, frase aleatoria de amor, fotos del día, cantidad de fotos y lugares; la sección puede expandirse o contraerse.
3. **Given** un día seleccionado, **When** el usuario agrega una fecha con día, título, descripción opcional, sugerencia de asistente, color, ícono y recordatorio entre 1 y 15 días, **Then** la fecha se guarda y aparece en el calendario.
4. **Given** un día seleccionado, **When** el usuario agrega ubicación (mapa o nombre), descripción opcional, opción mostrar en mapa y sugerencias de lugares cercanos, **Then** la ubicación se guarda y puede mostrarse en el detalle del día.
5. **Given** un día seleccionado, **When** el usuario toma o sube fotos, **Then** ve fotos seleccionadas, progreso de carga con porcentaje, puede asignar ubicación y guardar el recuerdo del día.
6. **Given** una subida de varias fotos, **When** la carga está en curso, **Then** la interfaz permanece usable y muestra porcentaje hasta completar o fallar con mensaje claro.

---

### User Story 4 - Conteo de días e hitos (Priority: P4)

Como pareja, quiero ver cuántos días llevamos juntos y nuestros hitos importantes con fotos en forma de corazón, para celebrar nuestra historia.

**Why this priority**: Refuerza el valor emocional diario y complementa Inicio y Calendario.

**Independent Test**: Con fecha de inicio de relación configurada e hitos definidos, la pantalla muestra contador grande, próximo evento y cuatro tipos de hito con datos completos.

**Acceptance Scenarios**:

1. **Given** fecha de inicio de relación registrada, **When** el usuario abre Conteo de días, **Then** ve número grande de días juntos y texto “días juntos” con corazón rosa.
2. **Given** eventos futuros en el espacio, **When** el usuario abre Conteo de días, **Then** ve el próximo evento destacado.
3. **Given** hitos configurados (primer encuentro, primera cita, primer viaje, último viaje), **When** el usuario revisa la sección de hitos, **Then** cada hito muestra título, fecha, descripción y foto en forma de corazón.

---

### User Story 5 - Lista de deseos (Priority: P5)

Como pareja, quiero registrar lugares por visitar y cosas por comprar, y marcar deseos cumplidos, para planear juntos y celebrar logros.

**Why this priority**: Funcionalidad de planificación compartida independiente del calendario.

**Independent Test**: Usuario crea deseos activos y cumplidos; los cumplidos aparecen en sección separada con corazón y título en verde sutil.

**Acceptance Scenarios**:

1. **Given** usuario en Lista de deseos, **When** agrega un deseo (lugar o compra) con título, descripción, foto y estado pendiente, **Then** aparece en la lista activa.
2. **Given** un deseo pendiente, **When** la pareja lo marca como cumplido, **Then** muestra corazón y se mueve a la sección de cumplidos con título en verde sutil.
3. **Given** deseos en ambas secciones, **When** el usuario navega la lista, **Then** distingue claramente pendientes vs cumplidos.

---

### User Story 6 - Metas de vida en pareja (Priority: P6)

Como pareja, quiero registrar metas (casa, mudanza, coche, ahorro) con montos y progreso visual, para mejorar nuestra calidad de vida de forma transparente.

**Why this priority**: Aporta valor de planificación financiera/vida sin bloquear el MVP emocional.

**Independent Test**: Usuario crea meta con monto objetivo y ahorrado; la barra y porcentaje reflejan el avance correctamente.

**Acceptance Scenarios**:

1. **Given** usuario en Metas, **When** registra una meta con título, descripción, monto objetivo y monto ahorrado, **Then** el sistema calcula y muestra porcentaje y barra de progreso.
2. **Given** una meta existente, **When** actualiza el monto ahorrado, **Then** porcentaje y barra se actualizan sin superar visualmente el 100 % hasta alcanzar el objetivo.
3. **Given** plantillas implícitas (comprar casa, mudarse, comprar coche, ahorrar), **When** el usuario crea meta, **Then** puede usar títulos alineados a esos tipos sin restricción de categoría fija.

---

### User Story 7 - Configuración, privacidad y sincronización (Priority: P7)

Como miembro de la pareja, quiero gestionar perfil del espacio, notificaciones, privacidad, tema y sincronización, y recibir avisos cuando mi pareja agrega contenido.

**Why this priority**: Cierra el ciclo operativo (sync + notificaciones) y cumple reglas de privacidad de la constitución.

**Independent Test**: Un miembro agrega recuerdo/fecha/foto/ubicación/deseo/meta; el otro recibe notificación; Configuración muestra ambos miembros y opciones de cierre de sesión.

**Acceptance Scenarios**:

1. **Given** pareja vinculada, **When** el usuario abre Configuración, **Then** ve foto de la pareja, frase “Nosotros”, miembros del espacio (exactamente dos), notificaciones, privacidad y seguridad, tema visual, sincronización de datos y cierre de sesión.
2. **Given** un miembro agrega recuerdo, fecha, foto, ubicación, deseo o meta, **When** la sincronización completa, **Then** el otro miembro recibe una notificación identificable del tipo de contenido.
3. **Given** usuario autenticado, **When** cierra sesión, **Then** debe volver a autenticarse para acceder a datos del espacio.
4. **Given** preferencias de notificación desactivadas para un tipo, **When** ocurre un evento de ese tipo, **Then** no se envía notificación push/in-app de ese tipo (los datos siguen sincronizándose).

---

### Edge Cases

- Código de vinculación o QR expirado o ya usado: mensaje claro y opción de generar uno nuevo.
- Intento de vincular dos espacios distintos con la misma cuenta: impedir o exigir desvinculación previa con confirmación.
- Subida de foto interrumpida (sin red, app en segundo plano): reanudar o permitir reintentar sin duplicar recuerdos.
- Día sin fotos ni ubicación: calendario muestra fecha sin detalle expandido o mensaje amable de “sin recuerdos aún”.
- Monto ahorrado mayor que objetivo en metas: mostrar 100 % y opcionalmente excedente sin romper la barra.
- Recordatorio de fecha con 1–15 días: no permitir valores fuera de ese rango.
- Pareja con un solo miembro tras abandono del otro: flujo de recuperación o disolución del espacio (ver Assumptions).
- Mensaje bonito en Inicio: si no hay conectividad, mostrar último mensaje en caché.
- Tercer dispositivo con misma cuenta: sesiones múltiples permitidas; límite de miembros aplica al espacio, no al dispositivo.

## Requirements *(mandatory)*

### Functional Requirements

**Cuenta y espacio de pareja**

- **FR-001**: El sistema MUST permitir crear cuenta con identificador único (correo electrónico) y credenciales seguras.
- **FR-002**: El sistema MUST permitir iniciar y cerrar sesión de forma segura.
- **FR-003**: El sistema MUST limitar cada espacio de pareja a exactamente dos miembros vinculados.
- **FR-004**: El sistema MUST permitir vincular pareja mediante código QR o código numérico de 6 dígitos generado por un miembro.
- **FR-005**: El sistema MUST rechazar vinculaciones cuando el espacio ya tiene dos miembros o el código no es válido.

**Navegación y experiencia global**

- **FR-006**: La aplicación MUST ofrecer navegación principal persistente a Inicio, Calendario, Conteo de días, Lista de deseos, Metas y Configuración.
- **FR-007**: La interfaz MUST mantener estética romántica, moderna y coherente con paleta azul claro y rosa claro en todas las pantallas.
- **FR-008**: El sistema MUST mostrar mensajes claros en errores y confirmaciones de acciones importantes.

**Inicio**

- **FR-009**: Inicio MUST mostrar mensaje bonito que rota cada 3 días calendario.
- **FR-010**: Inicio MUST mostrar foto principal en forma de corazón, acceso a notificaciones, próxima fecha especial, cuenta regresiva, recuerdo reciente (foto destacada, texto romántico, contador pequeño de días juntos), momentos vividos, lugares visitados y metas registradas.

**Calendario y recuerdos**

- **FR-011**: Calendario MUST mostrar vista mensual con fechas con recuerdos o citas marcadas con corazón.
- **FR-012**: Al seleccionar fecha marcada, el sistema MUST mostrar mapa del sitio, fecha, frase aleatoria de amor, fotos del día, cantidad de fotos y lugares, con sección expandible/contraíble.
- **FR-013**: El sistema MUST permitir agregar fecha con día, título, descripción opcional, sugerencia de asistente, color, ícono, recordatorio de 1 a 15 días y persistencia.
- **FR-014**: El sistema MUST permitir agregar ubicación por mapa o nombre, descripción opcional, opción mostrar en mapa, sugerencias de lugares cercanos y guardado.
- **FR-015**: El sistema MUST permitir tomar o subir fotos, previsualizar selección, mostrar progreso de carga en porcentaje, asignar ubicación y guardar recuerdo asociado al día seleccionado.
- **FR-016**: Los recuerdos MUST pertenecer a una fecha específica del calendario.
- **FR-017**: Las fotos MUST poder asociarse a fechas y ubicaciones.

**Conteo de días**

- **FR-018**: Conteo de días MUST mostrar número grande de días juntos, etiqueta “días juntos” con corazón rosa, próximo evento y hitos: primer encuentro, primera cita, primer viaje, último viaje (cada uno con título, fecha, descripción y foto en corazón).

**Lista de deseos**

- **FR-019**: El sistema MUST permitir deseos de tipo lugar por visitar o cosa por comprar con título, descripción, foto y estado.
- **FR-020**: Los deseos cumplidos MUST marcarse con corazón y listarse en sección separada con estilo de título verde sutil.

**Metas**

- **FR-021**: El sistema MUST permitir metas con título, descripción, monto objetivo, monto ahorrado, porcentaje calculado y barra de progreso.

**Configuración y sincronización**

- **FR-022**: Configuración MUST mostrar foto de pareja, “Nosotros”, miembros del espacio, notificaciones, privacidad y seguridad, tema visual, sincronización y cierre de sesión.
- **FR-023**: Cuando un miembro agrega recuerdo, fecha, foto, ubicación, deseo o meta, el sistema MUST sincronizar al otro miembro y generar notificación.
- **FR-024**: Los datos del espacio MUST ser visibles únicamente para los dos miembros vinculados.
- **FR-025**: Toda lectura o modificación de datos del espacio MUST validar que el usuario pertenece al espacio antes de ejecutarse.

**Rendimiento y privacidad (alineado a constitución)**

- **FR-026**: La carga de fotos MUST usar indicador de progreso porcentual y MUST NOT bloquear la navegación principal durante la subida.
- **FR-027**: Listas largas de fotos o recuerdos MUST cargarse de forma progresiva o paginada para mantener fluidez.

### Key Entities

- **Usuario**: Persona con cuenta; puede pertenecer a un espacio de pareja.
- **Espacio de pareja**: Contenedor privado compartido; máximo dos miembros; foto y frase “Nosotros”.
- **Código de vinculación**: QR o código de 6 dígitos temporal para unir la segunda persona.
- **Recuerdo**: Memoria asociada a una fecha; puede incluir texto romántico, fotos y ubicaciones.
- **Fecha especial / Cita**: Evento en calendario con título, descripción, color, ícono, recordatorio (1–15 días).
- **Ubicación**: Lugar con nombre o coordenadas, descripción, flag mostrar en mapa; ligable a fecha/recuerdo.
- **Foto**: Imagen con progreso de carga, asociación a fecha y opcionalmente ubicación.
- **Hito**: Tipo fijo (primer encuentro, primera cita, primer viaje, último viaje) con título, fecha, descripción, foto.
- **Deseo**: Ítem de lista (lugar o compra) con estado pendiente o cumplido.
- **Meta**: Objetivo de pareja con montos y progreso calculado.
- **Notificación**: Aviso al compañero por alta o cambio de contenido sincronizado.
- **Preferencias**: Notificaciones, privacidad, tema visual, sincronización.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Dos usuarios pueden registrarse, vincularse por QR o código de 6 dígitos y ver el espacio compartido en menos de 5 minutos cada uno (primer uso).
- **SC-002**: El 100 % de intentos de unir un tercer miembro al mismo espacio son rechazados con mensaje comprensible.
- **SC-003**: Al agregar una fecha con fotos, el usuario ve progreso de carga con porcentaje y puede seguir navegando sin bloqueo perceptible (>95 % de pruebas de usabilidad internas).
- **SC-004**: Tras un miembro agregar contenido sincronizable, el otro recibe notificación en menos de 1 minuto con conectividad normal.
- **SC-005**: El 90 % de usuarios de prueba encuentran las seis pantallas principales sin ayuda en la primera sesión.
- **SC-006**: Inicio muestra rotación de mensaje bonito verificable cada 3 días en pruebas controladas.
- **SC-007**: Metas muestran porcentaje y barra coherentes con monto ahorrado/objetivo en el 100 % de casos de prueba definidos.

## Assumptions

- Registro e inicio de sesión con correo electrónico y contraseña; recuperación de contraseña está en alcance del producto base.
- La app apunta a dispositivos móviles (iOS y Android); detalles de tiendas y permisos de cámara/ubicación se definen en planificación técnica.
- Los códigos QR y de 6 dígitos expiran tras 24 horas si no se usan; un código válido solo puede consumirse una vez para unir la pareja.
- “Sugerencia de IA” en fechas es texto de ayuda opcional generado por asistente; el usuario puede editar o ignorar sin bloquear el guardado.
- Frases aleatorias de amor y mensajes bonitos provienen de un catálogo curado en idioma del usuario (español por defecto).
- La fecha de inicio de relación para “días juntos” se establece al vincular o en Configuración si no se infiere de hitos.
- Si un miembro abandona el espacio, el producto v1 ofrece disolver vínculo y datos tras confirmación explícita del miembro restante (sin transferencia a terceros).
- Sincronización requiere conectividad intermitente; datos se muestran desde última sincronización cuando no hay red, con indicador de estado en Configuración.
- Lugares cercanos y mapas dependen de servicio de mapas externo; fallos muestran mensaje y permiten guardar solo por nombre de lugar.
- Notificaciones respetan preferencias por tipo en Configuración; la sincronización de datos no depende de que las notificaciones estén activas.
