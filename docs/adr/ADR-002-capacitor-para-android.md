# ADR-002 — Capacitor para empaquetar en Android

**Estado:** Aceptada · **Fecha:** 2026-10-04

## Contexto
Publicar el juego HTML5 en Google Play.

## Decisión
Capacitor con `www/` como webDir.

## Alternativas consideradas
- TWA / PWA con Bubblewrap: requiere hosting HTTPS + dominio + Digital Asset Links; depende de conexión para la primera carga.
- Cordova: ecosistema en declive.

## Consecuencias
- Positivas: proyecto Android nativo editable, offline, acceso a plugins (háptica, back button, status bar).
- Negativas: requiere Android Studio y JDK en la máquina del usuario.
