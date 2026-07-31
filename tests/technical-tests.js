/* global Chess, ClockManager, DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY,
PIECE_SYMBOLS, PIECE_STYLE_STORAGE_KEY, activePieceStyle, assessMatingPossibility,
buildLichessUrl, clock, game, gameData, loadPieceStyle, loadSettings, makeMove,
handleTimeout, moveRecords, pauseOrResume, persistPieceStyle, persistSettings, resetGame,
resultModalShown, setPieceStyle, settings, updateInterface */

(() => {
    'use strict';

    const results = [];

    function assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    function equal(actual, expected, label) {
        if (actual !== expected) {
            throw new Error(`${label}: esperado ${JSON.stringify(expected)}, obtenido ${JSON.stringify(actual)}`);
        }
    }

    function play(chess, moves) {
        return moves.map((move) => chess.move(move));
    }

    function clickMove(from, to) {
        document.querySelector(`[data-square="${from}"]`).click();
        document.querySelector(`[data-square="${to}"]`).click();
    }

    function test(name, callback) {
        try {
            callback();
            results.push({ name, status: 'PASA', detail: '' });
        } catch (error) {
            results.push({ name, status: 'FALLA', detail: error.message });
        }
    }

    function renderResults() {
        const body = document.getElementById('test-results');
        const passed = results.filter((result) => result.status === 'PASA').length;
        const failed = results.length - passed;

        results.forEach((result) => {
            const row = document.createElement('tr');
            const name = document.createElement('td');
            const status = document.createElement('td');
            const detail = document.createElement('td');

            name.textContent = result.name;
            status.textContent = result.status;
            status.className = result.status === 'PASA' ? 'pass' : 'fail';
            detail.textContent = result.detail;
            row.append(name, status, detail);
            body.appendChild(row);
        });

        document.getElementById('test-summary').textContent =
            `${passed}/${results.length} pasan; ${failed} fallan.`;
    }

    document.addEventListener('DOMContentLoaded', () => {
        test('Movimientos legales', () => {
            const chess = new Chess();
            const destinations = chess.moves({ square: 'e2', verbose: true }).map((move) => move.to).sort();
            equal(destinations.join(','), 'e3,e4', 'destinos legales de e2');
            const move = chess.move({ from: 'e2', to: 'e4' });
            equal(move.san, 'e4', 'SAN');
            equal(chess.turn(), 'b', 'turno posterior');
        });

        test('Movimientos ilegales', () => {
            const chess = new Chess();
            const before = chess.fen();
            let rejected = false;
            try {
                chess.move({ from: 'e2', to: 'e5' });
            } catch {
                rejected = true;
            }
            assert(rejected, 'e2-e5 no fue rechazado');
            equal(chess.fen(), before, 'FEN tras el rechazo');
            equal(chess.history().length, 0, 'historial tras el rechazo');
            equal(chess.turn(), 'w', 'turno tras el rechazo');
        });

        test('Capturas', () => {
            const chess = new Chess();
            play(chess, ['e4', 'd5']);
            const capture = chess.move('exd5');
            equal(capture.san, 'exd5', 'SAN de captura');
            equal(capture.captured, 'p', 'pieza capturada');
            equal(chess.get('d5').color, 'w', 'pieza en d5');
            equal(chess.get('e4'), undefined, 'casilla de origen');
        });

        test('SAN', () => {
            const chess = new Chess();
            play(chess, ['e4', 'd5', 'exd5', 'Nf6', 'Bb5+', 'c6']);
            const sans = chess.history();
            equal(sans.join(' '), 'e4 d5 exd5 Nf6 Bb5+ c6', 'secuencia SAN');
        });

        test('FEN', () => {
            const chess = new Chess();
            chess.move('e4');
            equal(
                chess.fen(),
                'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
                'FEN después de e4'
            );
        });

        test('PGN', () => {
            const chess = new Chess();
            play(chess, ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5']);
            assert(
                chess.pgn().endsWith('1. e4 e5 2. Nf3 Nc6 3. Bb5 *'),
                `PGN inesperado: ${JSON.stringify(chess.pgn())}`
            );
        });

        test('FEN y PGN internos', () => {
            resetGame();
            equal(gameData.fen, game.fen(), 'FEN inicial interno');
            equal(gameData.pgn, game.pgn(), 'PGN inicial interno');
            makeMove({ from: 'e2', to: 'e4' });
            equal(gameData.fen, game.fen(), 'FEN interno después de e4');
            equal(gameData.pgn, game.pgn(), 'PGN interno después de e4');
            assert(gameData.pgn.includes('1. e4'), 'el PGN interno no contiene e4');
        });

        test('FEN y PGN fuera de la vista principal', () => {
            assert(!document.getElementById('fen-output'), 'existe un campo FEN en el DOM');
            assert(!document.getElementById('pgn-output'), 'existe un campo PGN en el DOM');
        });

        test('Enroque corto', () => {
            const chess = new Chess();
            play(chess, ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5']);
            const castle = chess.move('O-O');
            assert(castle.isKingsideCastle(), 'la jugada no se identifica como enroque corto');
            equal(chess.get('g1').type, 'k', 'rey en g1');
            equal(chess.get('f1').type, 'r', 'torre en f1');
            equal(castle.san, 'O-O', 'SAN');
        });

        test('Enroque largo', () => {
            const chess = new Chess();
            play(chess, ['d4', 'd5', 'Nc3', 'Nf6', 'Bf4', 'e6', 'Qd2', 'Be7']);
            const castle = chess.move('O-O-O');
            assert(castle.isQueensideCastle(), 'la jugada no se identifica como enroque largo');
            equal(chess.get('c1').type, 'k', 'rey en c1');
            equal(chess.get('d1').type, 'r', 'torre en d1');
            equal(castle.san, 'O-O-O', 'SAN');
        });

        test('Captura al paso', () => {
            const chess = new Chess();
            play(chess, ['e4', 'a6', 'e5', 'd5']);
            const capture = chess.move('exd6');
            assert(capture.isEnPassant(), 'la jugada no se identifica como captura al paso');
            equal(capture.san, 'exd6', 'SAN');
            equal(chess.get('d6').color, 'w', 'peón captor');
            equal(chess.get('d5'), undefined, 'peón capturado');
        });

        test('Promoción', () => {
            const chess = new Chess('7k/P7/8/8/8/8/8/7K w - - 0 1');
            const move = chess.move({ from: 'a7', to: 'a8', promotion: 'q' });
            assert(move.isPromotion(), 'la jugada no se identifica como promoción');
            equal(move.san, 'a8=Q+', 'SAN');
            equal(chess.get('a8').type, 'q', 'pieza promovida');
        });

        test('Subpromoción', () => {
            const expectedSan = { r: 'a8=R+', b: 'a8=B', n: 'a8=N' };
            for (const piece of ['r', 'b', 'n']) {
                const chess = new Chess('7k/P7/8/8/8/8/8/7K w - - 0 1');
                const move = chess.move({ from: 'a7', to: 'a8', promotion: piece });
                equal(move.san, expectedSan[piece], `SAN de promoción a ${piece}`);
                equal(chess.get('a8').type, piece, `pieza promovida a ${piece}`);
            }
        });

        test('Jaque', () => {
            const chess = new Chess();
            play(chess, ['e4', 'f6']);
            const move = chess.move('Qh5+');
            equal(move.san, 'Qh5+', 'SAN');
            assert(chess.isCheck(), 'no se detectó el jaque');
            assert(!chess.isCheckmate(), 'se detectó mate incorrectamente');
        });

        test('Jaque mate', () => {
            const chess = new Chess();
            play(chess, ['f3', 'e5', 'g4']);
            const move = chess.move('Qh4#');
            equal(move.san, 'Qh4#', 'SAN');
            assert(chess.isCheckmate(), 'no se detectó el jaque mate');
            assert(chess.isGameOver(), 'la partida no consta como finalizada');
        });

        test('Regresión de jaque mate, SAN y modal', () => {
            resetGame();
            clickMove('f2', 'f3');
            clickMove('e7', 'e5');
            clickMove('g2', 'g4');
            clickMove('d8', 'h4');

            const finalFen = game.fen();
            const finalHistory = game.history();
            const resultModal = document.getElementById('result-modal');
            const defeatedKing = document.querySelector('[data-square="e1"]');
            const blackHistoryCell = [...document.querySelectorAll('.move-black')].at(-1);

            assert(game.isCheckmate(), 'chess.js no detectó el mate');
            equal(finalHistory.at(-1), 'Qh4#', 'última SAN del motor');
            equal(blackHistoryCell.textContent, 'Qh4#', 'SAN visible del historial');
            assert(!resultModal.classList.contains('hidden'), 'el modal no quedó visible');
            assert(resultModalShown, 'el indicador interno del modal no quedó activo');
            equal(document.getElementById('result-code').textContent, '0-1', 'resultado');
            equal(document.getElementById('result-reason').textContent, 'Jaque mate', 'motivo');
            assert(document.getElementById('result-winner').textContent.includes('Negras'), 'ganador');
            assert(document.getElementById('result-loser').textContent.includes('Blancas'), 'perdedor');
            assert(defeatedKing.classList.contains('in-checkmate'), 'rey derrotado sin resaltado');

            setPieceStyle('outline', { persist: false });
            assert(game.isCheckmate(), 'el estilo alteró el estado de mate');
            assert(defeatedKing.classList.contains('in-checkmate'), 'el estilo eliminó el resaltado de mate');
            assert(!resultModal.classList.contains('hidden'), 'el estilo ocultó el modal');
            equal(game.history().at(-1), 'Qh4#', 'el estilo alteró la SAN de mate');
            setPieceStyle('solid', { persist: false });

            document.querySelector('[data-square="e2"]').click();
            equal(game.fen(), finalFen, 'FEN tras intentar mover en mate');
            equal(game.history().join(' '), finalHistory.join(' '), 'historial tras intentar mover en mate');

            document.getElementById('review-position').click();
            assert(resultModal.classList.contains('hidden'), 'Revisar posición no cerró el modal');
            equal(game.fen(), finalFen, 'FEN después de revisar');
            equal(game.history().join(' '), finalHistory.join(' '), 'historial después de revisar');
            assert(
                document.querySelector('[data-square="e1"]').classList.contains('in-checkmate'),
                'se perdió el resaltado después de revisar'
            );
            equal(document.getElementById('result-code').textContent, '0-1', 'resultado interno después de revisar');

            updateInterface();
            assert(resultModal.classList.contains('hidden'), 'el modal se abrió por segunda vez');

            document.getElementById('new-game').click();
            assert(resultModal.classList.contains('hidden'), 'Nueva partida dejó el modal visible');
            assert(!resultModalShown, 'Nueva partida no restableció el indicador del modal');
            equal(game.fen(), new Chess().fen(), 'posición después de Nueva partida');
            equal(game.history().length, 0, 'historial después de Nueva partida');
            for (const id of ['result-summary', 'result-code', 'result-winner', 'result-loser', 'result-reason']) {
                equal(document.getElementById(id).textContent, '', `contenido residual en ${id}`);
            }
        });

        test('Accesibilidad y cierre con Escape del modal de mate', () => {
            resetGame();
            clickMove('f2', 'f3');
            clickMove('e7', 'e5');
            clickMove('g2', 'g4');
            clickMove('d8', 'h4');

            const resultModal = document.getElementById('result-modal');
            equal(resultModal.getAttribute('role'), 'dialog', 'role del modal');
            equal(resultModal.getAttribute('aria-modal'), 'true', 'aria-modal');
            equal(resultModal.getAttribute('aria-labelledby'), 'result-title', 'título asociado');
            equal(document.activeElement.id, 'review-position', 'foco inicial del modal');

            document.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Escape',
                bubbles: true
            }));
            assert(resultModal.classList.contains('hidden'), 'Escape no cerró el modal');
            assert(game.isCheckmate(), 'Escape modificó el resultado');
            equal(game.history().at(-1), 'Qh4#', 'Escape modificó la SAN');
            assert(
                document.querySelector('[data-square="e1"]').classList.contains('in-checkmate'),
                'Escape eliminó el resaltado'
            );
            resetGame();
        });

        test('Ahogado', () => {
            const chess = new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
            assert(chess.isStalemate(), 'no se detectó el ahogado');
            assert(!chess.isCheck(), 'el rey figura incorrectamente en jaque');
            assert(chess.isGameOver(), 'la partida no consta como finalizada');
        });

        test('Triple repetición', () => {
            const chess = new Chess();
            play(chess, ['Nf3', 'Nf6', 'Ng1', 'Ng8', 'Nf3', 'Nf6', 'Ng1']);
            assert(!chess.isThreefoldRepetition(), 'se detectó antes de la tercera aparición');
            chess.move('Ng8');
            assert(chess.isThreefoldRepetition(), 'no se detectó la tercera aparición');
            assert(chess.isGameOver(), 'la partida no consta como finalizada');
        });

        test('Regla de 50 movimientos', () => {
            const chess = new Chess('8/8/8/8/8/7k/R7/K7 w - - 99 50');
            assert(!chess.isDrawByFiftyMoves(), 'se detectó antes de 100 medias jugadas');
            chess.move('Rb2');
            assert(chess.isDrawByFiftyMoves(), 'no se detectó al llegar a 100 medias jugadas');
            assert(chess.fen().split(' ')[4] === '100', 'contador FEN distinto de 100');
        });

        test('Material insuficiente', () => {
            const positions = [
                '8/8/8/8/8/8/5k2/7K w - - 0 1',
                '8/8/8/8/8/8/5k2/2B4K w - - 0 1',
                '8/8/8/8/8/8/5k2/2N4K w - - 0 1'
            ];
            positions.forEach((fen) => {
                const chess = new Chess(fen);
                assert(chess.isInsufficientMaterial(), `no detectado en ${fen}`);
                assert(chess.isGameOver(), `partida no finalizada en ${fen}`);
            });
        });

        test('Bloqueo después de finalizar', () => {
            resetGame();
            play(game, ['f3', 'e5', 'g4', 'Qh4#']);
            updateInterface();
            const beforeFen = game.fen();
            const beforeHistory = game.history().join(' ');
            const square = document.querySelector('[data-square="e2"]');
            square.click();
            equal(game.fen(), beforeFen, 'FEN después del clic');
            equal(game.history().join(' '), beforeHistory, 'historial después del clic');
            assert(!square.classList.contains('selected'), 'se permitió seleccionar una pieza');
        });

        test('Elementos DOM de las piezas', () => {
            setPieceStyle('solid', { persist: false });
            resetGame();
            equal(document.querySelectorAll('#chessboard .piece').length, 32, 'total de piezas');
            equal(document.querySelectorAll('#chessboard .piece.white').length, 16, 'piezas blancas');
            equal(document.querySelectorAll('#chessboard .piece.black').length, 16, 'piezas negras');
            document.querySelectorAll('#chessboard .piece.white').forEach((piece) => {
                assert(piece.closest('.square')?.dataset.color === 'w', 'pieza blanca en casilla mal identificada');
            });
            const whitePiece = document.querySelector('#chessboard .piece.white');
            const blackPiece = document.querySelector('#chessboard .piece.black');
            equal(getComputedStyle(whitePiece).opacity, '1', 'opacidad de pieza blanca');
            assert(
                getComputedStyle(whitePiece).color !== getComputedStyle(blackPiece).color,
                'blancas y negras usan el mismo color'
            );
            assert(
                !whitePiece.classList.contains('light') && !whitePiece.classList.contains('dark'),
                'el color de pieza se confundió con el color de casilla'
            );
            equal(document.querySelector('[data-square="e1"] .piece').textContent, '♚', 'rey blanco sólido');
            equal(document.querySelector('[data-square="e8"] .piece').textContent, '♚', 'rey negro sólido');
        });

        test('Estilo sólido predeterminado y datos inválidos', () => {
            const emptyStorage = { getItem: () => null };
            equal(loadPieceStyle(emptyStorage), 'solid', 'estilo sin preferencia');

            const invalidValues = [
                '{',
                '{}',
                '{"version":2,"pieceStyle":"outline"}',
                '{"version":1,"pieceStyle":"unknown"}'
            ];
            invalidValues.forEach((storedValue) => {
                equal(
                    loadPieceStyle({ getItem: () => storedValue }),
                    'solid',
                    `recuperación para ${storedValue}`
                );
            });
            equal(
                loadPieceStyle({ getItem: () => { throw new Error('storage bloqueado'); } }),
                'solid',
                'excepción de lectura'
            );
        });

        test('Cambio a piezas huecas sin alterar la partida', () => {
            setPieceStyle('solid', { persist: false });
            resetGame();
            makeMove({ from: 'e2', to: 'e4' });
            makeMove({ from: 'e7', to: 'e5' });
            document.querySelector('[data-square="g1"]').click();

            const fenBefore = gameData.fen;
            const pgnBefore = gameData.pgn;
            const historyBefore = game.history().join(' ');

            assert(setPieceStyle('outline', { persist: false }), 'no se aceptó outline');
            equal(activePieceStyle, 'outline', 'estilo activo');
            equal(document.querySelector('[data-square="e1"] .piece').textContent, '♔', 'rey blanco hueco');
            equal(document.querySelector('[data-square="e8"] .piece').textContent, '♚', 'rey negro en outline');
            equal(gameData.fen, fenBefore, 'FEN después del cambio');
            equal(gameData.pgn, pgnBefore, 'PGN después del cambio');
            equal(game.history().join(' '), historyBefore, 'historial después del cambio');
            assert(document.querySelector('[data-square="g1"]').classList.contains('selected'), 'se perdió la selección');
            equal(
                document.querySelector('[data-promotion="q"] [data-promotion-symbol]').textContent,
                '♕',
                'símbolo de promoción'
            );

            resetGame();
            equal(activePieceStyle, 'outline', 'Nueva partida cambió la preferencia');
            equal(document.querySelector('[data-square="e1"] .piece').textContent, '♔', 'Nueva partida perdió outline');
        });

        test('Persistencia del estilo de piezas', () => {
            let storedValue = null;
            const storage = {
                getItem: (key) => key === PIECE_STYLE_STORAGE_KEY ? storedValue : null,
                setItem: (key, value) => {
                    if (key === PIECE_STYLE_STORAGE_KEY) {
                        storedValue = value;
                    }
                }
            };

            assert(setPieceStyle('outline', { storage }), 'no se persistió outline');
            equal(loadPieceStyle(storage), 'outline', 'recuperación de outline');
            assert(setPieceStyle('solid', { storage }), 'no se persistió solid');
            equal(loadPieceStyle(storage), 'solid', 'último estilo válido');
        });

        test('Fallo de escritura no rompe el estilo de la sesión', () => {
            const throwingStorage = {
                setItem: () => {
                    throw new Error('storage bloqueado');
                }
            };
            assert(!persistPieceStyle('outline', throwingStorage), 'la escritura fallida se marcó como correcta');
            assert(!setPieceStyle('outline', { storage: throwingStorage }), 'setPieceStyle ocultó el fallo');
            equal(activePieceStyle, 'outline', 'el estilo válido no se aplicó en la sesión');
            equal(document.querySelector('[data-square="e1"] .piece').textContent, '♔', 'símbolo tras fallo');
            assert(!setPieceStyle('invalid', { persist: false }), 'se aceptó un estilo inválido');
            equal(activePieceStyle, 'outline', 'un valor inválido alteró el estilo');
        });

        test('Reinicio completo', () => {
            resetGame();
            makeMove({ from: 'f2', to: 'f3' });
            makeMove({ from: 'e7', to: 'e5' });
            makeMove({ from: 'g2', to: 'g4' });
            makeMove({ from: 'd8', to: 'h4' });
            assert(game.isCheckmate(), 'la preparación no alcanzó el mate');
            assert(!document.getElementById('result-modal').classList.contains('hidden'), 'modal no abierto');

            resetGame();

            equal(game.fen(), new Chess().fen(), 'FEN inicial');
            equal(game.history().length, 0, 'historial del motor');
            equal(document.getElementById('moves-list').children.length, 0, 'historial visual');
            equal(gameData.fen, new Chess().fen(), 'FEN interno inicial');
            equal(gameData.pgn, new Chess().pgn(), 'PGN interno inicial');
            assert(document.getElementById('result-modal').classList.contains('hidden'), 'modal de resultado abierto');
            assert(document.getElementById('promotion-modal').classList.contains('hidden'), 'modal de promoción abierto');
            for (const id of ['result-summary', 'result-code', 'result-winner', 'result-loser', 'result-reason']) {
                equal(document.getElementById(id).textContent, '', `contenido residual en ${id}`);
            }
            assert(!document.querySelector('.selected, .valid-move, .in-check, .in-checkmate'), 'quedaron resaltados');
            equal(document.querySelectorAll('#chessboard .square').length, 64, 'casillas del tablero');
            equal(document.getElementById('game-status').textContent, 'Turno de blancas.', 'estado');
        });

        test('Reloj preparado 10+5', () => {
            const timer = new ClockManager(DEFAULT_SETTINGS, {
                now: () => 100,
                wallNow: () => 100
            });
            equal(timer.phase, 'ready', 'fase inicial');
            equal(timer.getRemaining('w'), 600000, 'tiempo blanco');
            equal(timer.getRemaining('b'), 600000, 'tiempo negro');
            equal(DEFAULT_SETTINGS.incrementMs, 5000, 'incremento');
        });

        test('Inicio automático solo con selección blanca válida', () => {
            resetGame();
            document.querySelector('[data-square="e7"]').click();
            equal(clock.phase, 'ready', 'selección negra');
            document.querySelector('[data-square="e4"]').click();
            equal(clock.phase, 'ready', 'casilla vacía');
            document.querySelector('[data-square="e2"]').click();
            equal(clock.phase, 'running', 'selección blanca válida');
            equal(clock.activeColor, 'w', 'reloj activo');
        });

        test('Descuento, incremento Fischer y cambio de turno', () => {
            let monotonic = 0;
            let wall = 0;
            const timer = new ClockManager({ initialMs: 10000, incrementMs: 2000 }, {
                now: () => monotonic,
                wallNow: () => wall
            });
            timer.startFirstTurn();
            monotonic = 3000;
            wall = 3000;
            const completion = timer.completeTurn('w');
            equal(completion.consumedMs, 3000, 'tiempo consumido');
            equal(completion.remainingMs, 9000, 'restante después del incremento');
            equal(timer.activeColor, 'b', 'turno activo siguiente');
        });

        test('Intento ilegal no cambia el reloj', () => {
            resetGame();
            document.querySelector('[data-square="e2"]').click();
            const activeBefore = clock.activeColor;
            document.querySelector('[data-square="e5"]').click();
            equal(clock.activeColor, activeBefore, 'color activo');
            equal(game.history().length, 0, 'historial');
            equal(moveRecords.length, 0, 'registros');
        });

        test('Pausa y reanudación excluyen tiempo pausado', () => {
            let monotonic = 0;
            let wall = 0;
            const timer = new ClockManager({ initialMs: 10000, incrementMs: 0 }, {
                now: () => monotonic,
                wallNow: () => wall
            });
            timer.startFirstTurn();
            monotonic = wall = 1200;
            timer.pause();
            monotonic = wall = 8200;
            timer.resume();
            monotonic = wall = 9000;
            equal(timer.consumedMs(), 2000, 'tiempo activo acumulado');
            timer.completeTurn('w');
            equal(timer.getRemaining('w'), 8000, 'restante');
        });

        test('Suspensión usa protección de reloj civil', () => {
            let monotonic = 100;
            let wall = 100;
            const timer = new ClockManager({ initialMs: 10000, incrementMs: 0 }, {
                now: () => monotonic,
                wallNow: () => wall
            });
            timer.startFirstTurn();
            monotonic = 200;
            wall = 4100;
            equal(timer.consumedMs(), 4000, 'tiempo tras suspensión');
        });

        test('Configuración ausente o inválida recupera 10+5', () => {
            const missing = loadSettings({ getItem: () => null });
            equal(missing.initialMs, 600000, 'predeterminado sin datos');
            equal(missing.incrementMs, 5000, 'incremento sin datos');
            for (const value of ['{', '{}', '{"version":1,"initialMs":-1}']) {
                const loaded = loadSettings({ getItem: () => value });
                equal(loaded.initialMs, 600000, `recuperación para ${value}`);
                equal(loaded.incrementMs, 5000, `incremento para ${value}`);
            }
        });

        test('Persistencia unificada conserva la última configuración', () => {
            let stored = null;
            const storage = {
                getItem: (key) => key === SETTINGS_STORAGE_KEY ? stored : null,
                setItem: (key, value) => { if (key === SETTINGS_STORAGE_KEY) stored = value; }
            };
            const first = { ...DEFAULT_SETTINGS, initialMs: 900000, incrementMs: 10000 };
            const second = { ...DEFAULT_SETTINGS, initialMs: 300000, incrementMs: 3000 };
            assert(persistSettings(first, storage), 'no se guardó 15+10');
            equal(loadSettings(storage).initialMs, 900000, 'recarga 15+10');
            assert(persistSettings(second, storage), 'no se guardó 5+3');
            equal(loadSettings(storage).initialMs, 300000, 'último tiempo');
            equal(loadSettings(storage).incrementMs, 3000, 'último incremento');
        });

        test('Aplicar configuración y Nueva partida la conservan', () => {
            resetGame();
            document.getElementById('settings-btn').click();
            document.getElementById('initial-minutes').value = '15';
            document.getElementById('increment-seconds').value = '10';
            document.getElementById('piece-style-solid').checked = true;
            document.getElementById('show-legal-moves').checked = false;
            document.getElementById('apply-settings').click();
            equal(settings.initialMs, 900000, 'tiempo aplicado');
            equal(settings.incrementMs, 10000, 'incremento aplicado');
            equal(clock.getRemaining('w'), 900000, 'reloj aplicado');
            resetGame();
            equal(clock.getRemaining('w'), 900000, 'Nueva partida conserva configuración');
            equal(clock.getRemaining('b'), 900000, 'reloj negro conservado');
        });

        test('Destinos posibles deshabilitados por defecto', () => {
            settings.showLegalMoves = false;
            resetGame();
            document.querySelector('[data-square="e2"]').click();
            equal(document.querySelectorAll('.valid-move, .valid-capture').length, 0, 'marcas ocultas');
        });

        test('Registro estructurado e historial de cinco columnas', () => {
            resetGame();
            clickMove('e2', 'e4');
            equal(moveRecords.length, 1, 'registros');
            const record = moveRecords[0];
            for (const field of ['number', 'color', 'san', 'from', 'to', 'piece', 'capture',
                'promotion', 'resultingFen', 'consumedMs', 'remainingMs', 'incrementMs']) {
                assert(Object.hasOwn(record, field), `falta ${field}`);
            }
            equal(record.san, 'e4', 'SAN registrada');
            equal(document.querySelector('#moves-list .move').children.length, 5, 'columnas');
            equal(document.querySelector('.move-white').textContent, 'e4', 'historial blanco');
        });

        test('Control visible de pausa y bloqueo durante pausa', () => {
            resetGame();
            document.querySelector('[data-square="e2"]').click();
            pauseOrResume();
            equal(clock.phase, 'paused', 'fase pausada');
            clickMove('e2', 'e4');
            equal(game.history().length, 0, 'movimiento durante pausa');
            pauseOrResume();
            equal(clock.phase, 'running', 'fase reanudada');
            equal(clock.activeColor, 'w', 'reloj reanudado');
        });

        test('Mate detiene relojes y habilita Lichess', () => {
            resetGame();
            clickMove('f2', 'f3');
            clickMove('e7', 'e5');
            clickMove('g2', 'g4');
            clickMove('d8', 'h4');
            equal(clock.phase, 'finished', 'reloj finalizado');
            const link = document.getElementById('lichess-link');
            assert(!link.classList.contains('hidden'), 'enlace oculto');
            assert(link.href.includes('/analysis/pgn/'), 'ruta de Lichess');
            assert(link.href.includes('Qh4%23'), 'PGN no codifica #');
            equal(link.getAttribute('rel'), 'noopener noreferrer', 'protección de enlace');
        });

        test('Posibilidad de mate tras bandera: casos exactos', () => {
            const bareKing = new Chess('8/8/8/8/8/8/5k2/7K w - - 0 1');
            equal(assessMatingPossibility(bareKing, 'w').status, 'impossible', 'rey solo');
            const bishop = new Chess('8/8/8/8/8/8/5k2/2B4K w - - 0 1');
            equal(assessMatingPossibility(bishop, 'w').status, 'impossible', 'alfil contra rey');
            const knight = new Chess('8/8/8/8/8/8/5k2/2N4K w - - 0 1');
            equal(assessMatingPossibility(knight, 'w').status, 'impossible', 'caballo contra rey');
        });

        test('Posibilidad de mate: certificado y resolución arbitral', () => {
            const mateAvailable = new Chess('7k/5Q2/6K1/8/8/8/8/8 w - - 0 1');
            equal(assessMatingPossibility(mateAvailable, 'w').status, 'possible', 'mate disponible');
            const uncertain = new Chess();
            equal(assessMatingPossibility(uncertain, 'w').status, 'undetermined', 'posición compleja');
        });

        test('Posibilidad de mate: material y casos límite', () => {
            const cases = [
                ['dos caballos', 'k7/8/8/8/8/8/8/1NN4K w - - 0 1'],
                ['pieza menor con material rival', 'k5r1/8/8/8/8/8/8/2B4K w - - 0 1'],
                ['peón', 'k7/8/8/8/8/8/1P6/7K w - - 0 1'],
                ['torre', 'k7/8/8/8/8/8/8/1R5K w - - 0 1'],
                ['dama', 'k7/8/8/8/8/8/8/1Q5K w - - 0 1']
            ];
            cases.forEach(([label, fen]) => {
                const assessment = assessMatingPossibility(new Chess(fen), 'w');
                assert(assessment.status !== 'impossible', `${label} se declaró imposible sin prueba`);
            });
        });

        test('Caída de bandera indeterminada solicita resolución arbitral', () => {
            resetGame();
            handleTimeout('w');
            assert(!document.getElementById('result-modal').classList.contains('hidden'), 'modal oculto');
            assert(!document.getElementById('timeout-arbitration').classList.contains('hidden'), 'arbitraje oculto');
            equal(document.getElementById('result-code').textContent, 'Pendiente', 'estado arbitral');
            document.getElementById('timeout-draw').click();
            equal(document.getElementById('result-code').textContent, '½-½', 'resultado manual');
            assert(document.getElementById('timeout-arbitration').classList.contains('hidden'), 'arbitraje sigue visible');
            equal(clock.phase, 'finished', 'reloj tras resolución');
            resetGame();
        });

        test('URL de Lichess usa el PGN completo codificado', () => {
            resetGame();
            makeMove({ from: 'e2', to: 'e4' });
            const url = buildLichessUrl();
            assert(url.startsWith('https://lichess.org/analysis/pgn/'), 'origen o ruta');
            assert(url.includes(encodeURIComponent(gameData.pgn)), 'PGN incompleto');
        });

        renderResults();
    });
})();
