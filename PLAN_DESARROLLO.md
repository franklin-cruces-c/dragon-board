# Plan de desarrollo

Estados: `[x]` completado e inspeccionado; `[ ]` pendiente o pendiente de validación manual.

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

### Estado actual

Completado y revisado visualmente en Chrome por el usuario.

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
- [ ] Validar manualmente jaque y jaque mate.
- [ ] Validar manualmente enroque.
- [ ] Validar manualmente promoción y subpromoción.
- [ ] Validar manualmente captura al paso.
- [ ] Validar manualmente ahogado, repetición, regla de 50 movimientos y material insuficiente.
- [x] Impedir movimientos después del final.
- [x] Generar FEN y PGN.
- [x] Reiniciar la partida.

### Estado actual

Implementado; permanecen pendientes las pruebas manuales señaladas.

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
- [ ] Preparar campos de tiempo por jugada.

### Estado actual

Presentación completada; estructura detallada pendiente.

### Dependencias

Etapa 2 y futura etapa de relojes.

### Criterios de aceptación

- Cada media jugada conserva todos los campos requeridos.
- El historial visual y el PGN coinciden.
- La última jugada queda visible automáticamente.

### Prueba

Jugar capturas y promociones, e inspeccionar los registros y su FEN resultante.

## 4. Relojes

### Objetivo

Incorporar dos relojes para una partida presencial.

### Tareas

- [ ] Configurar tiempo inicial e incremento.
- [ ] Mantener dos relojes con `performance.now()`.
- [ ] Registrar el tiempo consumido por jugada.
- [ ] Cambiar el reloj solo tras un movimiento legal.
- [ ] Evitar cambios dobles o incorrectos.
- [ ] Pausar y reanudar.
- [ ] Detener al reiniciar, finalizar o agotarse el tiempo.
- [ ] Señalar claramente el reloj activo.

### Estado actual

Pendiente.

### Dependencias

Etapas 2 y 3 validadas.

### Criterios de aceptación

- Los relojes conservan precisión al cambiar de turno.
- El incremento se aplica una sola vez.
- Pausa, reinicio y final detienen el consumo.

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

### Estado actual

Pendiente; FEN y PGN solo se muestran en pantalla.

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

- [ ] Validar visualmente el resaltado del rey en jaque.
- [ ] Validar visualmente la diferenciación entre jaque y mate.
- [ ] Validar el rojo intenso del rey derrotado.
- [x] Mantener la posición final y bloquear movimientos.
- [ ] Validar el modal de jaque mate, resultado, colores y puntos.
- [ ] Validar cierre del modal sin alterar la posición.
- [ ] Validar “Nueva partida”.
- [ ] Ampliar el modal a tablas.
- [ ] Contemplar posteriormente tiempo y abandono.

### Estado actual

Implementación de jaque mate terminada; pendiente de validación manual. Las tablas todavía no abren el modal.

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

- [ ] Validar jaque, mate y todas las tablas.
- [ ] Gestionar tiempo agotado.
- [ ] Confirmar acciones destructivas.
- [ ] Probar enroque, promoción, captura al paso y todos los finales.
- [ ] Revisar accesibilidad.
- [ ] Revisar diseño móvil.
- [ ] Revisar apertura directa mediante `file://`.
- [ ] Preparar GitHub Pages.

### Estado actual

Pendiente.

### Dependencias

Todas las etapas funcionales anteriores.

### Criterios de aceptación

- Se superan las pruebas funcionales y de accesibilidad.
- La misma versión funciona mediante `file://` y GitHub Pages.

### Prueba

Ejecutar la matriz completa en escritorio, móvil y GitHub Pages.
