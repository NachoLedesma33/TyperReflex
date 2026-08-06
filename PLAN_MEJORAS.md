# TyperReflex – Plan de Mejoras

> Estado: Fases 0–4 completas, **sección 1 completa** (componentes/funcionalidad), **sección 2 completa** (estilos/UI/UX), **sección 4 completa** (tests unit + component + E2E/CI: 70 unit + 36 E2E), **sección 6 completa** (a11y), **sección 7 completa** (UX de flujo/interacción: 78 unit + 51 E2E) y **sección 8 completa** (tooling/calidad: commit convention, npm audit 0 vulns, TS strict sin any, .env.example, README + screenshots, deploy Vercel, CHANGELOG 1.0.0). Últimas tandas: **focus mode**, **backspace vuelve a la palabra anterior**, **header full-width** y **accuracy que cuenta errores corregidos** — 83 unit + 57 E2E ✓. **Backend/multiplayer postergado a futuro** (secciones 9-10 y punto 17). Próxima: **sección 11 – mejoras frontend** (fuentes, idiomas, botones, animaciones).
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
- [x] **Responsive**: toolbar en dos filas centradas con wrap (fila 1: punctuation/numbers/capitals/long/number/symbol; fila 2: modos + duración), sin scroll horizontal — todo visible en mobile.

---

## 2. Estilos / UI / UX

- [x] **Fuentes self-hosted**: variable font `JetBrains Mono` (woff2 40KB, pesos 100–800) descargada en `public/fonts` en vez de depender del sistema/CDN → consistente en todas las plataformas. `@font-face` + `font-display: swap` + `preload`.
- [x] **Fallback de fuente**: stack `--font-mono` explícito en `@theme` (`ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace`).
- [x] **Tabular numbers** para WPM/timer (TimerRing, contador de palabras, resultados, footer).
- [x] **Paleta de temas adicionales**: agregadas `matrix` (verde) y `gruvbox` (naranja) al sistema de paletas existente, seleccionables desde Settings. Además **themes de background** con vars light/dark propias que mantienen contraste de lectura y sobre los que siguen aplicando las paletas de acento: **Lavender** (`#c1bbd1`), **Sage** (verde-gris), **Ocean** (azul suave) y **Sand** (beige cálido), seleccionables en Settings (setting `themeId`, clases `theme-*`).
- [x] **Estilo hover/focus visible** consistente (a11y) en ToolBtn: `aria-pressed`, `hover:bg-accent/40`, `focus-visible` outline en todos los botones.
- [x] **Transición de tema** suave (evitar flash) con `color-scheme` (`light`/`dark` en `:root`/`.dark`).
- [x] **Prevenir FOUC** del tema oscuro: script inline en `index.html` aplica la clase `dark`/`light` antes del render.
- [x] **Scroll de la zona de palabras más suave**: `will-change: transform` + `backface-visibility: hidden` en el contenedor scrolleable; `scrollOffset` ya se redondea a enteros.
- [x] **Optimizar line-height/font-size con tokens**: `--typer-line-height: calc(var(--typer-font-size) * 1.85)` unificado en CSS y settings.
- [x] **Espaciado y jerarquía de la pantalla de resultados**: stats secundarias en grid de cards (raw, chars, time, mode, consistency, percentile).
- [x] **Dark mode para la página completa** incluyendo scrollbars (`::-webkit-scrollbar` + `scrollbar-width`/`scrollbar-color`).
- [x] **Iconografía** coherente en toolbar (lucide-react): Quote/Hash/CaseUpper/Ruler/Binary/Percent + Timer/Rows3/Zap.
- [x] **Layout** más cercano a monkeytype: header/footer alineados al ancho de la zona de tipeo (`max-w-4xl mx-auto`).
- [x] **Header full-width**: sin `max-w-4xl mx-auto`, `px-6 md:px-10` — título pegado al margen izquierdo, icons al derecho; título responsive `text-2xl sm:text-3xl md:text-4xl`.
- [x] **Focus mode**: al empezar a escribir (running y no pausado) el header/footer/toolbar desaparecen (`opacity:0` + `visibility:hidden` + `pointer-events:none`, transición 0.25s, respeta `prefers-reduced-motion`); pausar, terminar o reiniciar los restaura. Clase `.typer-focus-mode` en `<body>`, toolbars marcadas con `.typer-toolbar`.
- [x] **Backspace vuelve a la palabra anterior**: con input vacío y ≥1 palabra completada, `Backspace` restaura el typed de la palabra previa, la saca de `completedWords` y decrementa el índice (no aplica en pausa ni en confirmación de reset).
- [x] **Accuracy cuenta errores corregidos**: el porcentaje final ya no sale del estado final (que daba 100% si corregías), sino de un contador por pulsación (`mistakesRef` en `TypingTest`): tecla equivocada, caracter extra y caracter omitido al cerrar con espacio suman aunque después se corrijan. `calcResults(completed, secs, mistakes?)` usa ese contador cuando se pasa (fallback a estado final). Las posiciones omitidas se cuentan 1 sola vez por palabra (para no inflar al re-completar tras volver atrás).
- [x] **Slider de gap entre palabras**: rango extendido (max 2.5 rem) en el panel de settings.

