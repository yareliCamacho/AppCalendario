<!--
Sync Impact Report
- Version change: (template/unversioned) → 1.0.0
- Modified principles: N/A (initial adoption)
- Added sections: Core Principles (6), Restricciones de producto, Flujo de calidad, Governance
- Removed sections: Template placeholders
- Templates: plan-template.md ✅ | tasks-template.md ✅ | spec-template.md ✅ (no change needed) | checklist-template.md ✅ (no change needed)
- Deferred TODOs: none
-->

# Aplicación de Pareja — Constitución del Proyecto

## Core Principles

### I. Calidad del código

El código MUST ser claro, modular y mantenible. La arquitectura MUST separar
interfaz, lógica de negocio, servicios, almacenamiento y configuración. La
lógica MUST NOT duplicarse entre capas; los nombres MUST ser descriptivos. El
código muerto, valores hardcodeados y secretos en fuente MUST NOT permanecer en
el repositorio. Las decisiones arquitectónicas relevantes MUST documentarse.

**Rationale**: Una base limpia reduce defectos y acelera evolución de funciones
románticas compartidas (eventos, fotos, metas, deseos) sin deuda técnica oculta.

### II. Pruebas automatizadas (NON-NEGOTIABLE)

Toda lógica crítica MUST tener pruebas automatizadas antes de considerarse
terminada. Las pruebas MUST cubrir flujos exitosos, errores y casos límite.
Dominios obligatorios: autenticación, vinculación de pareja, eventos, fotos,
metas, deseos y notificaciones. Ninguna funcionalidad MUST marcarse como
completa sin validación mínima demostrable.

**Rationale**: Los datos íntimos de la pareja exigen confianza; las regresiones
en vinculación o permisos son inaceptables sin red de seguridad automatizada.

### III. Experiencia de usuario consistente

La interfaz MUST ser romántica, limpia, moderna y coherente en toda la app. El
tema principal MUST usar azul claro y rosa claro. La navegación MUST exponer de
forma clara: Inicio, Calendario, Conteo de días, Lista de deseos, Metas y
Configuración. Errores y confirmaciones MUST mostrarse con mensajes claros y
accionables para el usuario.

**Rationale**: La app es un espacio emocional; la inconsistencia visual o de
flujo rompe la confianza y el uso diario entre la pareja.

### IV. Rendimiento perceptible

La carga de fotos MUST optimizarse con carga progresiva y paginación. La UI MUST
NOT bloquearse durante sincronización o subida de imágenes; MUST mostrarse
progreso visible. Operaciones largas MUST ejecutarse fuera del hilo principal de
interacción cuando la plataforma lo permita.

**Rationale**: Álbumes y recuerdos son el núcleo del producto; retrasos sin
feedback frustran el ritual de compartir momentos.

### V. Seguridad y privacidad de la pareja

El espacio compartido MUST limitarse a exactamente dos miembros vinculados. Los
datos privados MUST ser visibles únicamente para esa pareja. Secretos, claves y
tokens MUST NOT almacenarse en el código fuente; MUST usarse configuración
segura por entorno. Toda lectura o modificación de datos MUST validar permisos
antes de ejecutarse.

**Rationale**: La promesa del producto es intimidad bilateral; cualquier fuga o
acceso de terceros destruye el valor central de la aplicación.

### VI. Mantenibilidad y evolución incremental

Los componentes MUST ser reutilizables cuando el patrón se repita en dos o más
pantallas. Las decisiones técnicas importantes MUST documentarse junto al
cambio. Los cambios MUST ser pequeños, revisables y reversibles; evitar
refactors masivos no solicitados en el mismo entregable que una feature.

**Rationale**: Equipos pequeños y releases frecuentes requieren diffs acotados
y componentes compartidos para sostener seis áreas de navegación sin divergencia.

## Restricciones de producto

- **Plataforma**: aplicación móvil para pareja; backend/API solo si el plan lo
  define, siempre alineado a los principios V y VI.
- **Membresía**: máximo dos usuarios por espacio compartido; rechazar o impedir
  invitaciones adicionales en reglas de negocio y en API.
- **Paleta y tono**: azul claro + rosa claro como colores primarios; tipografía
  legible; iconografía y copy coherentes con tono romántico pero no infantil.
- **Áreas funcionales mínimas**: Inicio, Calendario, Conteo de días, Lista de
  deseos, Metas, Configuración — nuevas rutas MUST justificarse en plan y spec.
- **Configuración**: valores de entorno y feature flags MUST vivir fuera del
  código; sin literales mágicos para URLs, límites o claves.

## Flujo de calidad y cumplimiento

Antes de cerrar una feature, el responsable MUST verificar:

1. **Constitution Check** en `plan.md`: sin violaciones sin justificación en la
   tabla de Complexity Tracking.
2. **Pruebas**: suites relevantes ejecutadas; cobertura de dominios del
   principio II cuando la feature los toque.
3. **UX**: revisión de consistencia visual (colores, navegación, mensajes).
4. **Rendimiento**: flujos con fotos/sync probados con indicador de progreso.
5. **Seguridad**: revisión de permisos y ausencia de secretos en diff.
6. **Documentación**: decisiones no obvias registradas en spec, plan o ADR breve.

Las especificaciones (`spec.md`) y tareas (`tasks.md`) MUST referenciar criterios
medibles alineados a estos principios. El agente y desarrolladores MUST leer
esta constitución antes de `/speckit.plan`, `/speckit.tasks` e `/speckit.implement`.

## Governance

Esta constitución supersede prácticas ad hoc y guías contradictorias en el repo.
Las enmiendas MUST documentar: motivo, principios afectados, impacto en
plantillas bajo `.specify/templates/`, y bump de versión semántica:

- **MAJOR**: eliminación o redefinición incompatible de un principio.
- **MINOR**: nuevo principio o expansión material de reglas.
- **PATCH**: aclaraciones, redacción, correcciones sin cambio de obligación.

Todo PR o revisión de feature MUST incluir explícitamente el cumplimiento de los
principios I–VI. La complejidad adicional (capas, librerías, patrones) MUST
justificarse en Complexity Tracking cuando contradiga simplicidad o mantenibilidad.

Para contexto de ejecución diaria, consultar el plan activo en `specs/` y
`AGENTS.md` / reglas del IDE cuando existan.

**Version**: 1.0.0 | **Ratified**: 2026-05-22 | **Last Amended**: 2026-05-22
