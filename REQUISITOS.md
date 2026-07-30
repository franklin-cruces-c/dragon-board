# Requisitos

## Objetivo

Aplicación web de ajedrez presencial para dos jugadores en el mismo dispositivo. Debe ser sencilla, rápida, completamente estática y publicable en GitHub Pages.

## Requisitos funcionales

- Mostrar un tablero 8×8 adaptable.
- Jugar mediante selección por clic y permitir solo movimientos legales.
- Gestionar turnos, capturas, enroque, promoción, subpromoción y captura al paso.
- Detectar jaque, mate, ahogado, repetición, regla de 50 movimientos y material insuficiente.
- Bloquear movimientos y mantener la posición cuando termine la partida.
- Mostrar historial SAN con número, blancas y negras en una fila.
- Generar FEN y PGN.
- Reiniciar completamente la partida.
- Incorporar dos relojes configurables con incremento, pausa y tiempo por jugada.
- Exportar PGN, FEN y CSV.
- Funcionar en escritorio y móvil.

## Finalización visual

### Jaque

- Resaltar el rey atacado con naranja o rojo suave.
- Retirar el resaltado cuando desaparezca el jaque.
- Diferenciarlo claramente del jaque mate.

### Jaque mate

- Resaltar en rojo intenso al rey derrotado.
- Mantener visible la posición final y bloquear movimientos.
- Mostrar un modal accesible con título, resultado, motivo, ganador, perdedor, colores y puntuación.
- Victoria: 1 punto para el ganador y 0 para el perdedor.
- Blancas ganadoras: `1-0`; negras ganadoras: `0-1`.

### Tablas

- Resultado oficial: `½-½`.
- Blancas y negras reciben 0,5 puntos.
- Mostrar la causa concreta: ahogado, repetición, regla de 50 movimientos, material insuficiente u otra admitida.

### Comportamiento del modal

- Incluir “Revisar posición” y “Nueva partida”.
- Permitir cerrar con el botón o Escape.
- Gestionar el foco y usar `role="dialog"`, `aria-modal="true"` y título asociado.
- No utilizar `alert()`, `confirm()` ni `prompt()` para el resultado.
- Cerrar no modifica tablero, historial ni resaltado.
- Nueva partida limpia tablero, chess.js, historial, estado, resultado, selección, modal, FEN, PGN y, cuando existan, relojes.
- La finalización debe poder ampliarse a tiempo, abandono y acuerdo de tablas.

## Requisitos técnicos

- HTML, CSS y JavaScript.
- Aplicación estática, sin backend, base de datos, API propia ni servidor de aplicación.
- Sin compilación necesaria en producción.
- Compatible con GitHub Pages y con `file://` en Chrome.
- chess.js como motor de reglas, almacenado localmente y con licencia documentada.
- Dependencias adicionales solo si aportan una mejora real.
- Exportaciones en el navegador mediante `Blob`.
- Relojes basados en `performance.now()`.
- Código legible, organizado y mantenible.

## Experiencia de usuario

- Uso rápido y sencillo durante una partida presencial.
- Botones claros, grandes y adaptables.
- Turno, jaque y finalización visibles.
- Historial fácil de leer.
- Modal legible en escritorio y móvil.
- Confirmación antes de futuras acciones destructivas.

## Fuera de alcance del MVP

- Backend, usuarios, inicio de sesión y base de datos.
- Juego en línea, emparejamiento y chat.
- Servidor de partidas.
- Aplicación móvil nativa.

## Criterios generales de aceptación

El MVP estará terminado cuando:

- Todos los movimientos ordinarios y especiales sean legales y estén representados en SAN.
- Se detecten y comuniquen correctamente jaque, mate y todas las causas de tablas.
- El historial guarde los datos completos de cada media jugada.
- Los dos relojes funcionen con incremento, pausa y caída de bandera.
- PGN, FEN y CSV puedan descargarse sin servidor.
- Reiniciar limpie todo el estado de la partida.
- La interfaz sea utilizable con ratón, teclado y pantalla móvil.
- Las pruebas de reglas, tiempo, accesibilidad, `file://` y GitHub Pages resulten satisfactorias.
