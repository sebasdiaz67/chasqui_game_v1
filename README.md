# Chasqui: El Mensajero Inca

Juego móvil vertical (runner) sobre los chasquis, los mensajeros del imperio inca. Hecho con HTML5 Canvas + JavaScript, sin dependencias ni archivos externos: el arte se dibuja por código y el sonido se sintetiza con WebAudio, incluida una **música andina procedural** (quena en pentatónica menor, bordón y bombo con ritmo de huayno) que arranca con el primer toque. Funciona sin conexión y respeta el notch de los celulares (área segura).

> Contexto técnico y reglas de trabajo: [`CLAUDE.md`](CLAUDE.md) · Estado y próximos pasos: [`STATUS.md`](STATUS.md) · Specs: [`specs/`](specs/)

## Modos de juego

### Campaña (5 niveles)
Cada nivel es un encargo de un pueblo a otro en una región del imperio. Empieza en una aldea, termina en la aldea de destino con la persona que recibe la entrega, y al completarlo el Inca te felicita y aprendes un dato histórico.

| Nv | Región | Misión | Tipo | Peligros | Distancia |
|---|---|---|---|---|---|
| 1 | Norte | Tejidos de Pakari para Taita Atuk (Illari) | Entregar | llamas, zorro andino, rocas, puma | 1000 m |
| 2 | Selva | Plantas medicinales para Mama Sisa (Sumak) | Recoger 10 y entregar | serpientes, jaguar, ríos con caimanes | 1200 m |
| 3 | Sur | Pescado fresco para Taita Waman (Kuntur) | Contrarreloj (62 s) | derrumbes, cóndor, zorro, rocas | 1300 m |
| 4 | Altiplano | Mantas de lana para Mama Killa (Chiri) | Entregar | abismos anchos con puente colgante, puma, cóndor, llamas, nieve | 1500 m |
| 5 | Cusco | Mensaje al Inca | Entregar (final) | todo mezclado, velocidad máxima | 1500 m |

- Cada nivel completado desbloquea el siguiente; el progreso y el **nivel máximo alcanzado** se guardan.
- Dentro de cada nivel la dificultad sube **cada 200 m** (más velocidad y más obstáculos), con el aviso «El camino se acelera».
- Misión de recoger: cada golpe te hace perder 2 plantas; si llegas con menos de las necesarias, la misión falla.
- Contrarreloj: si el tiempo llega a 0, la misión falla. Cada golpe te hace tropezar y perder un poco de tiempo.

### Camino infinito
Se desbloquea al terminar el nivel 5. Recorre las 5 regiones sin fin: cada 700 m llegas a un **tambo** (relevo) que da +100 puntos, +1 vida y un dato histórico. Guarda el récord de puntaje.

## Controles
- **Desliza** el dedo en cualquier parte: el chasqui se mueve en relación al deslizamiento, así el dedo no lo tapa. Teclado: ← → o A / D.
- **Pututu** (botón 🐚 o Espacio): despeja los obstáculos y animales en pantalla. Máximo 3 cargas.
- **Pausa**: botón II, P o Esc. El juego se pausa solo si la app pasa a segundo plano.

## Elementos
| Elemento | Efecto |
|---|---|
| ❤ ×N (arriba a la izquierda) | Vidas restantes |
| Quipu (halo dorado) | +10 puntos; se acumulan entre partidas para desbloquear chasquis |
| Planta medicinal (halo verde) | Cuenta para la misión del nivel 2 |
| Escudo de Inti (amarillo) | Inmunidad 5 s; rompe obstáculos (+20) y atrae lo que recoges |
| Luz de Killa (azul) | Ralentiza todo al 50 % durante 6 s |
| Maíz (rojo) | +1 vida (solo aparece si te falta vida) |
| Pututu (naranja) | +1 carga de pututu |
| Puma / jaguar | Esperan al borde del camino; sus ojos brillan y aparece "!" antes de saltar |
| Cóndor | Aparece "!" arriba antes de bajar en picada |
| Derrumbe | Una sombra roja marca dónde caerá la roca; luego queda como obstáculo |
| Río | Solo se cruza por las piedras; caer al agua quita una vida. Los caimanes nadan de lado a lado |
| Abismo | Solo se cruza por el puente colgante |

Al recibir un golpe pierdes 1 vida, quedas inmune 1.6 s (parpadeas) y tropiezas un instante.

## Personajes
| Chasqui | Vidas | Habilidad | Se desbloquea con |
|---|---|---|---|
| Amaru | 3 | Equilibrado | Disponible |
| Wayra | 2 | Más rápido y más pequeño | 40 quipus |
| Rumi | 4 | Resistente, pero más lento | 120 quipus |
| Kusi | 3 | Sus poderes duran casi el doble | 250 quipus |

## Ejecutar
- Doble clic en `www/index.html`, o servirlo:
  ```
  npx serve www          # o: python -m http.server -d www 8080
  ```
- En el celular (misma red WiFi): `http://<IP-de-tu-PC>:8080`.
- Desde la raíz de proyectos: `D:\claude-projects\index.html` → **Abrir app**.

## Pruebas
```
npm i -D playwright && npx playwright install chromium
node tests/smoke.mjs
```
38 comprobaciones automáticas ligadas a los requisitos de las specs 001, 004 y 005 (misiones, fauna, ríos, derrumbes, abismos, desbloqueos, persistencia, modo infinito).

