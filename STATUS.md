# STATUS — chasqui

**Última actualización:** 2026-10-04
**Estado general:** Campaña completa de 5 niveles (4 suyos + Cusco) + modo infinito, jugable en navegador. No empaquetado. Sin probar en dispositivo real.

## Features
| Spec | Estado | Notas |
|---|---|---|
| [001-gameplay-base](specs/001-gameplay-base/spec.md) | Implementada (retro-documentada) | Verificada en Chromium headless con viewport móvil |
| [002-empaquetado-android](specs/002-empaquetado-android/spec.md) | Borrador | Script `preparar_entorno.ps1` listo; falta ejecutarlo en Windows |
| [003-arte-final](specs/003-arte-final/spec.md) | Borrador (plantilla vacía) | Definir estilo y origen del arte |
| [004-campania-niveles](specs/004-campania-niveles/spec.md) | Implementada (iteración 2) | 5 niveles por suyos; balance sin validar |
| [005-musica-y-ui-movil](specs/005-musica-y-ui-movil/spec.md) | Implementada | Música procedural, nombre comercial, área segura, vidas compactas |

## Próximos pasos (priorizados)
1. **Prueba en dispositivo real** (usuario): control táctil y dificultad de los 5 niveles.
2. Dividir `game.js` (~900 líneas) en módulos antes de crecer más (ADR nuevo).
3. Spec 003 — Arte: reemplazar sprites procedurales por arte final (riesgo principal para Play Store).
4. Verificar en Android real que el WebView reporte `safe-area-inset` (spec 002).
5. Ejecutar spec 002 (Capacitor) y generar AAB firmado.
6. Ícono, splash, capturas, política de privacidad, ficha de Play.

## Bloqueos / pendientes del usuario
- Cuenta de Google Play Console (pago único). ❓ Verificar requisito vigente de prueba cerrada para cuentas personales nuevas.
- Decidir origen del arte (ilustrador vs. IA + retoque).
- Registro de software en SENADI (opcional, da fecha cierta de autoría).
- Crear repo privado en GitHub y conectar el remoto (respaldo).

## Riesgos conocidos
- Arte procedural insuficiente para competir en la tienda; posible rechazo por "funcionalidad mínima" si no se diferencia.
- Balance no validado con jugadores reales.
- Datos históricos sin revisión de fuentes.
- Balance de los niveles calibrado a ojo: posibles picos de dificultad (pumas/jaguares + ríos en nivel 3).
- `game.js` ~900 líneas: mantenimiento cada vez más costoso.
- Niveles de 1000–1500 m (~45–60 s): duración no validada con jugadores.

## Bitácora de sesiones
- 2026-10-04 — Diagnóstico en Windows del usuario: Node v25 (OK, no LTS), JDK 21 vía SDKMAN (OK), Android Studio y SDK: FALTAN, Capacitor no instalado. Pendiente: AppId definitivo.
- 2026-10-04 — `preparar_entorno.ps1` (diagnóstico Node/JDK/Android Studio/SDK, winget, `npx cap doctor`). Requisitos corregidos a Capacitor 8: Node 22+, JDK 21, Android Studio 2025.2.1+. Sintaxis validada con PowerShell 7 (Linux); no ejecutado en Windows.
- 2026-10-04 — LICENSE propietaria (ley Ecuador / Código Ingenios). Repositorio git inicializado en la raíz; commit inicial v1.0.0.
- 2026-10-04 — v1.0.0: firma de autoría (cabecera © en JS/CSS, meta author/copyright, `CH.META`, créditos en el menú). Smoke 39/39.
- 2026-10-04 — Spec 005: nombre «Chasqui: El Mensajero Inca», música andina procedural, contraste de jaguar/puma/serpientes, área segura con env(), vidas ❤ ×N. Smoke 38/38.
- 2026-10-04 — Ajuste visual (sin spec, cambio de arte menor): sombras de contacto en coleccionables y serpiente; quipus, plantas y poderes con halo y colores saturados; río azul vivo con espuma animada. Smoke 33/33.
- 2026-10-04 — Campaña reorganizada por suyos: Norte (Chinchaysuyu), Selva (Antisuyu), Sur (Contisuyu), Altiplano (Collasuyu), Cusco. Derrumbes, abismos anchos, nieve, el Inca como receptor final. Progreso reiniciado (`levels.v2`). Smoke 33/33.
- 2026-10-04 — Spec 004 R6–R8: dificultad en escalones de 200 m, mensaje del Inca al completar nivel, nivel máximo persistido. Smoke 26/26. 
- 2026-10-04 — Nombres simplificados a kichwa corto (aldeas Pakari/Illari/Sumak/Tamya; Taita Atuk, Mama Sisa, Taita Waman). Smoke 23/23.
- 2026-10-04 — Spec 004 iteración 1: campaña de 3 niveles (entregar, recolectar, contrarreloj), fauna por región (puma, zorro, jaguar, serpientes, caimán), aldeas, ríos, andenes; modo infinito como extra. Smoke test 23/23. Panel `index.html` + artefacto Taller de Proyectos.
- 2026-10-04 — Estructura SDD creada en la raíz; spec 001 retro-documentada; ADR-001..003; smoke test en `tests/`.
- 2026-10-04 — Implementado Chasqui v0.1: 4 personajes, vidas/inmunidad, 4 poderes, 4 tramos con relevo, desbloqueos. Reemplaza al prototipo `dodge-game`.