---

## 3. Rendimiento

### 3.1 React / render

- [x] **Evitar re-renderizar los 300 words** en cada keystroke: memoizar `WordSpan` con `React.memo` y pasar props estables; actualmente cada tecla re-renderiza la lista completa de `words.map`.
- [x] **Virtualizar la lista de palabras** (solo renderizar las visibles + buffer) — con las 3 filas visibles bastaría renderizar ~15-20 words.
- [x] **Separar el estado "caliente"** (input actual) del estado "frío" (palabras) para reducir renderizaciones — toolbar aislada en `OptionsToolbar` (`React.memo`) con setters estables; los keystrokes ya no re-renderizan los ~15 botones del toolbar.
- [x] **Memoizar `ResultsScreen`** y componentes estáticos — `ResultsScreen` envuelto en `React.memo`.
- [x] **`useMemo`/`useCallback`** para funciones helpers costosas — los setters del toolbar son estables (setState + toggles useCallback); los cálculos de resultados ya usan `useMemo`.

### 3.2 Timer / intervalos

- [x] **Timers basados en timestamps** (`performance.now()`) en vez de `setInterval` de 1s — el intervalo actual puede desincronizarse y causar renders innecesarios.
- [x] **Reducir renders del timer**: actualizar el contador cada 100ms-250ms con `requestAnimationFrame` o solo cuando cambia el segundo.
- [x] **Evitar `setTimeout` anidado** en `resetTest` para focus — reemplazado por `useEffect` sobre `gameStatus === "idle"`.

### 3.3 Bundles / assets

- [x] **Code-splitting**: los dialogs del header (Settings/History/Stats) y `ModeToggle` son lazy-loaded con `Suspense` — son los únicos consumidores de `radix-ui`, así que sale del chunk principal (392KB→259KB, gzip 124KB→83KB). recharts ya estaba lazy en `ResultsScreen`.
- [x] **Eliminar dependencias sin uso**: borradas 54 de 62 componentes `ui/` (quedan button, dialog, input, label, select, slider, switch, dropdown-menu). Quitadas 12 deps de `package.json` (cmdk, vaul, embla-carousel-react, react-day-picker, input-otp, react-hook-form, @hookform/resolvers, react-resizable-panels, sonner, next-themes, date-fns, zod). `canvas-confetti` movido de devDependencies a dependencies (se usa en runtime). -16 paquetes en `npm install`.
- [x] **Analizar bundle**: `vite build` con `rollup-plugin-visualizer` (`npm run build:analyze`, reporte en `dist/bundle-report.html`). Resultado (gzip): recharts 185KB (ya lazy en ResultsScreen ✓), react-dom 95KB, radix-ui 44KB (en chunk principal), código propio 36KB, total 540KB. No queda limpieza obvia en deps; optimización real = code-splitting de radix-ui (3.1/3.4) o migrar de recharts a SVG propio.
- [x] **Lazy-load** de `Words`/UI de resultados.

