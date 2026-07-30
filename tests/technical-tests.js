/* global Chess, game, makeMove, resetGame, updateInterface */

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
            equal(document.getElementById('pgn-output').value, new Chess().pgn(), 'PGN inicial');
            assert(document.getElementById('result-modal').classList.contains('hidden'), 'modal de resultado abierto');
            assert(document.getElementById('promotion-modal').classList.contains('hidden'), 'modal de promoción abierto');
            for (const id of ['result-summary', 'result-code', 'result-winner', 'result-loser', 'result-reason']) {
                equal(document.getElementById(id).textContent, '', `contenido residual en ${id}`);
            }
            assert(!document.querySelector('.selected, .valid-move, .in-check, .in-checkmate'), 'quedaron resaltados');
            equal(document.querySelectorAll('#chessboard .square').length, 64, 'casillas del tablero');
            equal(document.getElementById('game-status').textContent, 'Turno de blancas.', 'estado');
        });

        renderResults();
    });
})();
