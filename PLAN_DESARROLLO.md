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
- [x] Añadir el control visible de estilo al modal de configuración.
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

Implementado y validado técnicamente dentro de una batería reproducible de 46
pruebas: 46 pasan, 0 fallan y 0 no ejecutables. El runner está en
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
- [x] Guardar SAN, origen, destino, color, número, pieza, captura, promoción y FEN resultante.

### Estado actual

Presentación y estructura detallada completadas. Cada registro incluye también
tiempo consumido, tiempo restante e incremento aplicado.

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

- [x] Configurar tiempo inicial e incremento, con 10+5 de fábrica.
- [x] Persistir la última configuración válida en `localStorage`.
- [x] Mantener el tiempo restante de blancas y negras.
- [x] Mantener ambos relojes detenidos al abrir o iniciar una nueva partida.
- [x] Iniciar el reloj blanco con la primera selección válida de una pieza blanca propia que tenga movimientos legales.
- [x] Medir cada turno con `performance.now()` como referencia monotónica.
- [x] Medir la primera jugada blanca desde esa selección válida hasta que chess.js acepte el movimiento.
- [x] Medir los turnos posteriores desde el movimiento legal del rival hasta que chess.js acepte el movimiento propio.
- [x] Excluir las pausas del tiempo consumido.
- [x] Completar el registro base de jugadas con los campos temporales.
- [x] Registrar el tiempo consumido por jugada.
- [x] Registrar el tiempo restante y el incremento aplicado por media jugada.
- [x] Evolucionar la presentación a cinco columnas: número, jugada blanca, tiempo blanco, jugada negra y tiempo negro.
- [x] Cambiar el reloj solo tras un movimiento legal.
- [x] Evitar cambios dobles o incorrectos.
- [x] Pausar y reanudar.
- [x] Aplicar el incremento configurado una sola vez tras cada movimiento legal.
- [x] Detener al iniciar una nueva partida, finalizar por reglas o agotarse el tiempo.
- [x] Finalizar la partida por caída de bandera.
- [x] Resolver automáticamente los casos de mate posible o imposible demostrables y solicitar resolución arbitral en los demás.
- [x] Señalar claramente el reloj activo.
- [x] Mantener precisión al cambiar de pestaña o bloquearse la pantalla sin depender de intervalos acumulativos.
- [x] Adaptar configuración, relojes y controles a móvil.

### Estado actual

Implementado y validado técnicamente. La actualización visual de los relojes se
separa del cálculo temporal, que combina `performance.now()` con una referencia
civil auxiliar para detectar suspensiones. La posibilidad de mate tras caída de
bandera se resuelve automáticamente solo cuando puede probarse con certeza; las
posiciones no demostradas por la búsqueda acotada requieren decisión arbitral.

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
- [x] Proponer y aprobar el mecanismo de “Abrir en Lichess”.
- [x] Añadir “Abrir en Lichess” para trasladar el PGN de la partida finalizada al análisis, sin backend.

### Estado actual

Parcial. La apertura en el análisis de Lichess está implementada para partidas
finalizadas mediante una URL con el PGN codificado. Las descargas y copias de
PGN, FEN y CSV continúan pendientes.

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
- [x] Ampliar el modal a tablas.
- [x] Ampliar el modal a finalización por tiempo y resolución arbitral.
- [ ] Contemplar posteriormente abandono.

### Estado actual

Implementación técnica de mate, tablas y tiempo validada. La validación visual
permanece pendiente y no bloqueante.

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
- [x] Gestionar tiempo agotado.
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

Parcial. La batería técnica actual de 46 pruebas pasa por completo, GitHub Pages está
publicado y la aplicación ya fue abierta desde un móvil. Siguen pendientes los
formatos de exportación y las validaciones visuales y de accesibilidad
registradas en `PRUEBAS.md`.

### Dependencias

Todas las etapas funcionales anteriores.

### Criterios de aceptación

- Se superan las pruebas funcionales y de accesibilidad.
- La misma versión funciona mediante `file://` y GitHub Pages.

### Prueba

Ejecutar la matriz completa en escritorio, móvil y GitHub Pages.