### 3.4 Otros

- [x] **`content-visibility: auto`** en filas fuera de pantalla — clase `.typer-words` en el contenedor de palabras (rows traducidas fuera de pantalla se saltan el render/layout) con `contain-intrinsic-size`.
- [x] **PWA**: manifest + service worker para instalación y offline (vite-plugin-pwa).
- [x] **Precarga de fuente** (`<link rel="preload">` en `index.html`).

---

## 4. Tests

### 4.1 Unit (Vitest + Testing Library)

- [x] **`calcResults`**: WPM, raw WPM, accuracy, chars correctos/incorrectos/extra, edge cases (0s, palabras vacías).
- [x] **`getCharStatuses`** y **`wordHasError`**: matrices de caracteres correctos/incorrectos/extra.
- [x] **`generateWords`**: cantidad exacta, distribución de puntuación/números, sin caracteres extraños.
- [x] **Caret/posición**: lógica de posición de caret en palabra actual y final (bar caret renderizado en el test de `TypingTest`; la posición deriva de `getCharStatuses`/`typed.length` ya unit-testeados).
- [x] **`cn`** y helpers de `utils.ts`.
- [x] **Store/preferencias**: defaults, persistencia, reset, presets (`settings.test.ts`).

### 4.2 Component

- [x] **`TypingTest`**: render inicial, arranque con primera tecla, completar palabra con espacio, cambio de modo/duración, fin de test en modo words, reset con Tab, click-to-focus.
- [x] **`ThemeProvider`**: toggling con tecla `d`, respeto a sistema, persistencia en localStorage.
- [x] **`ResultsScreen`**: render de stats, restart.
- [x] **`ToolBtn`**: estado activo/inactivo.

### 4.3 E2E (Playwright)

- [x] **Setup Playwright** + config con proyecto Chrome/WebKit/Firefox.
- [x] **Flujo completo**: abrir → seleccionar modo → teclear con `keyboard.type` → verificar resultados y que se pueda reiniciar.
- [x] **Persistencia**: recargar y verificar tema/preferencias guardadas.
- [x] **Responsive**: viewport mobile → toolbar usable.
- [x] **Accesibilidad básica**: Tab navegación, aria-labels, contraste.
- [x] **CI**: correr unit + e2e en GitHub Actions (push a main + PRs).

---

## 5. Fuentes / Tipografía

- [x] Elegir variable font mono (JetBrains Mono) y self-hostear en `public/fonts` (woff2 40KB, pesos 100–800).
- [x] `@font-face` con `font-display: swap` y subsets (latin variable).
- [x] Usar la fuente para todo el mono (palabras, timer, resultados) vía `--font-mono` base.
- [x] Config de tamaño/gap de fuente en settings (slider).
- [x] `font-variant-ligatures: none` para claridad en tipeo.

---

## 6. Accesibilidad (a11y)

- [x] **Contraste** de `--typer-untyped` en ambos temas (verificar WCAG AA).
- [x] **Focus visible** en ToolBtn y botones.
- [x] **Live region** para anunciar el resultado final a lectores de pantalla.
- [x] **`aria-live`** para el timer.
- [x] **Reducir movimiento**: `prefers-reduced-motion` → desactivar transición de scroll y blink del caret.
- [x] **Labels** en inputs/controles.
- [x] **Zoom al 200%** sin romper layout.

---

## 7. UX de flujo / interacción

- [x] **Confirmar reinicio** cuando hay progreso (opcional, off por defecto).
- [x] **Pausa** (Esc) sin perder el test.
- [x] **"Terminar ahora"** antes del tiempo límite (botón/atajo) para ver resultados.
- [x] **Palabra incorrecta → no avanzar** opcional (modo estricto).
- [x] **Corrección de errores con backspace** mostrando feedback visual.
- [x] **Focus en el área de tipeo al cargar** sin requerir click.
- [x] **Feedback al completar**: animación/confeti opcional en PB.
- [x] **Onboarding sutil** la primera vez (tooltip "hacé click y empezá a teclear").

