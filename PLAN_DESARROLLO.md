# Plan de desarrollo

Estados: `[x]` completado y validado técnicamente; `[ ]` pendiente. Las
validaciones visuales se registran por separado en `PRUEBAS.md` y no bloquean el
avance funcional salvo que revelen un defecto.

## 1. Estabilizar la interfaz

### Objetivo

Conseguir una interfaz básica funcional y coherente antes de sustituir el motor manual.

### Tareas

- [x] Corregir la cuadrícula 8×8.
- [x] Corregir la orientación del tablero.
- [x] Corregir la correspondencia entre casillas DOM y coordenadas algebraicas.
- [x] Consolidar `script.js` y eliminar `script_fixed.js`.
- [x] Mantener la selección de piezas mediante clic.
- [x] Mostrar blancas y negras en una misma fila.
- [x] Mantener tres columnas: número, blancas y negras.
- [x] Adaptar el tablero a escritorio y móvil.
- [x] Confirmar que la aplicación publicada es accesible desde un móvil.
- [x] Integrar la interfaz con los fondos mediante un tema oscuro adaptable.
- [x] Representar las piezas como elementos propios y reforzar el contraste de las blancas.
- [x] Usar piezas Unicode sólidas como estilo predeterminado.
- [x] Preparar el estilo alternativo de piezas huecas y persistir la preferencia.
- [ ] Añadir el control visible de estilo al futuro modal de configuración.
- [x] Reorganizar estado, historial y controles en paneles compactos.

### Estado actual

El diseño adaptable está implementado y la aplicación publicada ya fue abierta
desde un móvil. La validación visual móvil formal con evidencia permanece
pendiente en `PRUEBAS.md`.

### Dependencias

Ninguna.

### Criterios de aceptación

- El tablero contiene 64 casillas y conserva su proporción.
- Blancas y negras aparecen en su orientación habitual.
- Cada turno completo ocupa una fila del historial.
- La interfaz no desborda en móvil.

### Prueba

Abrir `index.html`, jugar varias medias jugadas, redimensionar la ventana y reiniciar.

## 2. Introducir chess.js

### Objetivo

Convertir chess.js en la única fuente de verdad de la partida.

### Tareas

- [x] Integrar chess.js 1.4.0 localmente y documentar su licencia.
- [x] Mantener apertura mediante `file://` en Chrome y compatibilidad con GitHub Pages.
- [x] No requerir Node.js, npm, backend ni compilación en producción.
- [x] Renderizar desde `Chess.board()`.
- [x] Obtener destinos con `moves()` y ejecutar con `move()`.
- [x] Gestionar turnos, capturas y SAN.
- [x] Conservar directamente la SAN de chess.js, incluido `#` en jaque mate.
- [x] Validar técnicamente jaque y jaque mate.
- [x] Validar técnicamente enroque corto y largo.
- [x] Validar técnicamente promoción y subpromoción.
- [x] Validar técnicamente captura al paso.
- [x] Validar técnicamente ahogado, repetición, regla de 50 movimientos y material insuficiente.
- [x] Impedir movimientos después del final.
- [x] Generar FEN y PGN.
- [x] Mantener FEN y PGN actualizados internamente sin mostrarlos permanentemente.
- [x] Reiniciar la partida.
- [x] Limpiar también los datos internos del resultado al reiniciar.

### Estado actual

Implementado y validado técnicamente mediante una batería reproducible de 28
pruebas: 28 pasan, 0 fallan y 0 no ejecutables. El runner está en
`tests/technical.html` y `tests/technical-tests.js`.

Las pruebas visuales de colores de jaque y mate, modal, historial, adaptación
móvil, interacción táctil, bloqueo, nueva partida, enroques y otras situaciones
visibles permanecen pendientes y no bloquean el avance. Se registrarán con sus
evidencias en `PRUEBAS.md`.

### Dependencias

chess.js 1.4.0 local, BSD-2-Clause, en `vendor/`.

### Criterios de aceptación