## Estructura
```
www/                  <- carpeta web (webDir de Capacitor)
  index.html          pantallas: menú, campaña, misión, victoria, fallo, personajes, pausa
  css/style.css
  js/config.js        DATOS Y BALANCE: regiones, niveles, personajes, poderes, datos históricos
  js/storage.js       guardado local tolerante a fallos
  js/audio.js         efectos y música procedural (WebAudio): CH.Sfx.playBGM / stopBGM / toggleMute
  js/draw.js          todo el arte (Canvas 2D)
  js/game.js          lógica: modos, misiones, generación, colisiones, controles, pantallas
tests/smoke.mjs       prueba automática en navegador headless
specs/                SDD: 001 base · 002 Android · 003 arte · 004 campaña · 005 música y UI móvil
docs/adr/             decisiones de arquitectura
```
Se usan scripts clásicos (no módulos ES) para que `index.html` funcione con doble clic.

**Agregar un nivel:** una entrada nueva en `CH.LEVELS` de `config.js` (región, misión, distancia, velocidad, peligros, textos y 2 datos históricos). Solo hay que tocar `game.js` si el nivel trae un tipo de misión nuevo.

## Empaquetar para Android (Capacitor 8)
Requisitos (verificados 2026-10): **Node 22+**, **Android Studio 2025.2.1+** y **JDK 21** (Android Studio trae el suyo en `jbr`).

**Preparar el entorno en Windows** (diagnostica, instala lo que falte con winget y ejecuta `npx cap doctor`):
```
powershell -NoProfile -ExecutionPolicy Bypass -File D:\claude-projects\chasqui\preparar_entorno.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File D:\claude-projects\chasqui\preparar_entorno.ps1 -InstallAndroidStudio -InitCapacitor
```

Pasos manuales equivalentes:
```
npm init -y
npm i @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Chasqui" com.sebastian.chasqui --web-dir www
npx cap add android
npx cap sync
npx cap open android
```
En `android/app/src/main/AndroidManifest.xml`, en la `<activity>` principal: `android:screenOrientation="portrait"`.

## Pendiente antes de publicar
- Probar en un Android real: control táctil y dificultad de los 5 niveles.
- Arte final (los dibujos por código son provisionales) — spec 003.
- Ícono, splash, capturas y política de privacidad para Google Play.
- Revisar los datos históricos con fuentes antes de publicar.

## Subir el código a GitHub

Este proyecto es un **repositorio git propio** en `D:\claude-projects\chasqui` (rama `main`, etiqueta `v1.0.0`). Solo contiene el juego: la estructura SDD de la carpeta superior no se sube.

### Qué se necesita
1. **Cuenta de GitHub.**
2. **Git para Windows** (incluye *Git Credential Manager*, que gestiona el inicio de sesión):
   ```powershell
   winget install --id Git.Git --exact
   git --version
   ```
3. **Un repositorio PRIVADO y VACÍO** en <https://github.com/new>: sin README, sin `.gitignore` y sin licencia (ya existen localmente; si GitHub los crea, el primer push choca).
   Debe ser **privado** porque la licencia del juego es propietaria (`LICENSE`).
4. **Autenticación**: en el primer `git push` se abre el navegador para iniciar sesión (Git Credential Manager).
   Alternativa con la CLI de GitHub: `winget install --id GitHub.cli --exact` y luego `gh auth login`.
   Nunca pegues tokens ni contraseñas en el código, en commits ni en chats.

### Primera subida (PowerShell)
```powershell
cd D:\claude-projects\chasqui
git status                      # debe decir "nothing to commit, working tree clean"
git remote add origin https://github.com/<tu-usuario>/<tu-repo>.git
git push -u origin main
git push origin --tags          # sube la etiqueta v1.0.0
```
Con la CLI de GitHub, crear el repo privado y subir en un paso:
```powershell
cd D:\claude-projects\chasqui
gh repo create <tu-repo> --private --source . --remote origin --push
git push origin --tags
```

### Si git muestra "detected dubious ownership"
El repositorio se creó desde el entorno de Claude (Linux) sobre tu disco; Windows puede considerarlo de otro dueño. Se autoriza una sola vez:
```powershell
git config --global --add safe.directory D:/claude-projects/chasqui
```

### Antes de cada subida
- Pruebas en verde: `node tests/smoke.mjs`.
- Ninguna llave de firma versionada: `git ls-files | Select-String -Pattern 'jks|keystore'` no debe devolver nada.
- Siguientes subidas: `git push` (y `git push origin --tags` cuando haya una versión nueva).

### Qué queda fuera del repositorio (`.gitignore`)
Llaves de firma (`*.jks`, `*.keystore`), APK/AAB, carpetas de build de Android y `node_modules/`.
**Respalda la llave de firma aparte**: si se pierde, no se pueden publicar actualizaciones de la app en Google Play.

## Autoría
**Chasqui: El Mensajero Inca** · versión 1.0.0  
Byron Sebastián Rosero Díaz — Ingeniero de software  
© 2026 Byron Sebastián Rosero Díaz. Todos los derechos reservados. Software propietario: ver [`LICENSE`](LICENSE).
