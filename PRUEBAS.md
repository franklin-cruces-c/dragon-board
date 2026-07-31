# Pruebas de Dragon Board

Este documento separa la validación técnica reproducible de la validación
visual realizada en Chrome o móvil.

## Confirmaciones operativas

- La aplicación está publicada en GitHub Pages.
- La aplicación publicada fue abierta desde un móvil.
- El diseño adaptable está implementado.

Estas confirmaciones demuestran publicación y acceso, pero no sustituyen las
pruebas visuales formales ni sus evidencias.

## Pruebas técnicas automatizadas

### Runner

- `tests/technical.html`
- `tests/technical-tests.js`

El runner está separado del código de producción. Carga la misma versión local
de `vendor/chess.js` y la integración real de `script.js`. Puede ejecutarse
directamente mediante `file://` en Chromium.

### Última ejecución

- Entorno: Chromium headless, aplicación abierta mediante `file://`.
- Total: 46.
- PASAN: 46.
- FALLAN: 0.
- NO EJECUTABLES: 0.

| Prueba | Resultado |
| --- | --- |
| Movimientos legales | PASA |
| Movimientos ilegales | PASA |
| Capturas | PASA |
| SAN | PASA |
| FEN | PASA |
| PGN | PASA |
| FEN y PGN internos | PASA |
| FEN y PGN fuera de la vista principal | PASA |
| Enroque corto | PASA |
| Enroque largo | PASA |
| Captura al paso | PASA |
| Promoción | PASA |
| Subpromoción | PASA |
| Jaque | PASA |
| Jaque mate | PASA |
| Regresión de jaque mate, SAN y modal | PASA |
| Accesibilidad y cierre con Escape del modal de mate | PASA |
| Ahogado | PASA |
| Triple repetición | PASA |
| Regla de 50 movimientos | PASA |
| Material insuficiente | PASA |
| Bloqueo después de finalizar | PASA |
| Elementos DOM de las piezas | PASA |
| Estilo sólido predeterminado y datos inválidos | PASA |
| Cambio a piezas huecas sin alterar la partida | PASA |
| Persistencia del estilo de piezas | PASA |
| Fallo de escritura sin romper la sesión | PASA |
| Reinicio completo | PASA |
| Reloj preparado 10+5 | PASA |
| Inicio automático solo con selección blanca válida | PASA |
| Descuento, incremento Fischer y cambio de turno | PASA |
| Intento ilegal no cambia el reloj | PASA |
| Pausa y reanudación excluyen tiempo pausado | PASA |
| Protección ante suspensión del navegador | PASA |
| Configuración ausente o inválida recupera 10+5 | PASA |
| Persistencia unificada y última configuración válida | PASA |
| Aplicar configuración y conservarla en Nueva partida | PASA |
| Destinos posibles deshabilitados por defecto | PASA |
| Registro estructurado e historial de cinco columnas | PASA |
| Bloqueo durante pausa | PASA |
| Mate detiene relojes y habilita Lichess | PASA |
| Posibilidad de mate tras bandera: casos exactos | PASA |
| Posibilidad de mate: certificado y resolución arbitral | PASA |
| Posibilidad de mate: material y casos límite | PASA |
| Caída de bandera indeterminada solicita resolución arbitral | PASA |
| URL de Lichess con PGN completo codificado | PASA |

### Corrección verificada

La primera ejecución detectó que `resetGame()` ocultaba el modal pero conservaba
internamente el resumen, código, ganador, perdedor y motivo de la partida
anterior. Se corrigió `script.js` para limpiar esos campos. Después de la
corrección, la batería completa obtuvo 19 de 19 pruebas superadas. La posterior
actualización visual añadió tres pruebas sobre FEN y PGN internos, su retirada
de la vista principal y los elementos DOM de las piezas. La batería actual
añade además regresión completa de mate, accesibilidad del modal, estilos de
piezas y persistencia. La etapa de relojes añade dieciocho pruebas sobre
inicio automático, medición, incremento, pausas, suspensión, configuración,
historial, caída de bandera y Lichess. Obtiene 46 de 46 pruebas superadas.

## Pruebas visuales pendientes

Estas pruebas no bloquean el avance funcional. No se marcarán como superadas
hasta recibir confirmación expresa o una captura del usuario.

| ID | Validación | Estado | Fecha | Dispositivo | Navegador | Resultado informado | Captura o referencia |
| --- | --- | --- | --- | --- | --- | --- | --- |
| V-01 | Color y claridad del jaque | PENDIENTE | — | — | — | — | — |
| V-02 | Diferenciación visual entre jaque y mate | PENDIENTE | — | — | — | — | — |
| V-03 | Rojo intenso del rey derrotado | PENDIENTE | — | — | — | — | — |
| V-04 | Aspecto y accesibilidad perceptible del modal | PENDIENTE | — | — | — | — | — |
| V-05 | Cierre del modal y revisión de posición | PENDIENTE | — | — | — | — | — |
| V-06 | Legibilidad del historial | PENDIENTE | — | — | — | — | — |
| V-07 | Adaptación móvil | PENDIENTE | — | — | — | — | — |
| V-08 | Comodidad de interacción táctil | PENDIENTE | — | — | — | — | — |
| V-09 | Claridad visual del bloqueo al finalizar | PENDIENTE | — | — | — | — | — |
| V-10 | Nueva partida y limpieza visual | PENDIENTE | — | — | — | — | — |
| V-11 | Enroque corto visible | PENDIENTE | — | — | — | — | — |
| V-12 | Enroque largo visible | PENDIENTE | — | — | — | — | — |
| V-13 | Captura normal visible | PENDIENTE | — | — | — | — | — |
| V-14 | Otras situaciones visibles | PENDIENTE | — | — | — | — | — |
| V-15 | Contraste e integración del tema oscuro | PENDIENTE | — | — | — | — | — |
| V-16 | Contraste de piezas blancas en ambas casillas | PENDIENTE | — | — | — | — | — |
| V-17 | Paneles y modales sin superficies blancas | PENDIENTE | — | — | — | — | — |
| V-18 | Fondo visible durante el scroll | PENDIENTE | — | — | — | — | — |
| V-19 | Contraste del estilo sólido | PENDIENTE | — | — | — | — | — |
| V-20 | Contraste del estilo hueco | PENDIENTE | — | — | — | — | — |
| V-21 | Selector de promoción en ambos estilos | PENDIENTE | — | — | — | — | — |
| V-22 | Legibilidad y estado activo de ambos relojes | PENDIENTE | — | — | — | — | — |
| V-23 | Modal de configuración en móvil | PENDIENTE | — | — | — | — | — |
| V-24 | Historial de cinco columnas en móvil | PENDIENTE | — | — | — | — | — |
| V-25 | Pausa, reanudación y caída de bandera visibles | PENDIENTE | — | — | — | — | — |
| V-26 | Modal de resultado por tiempo y resolución arbitral | PENDIENTE | — | — | — | — | — |
| V-27 | Apertura de la partida finalizada en Lichess | PENDIENTE | — | — | — | — | — |

## Registro de evidencias

Cuando se reciba una captura:

1. Se relacionará con el identificador de prueba correspondiente.
2. Se comprobará qué elementos aparecen realmente en la imagen.
3. Se registrarán fecha, dispositivo, navegador y resultado informado.
4. Solo con autorización se actualizarán este documento y el estado relacionado
   de `PLAN_DESARROLLO.md`.
