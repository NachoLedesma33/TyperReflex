# TyperReflex – Plan de Mejoras

> Estado: Fases 0–4 completas y **sección 1 completa** (componentes/funcionalidad). Pendiente: punto 17 (backend/multiplayer, decisión separada), secciones 2–10 (estilos, perf, tests, fuentes, a11y restante, UX, tooling, analytics opcional).
> Referencias de código: `src/components/TypingTest.tsx`, `src/lib/words.ts`, `src/index.css`, `src/App.tsx`.

---

## 1. Componentes / Funcionalidad

### 1.1 Modos y configuración del test

- [x] **Configurable antes de empezar**: panel de configuración con opciones (puntuación, números, mayúsculas, modo) también visible mientras se corre el test.
- [x] **Modo "capitales"**: comenzar palabras con mayúscula (opción extra).
- [x] **Modo "largo"**: palabras largas / top-200 más largas.
- [x] **Modo "zen"**: sin límite de tiempo ni palabras, parar con Tab/Esc/botón finish.
- [x] **Config de dificultad/duplicación de palabras**: `COMMON_WORDS` deduplicado (422 → 388 únicos) + `shuffle` evita repeticiones consecutivas.
- [x] **Solo números / solo símbolos** como modo de práctica dedicada.

### 1.2 Feedback de tecleo

- [x] **Flecha de palabras**: indicador flotante (▸) que marca el final de la palabra actual cuando el caret llega al borde.
- [x] **Blaming / "missed chars"**: subrayar caracteres que faltaron al saltar palabra con espacio.
- [x] **Sonido de tecla opcional** (typing sound, toggle mudo).
- [x] **Vibrato/efecto "shake"** en el caracter incorrecto (opcional, toggle `shakeEnabled`).
- [x] **Caret con ancho real** del carácter (block) como opción (`caretStyle`).
- [x] **Smoothness del caret**: caret flotante posicionado por transform + transición CSS 0.12s.

### 1.3 Resultados

- [x] **Gráfico WPM vs tiempo** (recharts ya está como dependencia) con línea de wpm y raw.
- [x] **Gráfico de errores por palabra** (heatmap de teclas, keyboard heatmap).
- [x] **Persistencia de resultados en localStorage** + historial por modo/duración.
- [x] **Récords personales** (PB) por modo/duración destacados en pantalla de resultados.
- [x] **Tabla de distribución**: percentiles (vs historial del mismo modo/duración), consistencia (100 − desviación estándar del WPM).
- [x] **Exportar resultados**: copiar al portapapeles / descargar JSON.
- [x] **Resumen de errores más comunes** (top 10 errores de tecla: cuál apretaste vs cuál era).
- [x] **Compartir resultados** en texto plano (formato para pegar en redes, Web Share API + fallback copia).

### 1.4 Preferencias persistentes (Settings)

- [x] **Panel de ajustes completo** (modal): fuente, tamaño de fuente, gap entre palabras, tema, sonido, caret, modo por defecto, etc. guardado en localStorage.
- [x] **Reset de configuración** a valores por defecto.
- [x] **Perfiles de configuración** (presets).

### 1.5 UI general

- [x] **Toggle de tema (light/dark/system)** visible en el header — `mode-toggle.tsx` ya existe y se usa en `App.tsx`.
- [x] **Página/estado de "splash"** animado al cargar.
- [x] **Footer** con stats globales y links.
- [x] **Barra de progreso** del test (palabras completadas / restantes).
- [x] **Contador de tiempo restante** animado con anillo (circular).
- [x] **Tooltips** en los botones de la toolbar.
- [x] **Atajos de teclado ampliados**: `1/2/3/4` cambiar duración, `p` puntuación, `n` números, `c` capitales, `l` largo, `m` modo, `Esc` terminar/results.
- [x] **Responsive**: en mobile, toolbar con scroll horizontal y botones más grandes táctiles.

---

## 2. Estilos / UI / UX