---

## 8. Calidad / Tooling / Mantenimiento

- [x] **ESLint + Prettier** configurados y funcionando (ya hay tsconfig estricto).
- [x] **Husky + lint-staged** para hooks de pre-commit.
- [x] **Commit convention** (Conventional Commits) + script de ayuda: hook `.husky/commit-msg` valida el formato (zero-dep, `scripts/commit-validate.cjs`) + asistente interactivo `npm run commit` (`scripts/commit.cjs`).
- [x] **Actualizar/limpiar dependencias**: `npm audit fix` → 0 vulnerabilidades (antes 4: babel, esbuild, postcss, vite — todas devDeps). Solo cambió `package-lock.json`.
- [x] **TypeScript strict** completo y sin `any` implícitos: `strict: true` ya activo, `no-explicit-any` en ESLint, 0 usos de `any` en todo el repo (verificado por grep).
- [x] **`.env` + validación**: se creó `.env.example` (`VITE_BASE_PATH`, para sub-path deploys) + `.gitignore` para `.env*`. Sin features externas no hace falta validación runtime.
- [x] **README** más completo: features, stack, scripts, atajos, settings, temas, testing, convenciones, deploy Vercel, estructura y screenshots (`docs/screenshots/`, generadas con `npm run screenshots`).
- [x] **Deploy**: **Vercel** configurado (`vercel.json`: framework vite, build `npm run build`, output `dist`, cleanUrls + rewrite SPA). `base` de Vite queda overrideable vía `VITE_BASE_PATH` por si se usa otro host sub-path.
- [x] **CHANGELOG** + versionado semántico: `CHANGELOG.md` (Keep a Changelog) + bump a `1.0.0`.

---

## 9. Datos / Analytics (opcional)

- [x] **Stats agregadas** por usuario (media de wpm, racha, total de caracteres) en localStorage.
- [x] **Calendario de actividad** (streak) estilo GitHub.
- [ ] **Meta-benchmark**: comparar tu wpm con percentiles de la comunidad (offline/local).
- [x] **Historial por día** con filtros por modo.

---

## 10. Backend / Multiplayer (postergado a futuro)

- [ ] Leaderboards globales (requiere backend).
- [ ] Races en tiempo real (WebSocket).
- [ ] Cuentas y sync de config/results (requiere auth).
- [ ] Generación de texto por API (textos de libros, código).

---

## 11. Frontend – Mejoras propuestas (pendientes)

> Prioridad pedida por el usuario: más fuentes, idiomas (2-3), botones más profesionales y animaciones extra. Las ideas propias van marcadas con ✍️.

### 11.1 Tipografía

- [ ] **Catálogo de fuentes mono self-hosted** (como JetBrains Mono): Fira Code, Roboto Mono, IBM Plex Mono, Space Mono, Courier Prime. Selector en Settings con preview en vivo y persistencia.
- [ ] ✍️ **Fuente de UI separada** para títulos/headers (Inter o Space Grotesk), manteniendo mono para tipeo/timer — jerarquía más profesional.
- [ ] ✍️ **Toggle de ligaduras** + ajuste de peso/espaciado por fuente.

### 11.2 Idiomas

- [ ] **Selector de idioma** (toolbar + atajo) con pool de palabras propio: **inglés** (default), **español**, **portugués** (3 por ahora). Persistencia en settings.
- [ ] ✍️ **Normalización de acentos** (es/pt): distinguir o ignorar tildes/ñ según preferencia.
- [ ] ✍️ **Modo práctica de acentos** para español: palabras con á/é/í/ó/ú/ñ.

### 11.3 Botones y controles

- [ ] **Rediseño de ToolBtn**: estilo pill, estados hover/pressed/active con glow sutil, transiciones consistentes.
- [ ] ✍️ **Sistema de variantes** unificado (primary/ghost/outline) reutilizado en header, toolbar y dialogs.
- [ ] ✍️ **Tooltips con delay** + micro-feedback (scale al presionar) en toggles.

