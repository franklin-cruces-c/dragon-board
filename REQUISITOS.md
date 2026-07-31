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
- Evolucionar el historial a cinco columnas: número, jugada blanca, tiempo
  consumido por blancas, jugada negra y tiempo consumido por negras.
- Generar y actualizar internamente FEN y PGN sin mostrarlos permanentemente en
  la interfaz principal.
- Iniciar una “Nueva partida” que limpie completamente todo el estado anterior.
- Incorporar dos relojes configurables con incremento, pausa y tiempo por jugada.
- Mostrar en todo momento el tiempo restante de blancas y negras.
- Registrar independientemente el tiempo exacto consumido por cada jugada blanca y negra.
- Finalizar la partida por caída de bandera.
- Exportar PGN, FEN y CSV.
- Abrir el PGN de una partida finalizada en el análisis de Lichess sin backend.
- Funcionar en escritorio y móvil.
- Usar por defecto piezas Unicode sólidas cuyo color visual dependa del bando.
- Permitir alternativamente piezas blancas huecas clásicas, conservando negras sólidas.
- Persistir en una única preferencia versionada la configuración válida del
  reloj, el estilo de piezas y la visualización de destinos posibles.

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
- “Nueva partida” debe usarse de forma consistente en la interfaz, el modal y la documentación.
- Nueva partida limpia tablero, chess.js, historial, estado, resultado, selección,
  resaltados, promoción pendiente, modal, FEN, PGN, relojes y tiempos por jugada.
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
- No existe un botón “Iniciar” para los relojes.
- Al abrir o iniciar una nueva partida, ambos relojes permanecen preparados y detenidos.
- El reloj blanco comienza con la primera selección válida de una pieza blanca
  propia que tenga al menos un movimiento legal.
- La primera jugada blanca se mide desde esa selección hasta que chess.js acepta
  el movimiento; después se descuenta su tiempo, se aplica el incremento y
  comienza el reloj negro.
- Los turnos posteriores se miden desde el movimiento legal del rival hasta que
  chess.js acepta el movimiento propio.
- Las pausas quedan excluidas del tiempo consumido.
- El incremento se aplica una sola vez después de cada movimiento legal.
- El cálculo del tiempo restante debe derivarse de marcas temporales monotónicas,
  no de acumular intervalos, para conservar precisión al cambiar de pestaña o
  bloquearse la pantalla.
- Cada media jugada conserva internamente número, color, SAN, origen, destino,
  pieza, captura, promoción y FEN resultante como estructura base. La etapa de
  relojes completa esa estructura con tiempo consumido, tiempo restante e
  incremento aplicado.
- “Abrir en Lichess” usa el PGN completo codificado en una URL de análisis,
  únicamente al finalizar la partida y sin enviar otros datos desde la aplicación.
- La caída de bandera concede la victoria si puede demostrarse una secuencia
  legal posible de mate para el rival y concede tablas si se demuestra que tal
  mate es imposible. Los casos que no pueda decidir con certeza la búsqueda
  acotada requieren una resolución arbitral explícita.
- La configuración de fábrica es 10 minutos con 5 segundos de incremento
  Fischer. La última configuración válida aplicada se conserva en
  `localStorage` con la clave versionada `dragon-board.settings.v1`.
- No se persisten posición, historial, reloj en curso, pausa ni resultado.
- Los estilos internos de piezas admitidos son `solid` y `outline`; cualquier
  preferencia ausente, inválida o ilegible recupera `solid`.
- El cambio de estilo vuelve a representar tablero y promoción sin alterar
  posición, SAN, FEN, PGN, historial, selección, resaltados ni resultado.
- El modal de configuración permite elegir el estilo y activar opcionalmente
  los destinos posibles, que están deshabilitados por defecto.
- Código legible, organizado y mantenible.

## Experiencia de usuario

- Uso rápido y sencillo durante una partida presencial.
- Botones claros, grandes y adaptables.
- Usar “Nueva partida”, no “Reiniciar Partida”, para la acción que comienza desde cero.
- Turno, jaque y finalización visibles.
- Historial fácil de leer.
- FEN y PGN no ocupan espacio permanente durante la partida; se ofrecerán
  posteriormente mediante acciones compactas de exportación o copia.
- Relojes, configuración y controles utilizables en móvil y mediante interacción táctil.
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
- Nueva partida limpia todo el estado de la partida.
- La interfaz sea utilizable con ratón, teclado y pantalla móvil.
- Las pruebas de reglas, tiempo, accesibilidad, `file://` y GitHub Pages resulten satisfactorias.

## Estrategia de validación

- Las reglas, SAN, FEN y PGN internos, finales, bloqueo y reinicio se validan mediante
  pruebas técnicas reproducibles separadas del código de producción.
- Las pruebas visuales se registran por separado y requieren confirmación
  expresa o evidencia aportada por el usuario.
- Las pruebas visuales pendientes no bloquean el avance funcional, pero deben
  completarse antes de considerar terminado el MVP.
- Ninguna prueba visual se marca como superada sin confirmación o captura.
- La publicación en GitHub Pages y el acceso desde móvil son hechos operativos
  confirmados; no sustituyen la validación visual formal con evidencias.
- El diseño adaptable implementado se distingue de su validación visual en
  dispositivos concretos.
- El estado y las evidencias se mantienen en `PRUEBAS.md`.