- [ ] **Fuentes self-hosted**: usar variable font (ej. `JetBrains Mono`, `IBM Plex Mono`, `Fira Code`) descargada localmente en vez de depender del sistema → más consistente en todas las plataformas. Agregar `@font-face` + `font-display: swap`.
- [ ] **Fallback de fuente**: definir stack `font-mono` explícito.
- [ ] **Tabular numbers** para WPM/timer (ya parcial con `tabular-nums`).
- [ ] **Paleta de temas adicionales** (dark/light y themes como "crimson", "matrix", "gruvbox") seleccionables desde un menú de temas.
- [ ] **Estilo hover/focus visible** consistente (a11y) en ToolBtn.
- [ ] **Transición de tema** suave (evitar flash) con `color-scheme`.
- [ ] **Prevenir FOUC** del tema oscuro (script inline en `index.html` o `theme-provider` aplicando antes del render).
- [ ] **Scroll de la zona de palabras más suave**: reducir motion blur (el `transform: translateY` con transición puede producir subpixel blur — forzar redondeo de `scrollOffset` a enteros, o usar `will-change: transform`).
- [ ] **Optimizar line-height/font-size con tokens** responsive (ya con `clamp()`), considerar medir en `em` para coherencia.
- [ ] **Espaciado y jerarquía de la pantalla de resultados** mejorada (stats primarias vs secundarias).
- [ ] **Dark mode para la página completa** incluyendo scrollbars (`::-webkit-scrollbar`).
- [ ] **Iconografía** coherente en toolbar (lucide-react ya disponible).
- [ ] **Layout** más cercano a monkeytype: contenido centrado, headers/inputs alineados a la zona de tipeo, no full-width.

---

## 3. Rendimiento

### 3.1 React / render

- [x] **Evitar re-renderizar los 300 words** en cada keystroke: memoizar `WordSpan` con `React.memo` y pasar props estables; actualmente cada tecla re-renderiza la lista completa de `words.map`.
- [x] **Virtualizar la lista de palabras** (solo renderizar las visibles + buffer) — con las 3 filas visibles bastaría renderizar ~15-20 words.
- [ ] **Separar el estado "caliente"** (input actual) del estado "frío" (palabras) para reducir renderizaciones.
- [ ] **Memoizar `ResultsScreen`** y componentes estáticos.
- [ ] **`useMemo`/`useCallback`** para funciones helpers costosas.

### 3.2 Timer / intervalos

- [x] **Timers basados en timestamps** (`performance.now()`) en vez de `setInterval` de 1s — el intervalo actual puede desincronizarse y causar renders innecesarios.
- [x] **Reducir renders del timer**: actualizar el contador cada 100ms-250ms con `requestAnimationFrame` o solo cuando cambia el segundo.
- [ ] **Evitar `setTimeout` anidado** en `resetTest` para focus (usar `useEffect`).

### 3.3 Bundles / assets

- [ ] **Code-splitting**: cargar solo lo necesario; el bundle JS actual ~235KB gzip ~75KB (ok), pero recharts/ui no usados deberían quitarse de deps o importarse perezosamente.
- [ ] **Eliminar dependencias sin uso**: revisar `package.json` (radix, cmdk, vaul, recharts, etc.) — muchas pueden no usarse en la app actual.
- [ ] **Analizar bundle**: `vite build` con `rollup-plugin-visualizer`.
- [x] **Lazy-load** de `Words`/UI de resultados.

### 3.4 Otros

- [ ] **`content-visibility: auto`** en filas fuera de pantalla.
- [x] **PWA**: manifest + service worker para instalación y offline (vite-plugin-pwa).
- [ ] **Precarga de fuente** (`<link rel="preload">`).

---

## 4. Tests

### 4.1 Unit (Vitest + Testing Library)

- [ ] **`calcResults`**: WPM, raw WPM, accuracy, chars correctos/incorrectos/extra, edge cases (0s, palabras vacías).
- [ ] **`getCharStatuses`** y **`wordHasError`**: matrices de caracteres correctos/incorrectos/extra.
- [ ] **`generateWords`**: cantidad exacta, distribución de puntuación/números, sin caracteres extraños.
- [ ] **Caret/posición**: lógica de posición de caret en palabra actual y final.
- [ ] **`cn`** y helpers de `utils.ts`.
- [ ] **Store/preferencias** (si se implementan): defaults, persistencia, reset.

