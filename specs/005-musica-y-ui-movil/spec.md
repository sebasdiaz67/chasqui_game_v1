# Spec 005 — Música procedural, nuevo nombre y UI móvil

**Estado:** Implementada · **Fecha:** 2026-10-04 · **Proyecto:** chasqui

## Contexto y problema
El juego no tiene música, el nombre comercial cambia y la interfaz debe respetar notches y barras de estado en Android.

## Requisitos
### R1 — Nombre comercial
- El título del juego es **«Chasqui: El Mensajero Inca»** (`<title>`, menú principal, README). Los IDs y clases que usan las pruebas no cambian.

### R2 — Música de fondo procedural
- EL SISTEMA DEBE generar con Web Audio una música en bucle: melodía en pentatónica menor con timbre de quena (oscilador triangular, vibrato y filtro paso bajo variable), bordón grave y bombo en el pulso, con ritmo de huayno (larga-corta-corta). Sin archivos externos.
- La frase se regenera periódicamente para que no sea idéntica siempre.
- API pública: `CH.Sfx.playBGM()`, `stopBGM()`, `toggleMute()`.
- CUANDO el usuario toca un botón por primera vez EL SISTEMA DEBE iniciar la música (nunca antes: política de autoplay).
- CUANDO la app pasa a segundo plano EL SISTEMA DEBE detener la música. CUANDO se silencia EL SISTEMA DEBE detener música y efectos.

### R3 — Contraste
- Jaguar, puma y serpientes con colores más saturados y contorno oscuro. Sombra bajo el puente colgante.

### R4 — Área segura
- EL SISTEMA DEBE ubicar el área de juego dentro de `env(safe-area-inset-*)`, de modo que el HUD y el botón de pausa nunca queden bajo el notch o la barra de estado.

### R5 — Vidas compactas
- El HUD muestra un solo corazón y el número de vidas (❤ ×3).

## Fuera de alcance
- Música distinta por región; control de volumen separado.

## Supuestos y preguntas abiertas
> ⚠️ Supuesto: el WebView de Android reporta `safe-area-inset-*` cuando la app es edge-to-edge. ❓ Pendiente: verificar en dispositivo real con Capacitor (spec 002).
> ⚠️ Decisión: no se usa un desplazamiento fijo de 25 px (desperdicia espacio en pantallas sin notch).