- Ningún movimiento ilegal puede ejecutarse.
- SAN, FEN y PGN proceden de chess.js.
- Las reglas especiales se ejecutan correctamente.
- La partida queda bloqueada al finalizar.

### Prueba

Probar movimientos ilegales, mate del pastor, enroque, promoción, captura al paso y posiciones de tablas.

## 3. Historial fiable

### Objetivo

Registrar cada media jugada con información suficiente para mostrarla y exportarla.

### Tareas

- [x] Mostrar blancas y negras por número.
- [x] Usar SAN y PGN generados por chess.js.
- [x] Mantener desplazamiento automático.
- [ ] Guardar SAN, origen, destino, color, número, pieza, captura, promoción y FEN resultante.

### Estado actual

Presentación actual completada; estructura ajedrecística detallada pendiente.
Esta estructura base se implementará antes o durante la integración inicial de
los relojes. Los campos temporales se incorporarán dentro de la etapa 4.

### Dependencias

Etapa 2. La estructura base no depende de los relojes.

### Criterios de aceptación

- Cada media jugada conserva todos los campos requeridos.
- El historial visual y el PGN coinciden.
- La última jugada queda visible automáticamente.

### Prueba

Jugar capturas y promociones, e inspeccionar los registros y su FEN resultante.

## 4. Relojes — prioridad funcional

### Objetivo

Incorporar la funcionalidad principal y diferenciadora de Dragon Board: dos
relojes presenciales, tiempos exactos por jugada y su integración con el
historial.

### Tareas

- [ ] Configurar tiempo inicial e incremento.
- [ ] Mantener el tiempo restante de blancas y negras.
- [ ] Mantener ambos relojes detenidos al abrir o iniciar una nueva partida.
- [ ] Iniciar el reloj blanco con la primera selección válida de una pieza blanca propia que tenga movimientos legales.
- [ ] Medir cada turno con `performance.now()` como referencia monotónica.
- [ ] Medir la primera jugada blanca desde esa selección válida hasta que chess.js acepte el movimiento.
- [ ] Medir los turnos posteriores desde el movimiento legal del rival hasta que chess.js acepte el movimiento propio.
- [ ] Excluir las pausas del tiempo consumido.
- [ ] Completar el registro base de jugadas con los campos temporales.
- [ ] Registrar el tiempo consumido por jugada.
- [ ] Registrar el tiempo restante y el incremento aplicado por media jugada.
- [ ] Evolucionar la presentación a cinco columnas: número, jugada blanca, tiempo blanco, jugada negra y tiempo negro.
- [ ] Cambiar el reloj solo tras un movimiento legal.
- [ ] Evitar cambios dobles o incorrectos.
- [ ] Pausar y reanudar.
- [ ] Aplicar el incremento configurado una sola vez tras cada movimiento legal.
- [ ] Detener al iniciar una nueva partida, finalizar por reglas o agotarse el tiempo.
- [ ] Finalizar la partida por caída de bandera.
- [ ] Señalar claramente el reloj activo.
- [ ] Mantener precisión al cambiar de pestaña o bloquearse la pantalla sin depender de intervalos acumulativos.
- [ ] Adaptar configuración, relojes y controles a móvil.

### Estado actual

Pendiente.

### Dependencias

Etapa 2 y estructura base del registro detallado de la etapa 3. La etapa no
depende de que los campos temporales ya existan: esos campos forman parte de la
propia integración de los relojes.

### Criterios de aceptación

- Los relojes conservan precisión al cambiar de turno y al suspenderse la actualización visual.
- El incremento se aplica una sola vez.
- Pausa, nueva partida y final detienen el consumo.
- Cada media jugada conserva tiempo consumido, restante e incremento aplicado.
- La caída de bandera produce un resultado final coherente y bloquea el tablero.

### Prueba

Jugar con tiempos cortos, pausar, reanudar y provocar caída de bandera.

## 5. Exportaciones

### Objetivo

Obtener los datos completos sin servidor.

### Tareas