### 4.2 Component

- [ ] **`TypingTest`**: render inicial, arranque con primera tecla, completar palabra con espacio, cambio de modo/duración, fin de test en modo words, reset con Tab, click-to-focus.
- [ ] **`ThemeProvider`**: toggling con tecla `d`, respeto a sistema, persistencia en localStorage.
- [ ] **`ResultsScreen`**: render de stats, restart.
- [ ] **`ToolBtn`**: estado activo/inactivo.

### 4.3 E2E (Playwright)

- [ ] **Setup Playwright** + config con proyecto Chrome/WebKit/Firefox.
- [ ] **Flujo completo**: abrir → seleccionar modo → teclear con `keyboard.type` → verificar resultados y que se pueda reiniciar.
- [ ] **Persistencia**: recargar y verificar tema/preferencias guardadas.
- [ ] **Responsive**: viewport mobile → toolbar usable.
- [ ] **Accesibilidad básica**: Tab navegación, aria-labels, contraste.
- [ ] **CI**: correr unit + e2e en GitHub Actions (push a main + PRs).

---

## 5. Fuentes / Tipografía

- [ ] Elegir variable font mono (JetBrains Mono / IBM Plex Mono / Geist Mono) y self-hostear en `public/fonts`.
- [ ] `@font-face` con `font-display: swap` y subsets.
- [ ] Usar la fuente para todo el mono (palabras, timer, resultados).
- [ ] Config de tamaño/gap de fuente en settings (slider).
- [ ] `font-feature-settings` / ligaduras off para claridad en tipeo.

---

## 6. Accesibilidad (a11y)

- [x] **Contraste** de `--typer-untyped` en ambos temas (verificar WCAG AA).
- [x] **Focus visible** en ToolBtn y botones.
- [x] **Live region** para anunciar el resultado final a lectores de pantalla.
- [ ] **`aria-live`** para el timer.
- [x] **Reducir movimiento**: `prefers-reduced-motion` → desactivar transición de scroll y blink del caret.
- [ ] **Labels** en inputs/controles.
- [ ] **Zoom al 200%** sin romper layout.

---

## 7. UX de flujo / interacción

- [ ] **Confirmar reinicio** cuando hay progreso (opcional, off por defecto).
- [ ] **Pausa** (Esc) sin perder el test.
- [ ] **"Terminar ahora"** antes del tiempo límite (botón/atajo) para ver resultados.
- [ ] **Palabra incorrecta → no avanzar** opcional (modo estricto).
- [ ] **Corrección de errores con backspace** mostrando feedback visual.
- [ ] **Focus en el área de tipeo al cargar** sin requerir click.
- [x] **Feedback al completar**: animación/confeti opcional en PB.
- [ ] **Onboarding sutil** la primera vez (tooltip "hacé click y empezá a teclear").

---

## 8. Calidad / Tooling / Mantenimiento

- [x] **ESLint + Prettier** configurados y funcionando (ya hay tsconfig estricto).
- [x] **Husky + lint-staged** para hooks de pre-commit.
- [ ] **Commit convention** (Conventional Commits) + script de ayuda.
- [ ] **Actualizar/limpiar dependencias** (hay 4 vulnerabilidades en `npm audit`).
- [ ] **TypeScript strict** completo y sin `any` implícitos.
- [ ] **`.env` + validación** si se agregan features externas (backend, analytics).
- [ ] **README** más completo: screenshots, deploy, scripts.
- [ ] **Deploy**: GitHub Pages / Vercel / Netlify config.
- [ ] **CHANGELOG** + versionado semántico.

---

## 9. Datos / Analytics (opcional)

