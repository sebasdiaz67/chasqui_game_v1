# Spec 002 — Empaquetado Android (Capacitor)

**Estado:** Borrador · **Fecha:** 2026-10-04 · **Proyecto:** chasqui

## Contexto y problema
El juego corre en navegador; para Google Play se necesita un AAB firmado.

## Objetivo
Generar un AAB instalable, vertical, offline, con ícono y splash propios.

## Requisitos
### R1 — Proyecto Capacitor
- EL SISTEMA DEBE usar `www/` como webDir y el appId `com.sebastian.chasqui` (❓ confirmar appId: es permanente en Play).
### R2 — Orientación y pantalla
- EL SISTEMA DEBE bloquear orientación vertical y respetar áreas seguras (notch).
### R3 — Ciclo de vida
- CUANDO la app pasa a segundo plano EL SISTEMA DEBE pausar (ya cubierto vía `visibilitychange`; verificar en WebView).
- CUANDO se pulsa "atrás" en Android durante la partida EL SISTEMA DEBE pausar en lugar de cerrar.
### R4 — Assets de tienda
- Ícono adaptativo y splash generados con `@capacitor/assets`.
### R5 — Firma
- AAB firmado con keystore propio, respaldado fuera del repositorio.

## Requisitos de entorno (verificados 2026-10-04)
- Capacitor 8: Node 22+, Android Studio 2025.2.1+, JDK 21 (incluido en Android Studio). Reemplaza la suposición inicial de Node 18 / JDK 17.
- Script `preparar_entorno.ps1`: diagnóstico + instalación con winget + `npx cap doctor`.

## Fuera de alcance
- Publicación en la tienda, monetización, servicios de Google Play Games.

## Supuestos y preguntas abiertas
> ❓ Pendiente: versión mínima de Android y target API vigente exigida por Play (cambia cada año).
> ❓ Pendiente: ejecutar `preparar_entorno.ps1` en la máquina del usuario y revisar la salida de `npx cap doctor`.
> ⚠️ Supuesto: la compilación y firma las ejecuta el usuario en Windows.