- [ ] Exportar PGN con cabeceras.
- [ ] Evaluar tiempos en comentarios PGN.
- [ ] Exportar FEN.
- [ ] Exportar CSV por media jugada.
- [ ] Descargar mediante `Blob` y `URL.createObjectURL()`.
- [ ] Permitir copiar datos cuando corresponda.
- [ ] Mantener funcionamiento sin backend.
- [ ] Proponer y aprobar el mecanismo de “Abrir en Lichess”.
- [ ] Añadir posteriormente “Abrir en Lichess” para trasladar la posición o partida actual al análisis, sin backend.

### Estado actual

Pendiente; FEN y PGN solo se muestran en pantalla. “Abrir en Lichess” es un
requisito futuro y no se implementará hasta aprobar su mecanismo concreto.

### Dependencias

Etapas 3 y 4.

### Criterios de aceptación

- Cada formato se genera íntegramente en el navegador.
- Los archivos descargados reproducen los datos visibles.

### Prueba

Descargar los tres formatos y validar su contenido.

## 6. Finalización visual de la partida

### Objetivo

Comunicar claramente cuándo y por qué terminó la partida.

### Tareas

- [ ] Validar visualmente el resaltado del rey en jaque mediante evidencia.
- [ ] Validar visualmente la diferenciación entre jaque y mate mediante evidencia.
- [ ] Validar el rojo intenso del rey derrotado mediante evidencia.
- [x] Mantener la posición final y bloquear movimientos.
- [x] Validar técnicamente el modal de mate mediante interacción real, SAN con `#`, foco y Escape.
- [ ] Validar visualmente el modal de jaque mate, resultado, colores y puntos.
- [ ] Validar visualmente el cierre del modal sin alterar la posición.
- [ ] Validar visualmente “Nueva partida”.
- [x] Cambiar el texto exterior “Reiniciar Partida” por “Nueva partida”.
- [x] Usar “Nueva partida” de forma consistente en toda la interfaz.
- [ ] Ampliar el modal a tablas.
- [ ] Contemplar posteriormente tiempo y abandono.

### Estado actual

Implementación y comportamiento técnico de jaque mate validados. La validación
visual permanece pendiente y no bloqueante. Las tablas todavía no abren el
modal.

### Dependencias

Etapa 2.

### Criterios de aceptación

- El rey en jaque y el rey en mate tienen señales distintas.
- El modal aparece una sola vez y gestiona el foco.
- Cerrar conserva posición, historial y resaltado.
- Nueva partida limpia todo.

### Prueba

Ejecutar un jaque normal y el mate del pastor; cerrar el modal y comenzar otra partida.

## 7. Robustez y publicación

### Objetivo

Preparar un MVP fiable y publicable.

### Tareas

- [x] Validar técnicamente jaque, mate y todas las tablas automáticas contempladas.
- [ ] Gestionar tiempo agotado.
- [ ] Confirmar acciones destructivas.
- [x] Probar técnicamente enroque, promoción, captura al paso y todos los finales.
- [ ] Revisar accesibilidad.
- [x] Implementar diseño adaptable para móvil.
- [x] Confirmar acceso a la aplicación publicada desde un móvil.
- [ ] Validar visualmente el diseño móvil con evidencias.
- [x] Ejecutar la batería técnica mediante `file://` en Chromium.
- [ ] Revisar visualmente la apertura directa mediante `file://`.
- [x] Publicar en GitHub Pages.

### Estado actual

Parcial. La batería técnica actual de 28 pruebas pasa por completo, GitHub Pages está
publicado y la aplicación ya fue abierta desde un móvil. Siguen pendientes los
relojes, las exportaciones y las validaciones visuales y de accesibilidad
registradas en `PRUEBAS.md`.

### Dependencias

Todas las etapas funcionales anteriores.

### Criterios de aceptación

- Se superan las pruebas funcionales y de accesibilidad.
- La misma versión funciona mediante `file://` y GitHub Pages.

### Prueba

Ejecutar la matriz completa en escritorio, móvil y GitHub Pages.