- [x] **Stats agregadas** por usuario (media de wpm, racha, total de caracteres) en localStorage.
- [x] **Calendario de actividad** (streak) estilo GitHub.
- [ ] **Meta-benchmark**: comparar tu wpm con percentiles de la comunidad (offline/local).
- [x] **Historial por día** con filtros por modo.

---

## 10. Backend / Multiplayer (futuro, fuera de scope ahora)

- [ ] Leaderboards globales (requiere backend).
- [ ] Races en tiempo real (WebSocket).
- [ ] Cuentas y sync de config/results (requiere auth).
- [ ] Generación de texto por API (textos de libros, código).

---

## Orden de implementación sugerido (roadmap)

### Fase 0 – Base de calidad

1. [x] ESLint/Prettier + Husky + Convention Commits.
2. [ ] Tests unit (Vitest) de `calcResults`, `getCharStatuses`, `generateWords`.
3. Setup Playwright con 2-3 tests E2E básicos.
4. Limpiar deps sin uso + `npm audit`.

### Fase 1 – UX core

5. [x] Memoizar `WordSpan` y virtualizar palabras → perf de tecleo.
6. [x] Timer por timestamp (menos renders, más preciso).
7. [x] Settings persistentes (fuente, tamaño, gap, tema, sonido) + menú de temas.
8. [x] Panel de ajustes modal + toggle de tema visible en header.

### Fase 2 – Resultados

9. [x] Gráfico WPM/raw con recharts.
10. [x] Historial + récords personales + persistencia.
11. [x] Export/copiar resultados.

### Fase 3 – Feature-rich

12. [x] Modo zen + modos extra (capitals, punctuation+numbers refinado).
13. [x] Sound de teclas + efectos.
14. [x] PWA (offline/instalación).
15. [x] A11y completo (contraste, reduced-motion, live regions).

### Fase 4 – Datos / futuro

16. [x] Stats globales, streaks, heatmap de teclas.
17. [ ] Backend/multiplayer (decisión separada).

---

## Notas / hallazgos del código actual

- `words.ts` **ya no tiene duplicados**: `COMMON_WORDS` deduplicado (388 únicos) + `LONG_WORDS` (153 largas ≥8 chars) + opciones `onlyNumbers`/`onlySymbols`; `shuffle` evita repetidos consecutivos. Nueva firma `generateWords(count, options?)`.
- El caret es flotante (absoluto, posicionado por `transform` con transición 0.12s) para smoothness; block caret vive sobre el caracter actual (`caretStyle`).
- Shake en caracteres incorrectos (`shakeEnabled`), blaming por caracter (subrayado `--typer-wrong-dim` en chars faltantes/equivocados de palabras completadas).
- Errores comunes: se capturan pares `expected→typed` (incl. `space` para chars omitidos) y se muestran top 10 en resultados.
- Consistencia = 100 − desviación estándar del WPM por segundo; percentil = posición del resultado dentro del historial del mismo modo/duración.
- Atajos de teclado (1-4, p, n, c, l, m) solo aplican en idle para no interferir con el tipeo; `Esc` termina el test en cualquier modo; `Tab` reinicia.
- El bundle con recharts se resuelve con `React.lazy` + Suspense (ResultsScreen ~112KB gzip, se carga al terminar el test).
- `npm audit` reporta 4 vulnerabilidades (2 low, 2 high) pendientes de limpiar.
- El timer usa `performance.now()` + polling 200ms (sin deriva); el contador renderiza solo cuando cambia el segundo.
- `ThemeProvider` soporta tema por sistema y toggle con tecla `d`.
- Zen mode: pool inicial de 1000 palabras con recarga automática (`ZEN_REFILL_AT`), termina con botón `finish`/Esc, guarda con `option=0`.
- Stats globales (`typerreflex-stats`) y heatmap de teclas acumulado (`typerreflex-key-heatmap`) en localStorage, actualizados al terminar cada test. `recordStats` emite evento `typerreflex-stats-updated` que refresca el footer en vivo.
- El heatmap de teclas captura sustituciones (tecla equivocada) y omisiones (chars salteados al cerrar palabra con espacio), normalizadas a minúscula.