### 11.4 Animaciones

- [ ] **Count-up animado** de WPM/accuracy en resultados.
- [ ] **Fade-in escalonado** de la pantalla de resultados (stats → charts).
- [ ] ✍️ **Transición entre estados** (idle→running→finished) y fade de overlays de pausa/reset.
- [ ] ✍️ **Shimmer/glow** en la barra de progreso y en la palabra activa.
- [ ] ✍️ Todo respetando `prefers-reduced-motion` (media query ya existente).

### 11.5 Extras (✍️ ideas propias)

- [ ] **Custom theme**: editor de colores (hue/lightness sliders) guardado en settings, sobre las paletas existentes.
- [ ] **Word accuracy** (palabras correctas vs total) además del accuracy por caracteres.
- [ ] **Gráfico de evolución de WPM** en el historial (mini line chart con `getHistory`).
- [ ] **Búsqueda en historial** (fecha/modo/opción) además de los filtros actuales.

---

## Orden de implementación sugerido (roadmap)

### Fase 0 – Base de calidad

1. [x] ESLint/Prettier + Husky + Convention Commits.
2. [x] Tests unit (Vitest) de `calcResults`, `getCharStatuses`, `generateWords`.
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
17. [ ] Backend/multiplayer (postergado a futuro, decisión separada).

### Fase 5 – Frontend polish (próxima)

18. [ ] Fuentes adicionales (mono self-hosted) + fuente de UI separada.
19. [ ] Idiomas (en/es/pt) + normalización de acentos.
20. [ ] Rediseño de botones (variantes, estados, tooltips).
21. [ ] Animaciones profesionales (count-up, fades, transiciones).
22. [ ] Custom theme + word accuracy + evolución de WPM en historial.

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
- A11y (sección 6): el timer usa `role="timer"` + `aria-label` (no se re-anuncia cada segundo; el arranque del test sí se anuncia vía live region polite con la duración). Sliders del panel de settings reenvían `id`/`aria-label` al thumb (`ui/slider.tsx`); filtros del historial con `aria-pressed`.
- Bugs encontrados por E2E: (1) `<main>` con `-mt-12` se superponía al header y bloqueaba los clicks de Settings/History/Stats/theme → fix `relative z-10` en el header; (2) `aria-label`/`id` de Radix Slider quedaban en el root y no en el thumb (`role="slider"` sin nombre) → forward explícito en `ui/slider.tsx`.
- E2E webkit: `page.keyboard.type` rápido pierde teclas → usar `{ delay: 10 }`; y esperar el auto-focus del input (`toBeFocused`) antes de blur en el test del atajo `d`.
- UX (sección 7): atajos de teclado (1-4, p, n, c, l, m) viven en un listener global de `window`, solo aplican en `idle` y con el foco fuera de elementos editables → "el tipeo siempre gana en el input" (fix de bug E2E donde la primera letra podía comerse el atajo, 24% de `COMMON_WORDS`). Pausa con Esc stashea el tiempo (`startTimeRef += now - pausedAt`) para excluirlo del conteo; overlay clickeable + input `readOnly`. `confirmRestart` (off por default) muestra overlay "restart? progress will be lost" solo si hay progreso. `strictMode` trunca el input y sacude la palabra (`.typer-strict-reject`) sin avanzar. Backspace correctivo → `.typer-fix-flash` (0.45s). Onboarding tooltip con localStorage `typerreflex-onboarded`. Botón `finish` en todas las modalidades mientras corre/pausado. Fix heatmap: espacios ya no se cuentan dos veces.
- Tests: Vitest + Testing Library en jsdom (`npm test`/`npm run test:watch`). Helpers de typing extraídos a `src/lib/typing.ts` (puros, testeables). En tests de `TypingTest` se mockean `generateWords`, `sound`, `history`, `stats` y el `ResultsScreen` lazy; **no usar fake timers** (cuelgan a user-event) — los intervalos reales de 200ms/1s no interfieren con asserts síncronos. `LONG_WORDS` exportado para testear el pool por membresía.
