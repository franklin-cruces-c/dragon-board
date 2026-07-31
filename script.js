const PIECE_SYMBOLS = {
    solid: {
        w: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
        b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
    },
    outline: {
        w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
        b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
    }
};

const DEFAULT_SETTINGS = Object.freeze({
    version: 1,
    initialMs: 600000,
    incrementMs: 5000,
    pieceStyle: 'solid',
    showLegalMoves: false
});
const SETTINGS_STORAGE_KEY = 'dragon-board.settings.v1';
const PIECE_STYLE_STORAGE_KEY = SETTINGS_STORAGE_KEY;

function isValidPieceStyle(pieceStyle) {
    return Object.hasOwn(PIECE_SYMBOLS, pieceStyle);
}

function isValidSettings(value) {
    return Boolean(
        value &&
        value.version === 1 &&
        Number.isInteger(value.initialMs) &&
        value.initialMs >= 60000 &&
        value.initialMs <= 86400000 &&
        Number.isInteger(value.incrementMs) &&
        value.incrementMs >= 0 &&
        value.incrementMs <= 3600000 &&
        isValidPieceStyle(value.pieceStyle) &&
        typeof value.showLegalMoves === 'boolean'
    );
}

function loadSettings(storage) {
    try {
        const targetStorage = storage || window.localStorage;
        const parsed = JSON.parse(targetStorage.getItem(SETTINGS_STORAGE_KEY));
        return isValidSettings(parsed) ? { ...parsed } : { ...DEFAULT_SETTINGS };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

function persistSettings(value, storage) {
    try {
        const targetStorage = storage || window.localStorage;
        targetStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}

function loadPieceStyle(storage) {
    return loadSettings(storage).pieceStyle;
}

function persistPieceStyle(pieceStyle, storage) {
    if (!isValidPieceStyle(pieceStyle)) {
        return false;
    }
    return persistSettings({ ...settings, pieceStyle }, storage);
}

const game = new window.Chess();
let settings = loadSettings();
let activePieceStyle = settings.pieceStyle;
const clock = new window.ClockManager(settings);
const gameData = { fen: game.fen(), pgn: game.pgn() };
const moveRecords = [];
let selectedSquare = null;
let legalMoves = [];
let pendingPromotion = null;
let resultModalShown = false;
let focusBeforeResult = null;
let focusBeforeSettings = null;
let animationFrameId = null;
let timeoutContext = null;

function optionalElement(id) {
    return document.getElementById(id);
}

function createBoard() {
    const chessboard = optionalElement('chessboard');
    if (!chessboard) return;
    const position = game.board();
    chessboard.innerHTML = '';

    position.forEach((row, rowIndex) => {
        row.forEach((piece, colIndex) => {
            const square = document.createElement('div');
            const squareName = `${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`;
            square.className = `square ${(rowIndex + colIndex) % 2 === 0 ? 'light' : 'dark'}`;
            square.dataset.square = squareName;
            square.setAttribute('role', 'button');
            square.setAttribute('aria-label', piece ? `${squareName}, ${piece.color}${piece.type}` : squareName);
            square.tabIndex = 0;

            if (piece) {
                const pieceElement = document.createElement('span');
                pieceElement.className = `piece ${piece.color === 'w' ? 'white' : 'black'}`;
                pieceElement.textContent = PIECE_SYMBOLS[activePieceStyle][piece.color][piece.type];
                pieceElement.setAttribute('aria-hidden', 'true');
                square.appendChild(pieceElement);
                square.dataset.piece = piece.type;
                square.dataset.color = piece.color;
            }

            square.addEventListener('click', handleSquareClick);
            square.addEventListener('keydown', handleSquareKeydown);
            chessboard.appendChild(square);
        });
    });

    highlightCheckedKing();
    renderPromotionOptions();
}

function renderPieceSymbols() {
    document.querySelectorAll('.square[data-piece][data-color]').forEach((square) => {
        const pieceElement = square.querySelector('.piece');
        if (pieceElement) {
            pieceElement.textContent =
                PIECE_SYMBOLS[activePieceStyle][square.dataset.color][square.dataset.piece];
        }
    });
}

function renderPromotionOptions() {
    const promotionColor = game.turn();
    document.querySelectorAll('[data-promotion-symbol]').forEach((symbol) => {
        const pieceType = symbol.closest('[data-promotion]')?.dataset.promotion;
        if (pieceType) {
            symbol.textContent = PIECE_SYMBOLS[activePieceStyle][promotionColor][pieceType];
            symbol.className = `piece ${promotionColor === 'w' ? 'white' : 'black'}`;
        }
    });
}

function setPieceStyle(pieceStyle, { persist = true, storage } = {}) {
    if (!isValidPieceStyle(pieceStyle)) return false;
    activePieceStyle = pieceStyle;
    settings = { ...settings, pieceStyle };
    renderPieceSymbols();
    renderPromotionOptions();
    return persist ? persistSettings(settings, storage) : true;
}

function highlightCheckedKing() {
    if (!game.isCheck()) return;
    const checkedColor = game.turn();
    const checkedKing = game.board().flat()
        .find((piece) => piece?.type === 'k' && piece.color === checkedColor);
    if (!checkedKing) return;
    const kingSquare = document.querySelector(`[data-square="${checkedKing.square}"]`);
    kingSquare?.classList.add(game.isCheckmate() ? 'in-checkmate' : 'in-check');
}

function handleSquareKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleSquareClick(event);
    }
}

function interactionBlocked() {
    return game.isGameOver() || clock.phase === 'paused' ||
        clock.phase === 'finished' || Boolean(pendingPromotion);
}

function handleSquareClick(event) {
    if (interactionBlocked()) return;
    const squareName = event.currentTarget.dataset.square;
    const destinationMoves = legalMoves.filter((move) => move.to === squareName);

    if (selectedSquare && destinationMoves.length > 0) {
        const promotionMoves = destinationMoves.filter((move) => move.promotion);
        if (promotionMoves.length > 0) {
            openPromotionSelector(selectedSquare, squareName);
        } else {
            makeMove({ from: selectedSquare, to: squareName });
        }
        return;
    }

    const piece = game.get(squareName);
    if (piece && piece.color === game.turn()) {
        selectSquare(squareName);
    } else {
        clearSelection();
    }
}

function selectSquare(squareName) {
    clearSelection();
    const moves = game.moves({ square: squareName, verbose: true });
    if (moves.length === 0) return;
    selectedSquare = squareName;
    legalMoves = moves;
    document.querySelector(`[data-square="${squareName}"]`)?.classList.add('selected');

    if (clock.phase === 'ready' && game.turn() === 'w') {
        clock.startFirstTurn('w');
        onClockStateChanged();
    }

    if (!settings.showLegalMoves) return;
    const destinations = new Map();
    moves.forEach((move) => {
        destinations.set(move.to, destinations.get(move.to) || move.captured || move.isEnPassant());
    });
    destinations.forEach((isCapture, destination) => {
        document.querySelector(`[data-square="${destination}"]`)
            ?.classList.add(isCapture ? 'valid-capture' : 'valid-move');
    });
}

function clearSelection() {
    selectedSquare = null;
    legalMoves = [];
    document.querySelectorAll('.square').forEach((square) => {
        square.classList.remove('selected', 'valid-move', 'valid-capture');
    });
}

function buildMoveRecord(acceptedMove, timing) {
    return {
        number: Math.floor(moveRecords.length / 2) + 1,
        color: acceptedMove.color,
        san: acceptedMove.san,
        from: acceptedMove.from,
        to: acceptedMove.to,
        piece: acceptedMove.piece,
        capture: acceptedMove.captured || null,
        promotion: acceptedMove.promotion || null,
        resultingFen: acceptedMove.after,
        consumedMs: timing.consumedMs,
        remainingMs: timing.remainingMs,
        incrementMs: timing.incrementAppliedMs
    };
}

function makeMove(move) {
    try {
        if (clock.phase === 'ready') {
            clock.startFirstTurn('w');
        }
        const acceptedMove = game.move(move);
        const timing = clock.completeTurn(acceptedMove.color);
        if (!timing.ok && timing.reason === 'flag') {
            game.undo();
            clearSelection();
            updateInterface();
            handleTimeout(acceptedMove.color);
            return null;
        }
        if (!timing.ok) {
            game.undo();
            return null;
        }

        moveRecords.push(buildMoveRecord(acceptedMove, timing));
        clearSelection();
        updateInterface();

        const finalResult = getFinalResult();
        if (finalResult) {
            clock.finish(finalResult.reason);
            updateClockInterface();
            finishGame(finalResult);
        } else {
            onClockStateChanged();
        }
        return acceptedMove;
    } catch {
        clearSelection();
        updateStatus('Movimiento no válido.');
        return null;
    }
}

function openPromotionSelector(from, to) {
    pendingPromotion = { from, to };
    optionalElement('promotion-modal')?.classList.remove('hidden');
    renderPromotionOptions();
    document.querySelector('[data-promotion="q"]')?.focus();
}

function closePromotionSelector() {
    pendingPromotion = null;
    optionalElement('promotion-modal')?.classList.add('hidden');
}

function choosePromotion(event) {
    if (!pendingPromotion) return;
    const move = { ...pendingPromotion, promotion: event.currentTarget.dataset.promotion };
    closePromotionSelector();
    makeMove(move);
}

function formatMoveTime(milliseconds) {
    return `${(milliseconds / 1000).toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })} s`;
}

function updateMovesList() {
    const movesList = optionalElement('moves-list');
    if (!movesList) return;
    movesList.innerHTML = '';
    for (let index = 0; index < moveRecords.length; index += 2) {
        const white = moveRecords[index];
        const black = moveRecords[index + 1];
        const row = document.createElement('div');
        row.className = 'move';
        const values = [
            [`${white.number}.`, 'move-number'],
            [white.san, 'move-white'],
            [formatMoveTime(white.consumedMs), 'move-time-white'],
            [black?.san || '', 'move-black'],
            [black ? formatMoveTime(black.consumedMs) : '', 'move-time-black']
        ];
        values.forEach(([text, className]) => {
            const span = document.createElement('span');
            span.className = className;
            span.textContent = text;
            row.appendChild(span);
        });
        movesList.appendChild(row);
    }
    movesList.scrollTop = movesList.scrollHeight;
}

function getGameStatus() {
    if (clock.phase === 'paused') return 'Partida pausada.';
    if (clock.phase === 'finished' && timeoutContext) return 'Partida finalizada por tiempo.';
    const sideToMove = game.turn() === 'w' ? 'blancas' : 'negras';
    if (game.isCheckmate()) return `Jaque mate. Ganan las ${game.turn() === 'w' ? 'negras' : 'blancas'}.`;
    if (game.isStalemate()) return 'Tablas por ahogado.';
    if (game.isThreefoldRepetition()) return 'Tablas por triple repetición.';
    if (game.isInsufficientMaterial()) return 'Tablas por material insuficiente.';
    if (game.isDrawByFiftyMoves()) return 'Tablas por la regla de los cincuenta movimientos.';
    if (game.isCheck()) return `Jaque. Turno de ${sideToMove}.`;
    return `Turno de ${sideToMove}.`;
}

function drawResult(reason) {
    return {
        result: '½-½',
        winner: 'Blancas — 0,5 puntos',
        loser: 'Negras — 0,5 puntos',
        reason,
        summary: reason
    };
}

function winResult(winnerColor, reason) {
    const winner = winnerColor === 'w' ? 'Blancas' : 'Negras';
    const loser = winnerColor === 'w' ? 'Negras' : 'Blancas';
    return {
        result: winnerColor === 'w' ? '1-0' : '0-1',
        winner: `${winner} — 1 punto`,
        loser: `${loser} — 0 puntos`,
        reason,
        summary: `${winner} ganan por ${reason.toLowerCase()}.`
    };
}

function getFinalResult() {
    if (game.isCheckmate()) return winResult(game.turn() === 'w' ? 'b' : 'w', 'Jaque mate');
    if (game.isStalemate()) return drawResult('Tablas por ahogado');
    if (game.isThreefoldRepetition()) return drawResult('Tablas por triple repetición');
    if (game.isInsufficientMaterial()) return drawResult('Tablas por material insuficiente');
    if (game.isDrawByFiftyMoves()) return drawResult('Tablas por regla de cincuenta movimientos');
    return null;
}

function updateStatus(overrideMessage) {
    const status = optionalElement('game-status');
    if (status) status.textContent = overrideMessage || getGameStatus();
    gameData.fen = game.fen();
    gameData.pgn = game.pgn();
}

function updateInterface() {
    createBoard();
    updateMovesList();
    updateStatus();
    updateClockInterface();
}

function formatClock(milliseconds) {
    const safe = Math.max(0, milliseconds);
    const minutes = Math.floor(safe / 60000);
    const seconds = Math.floor((safe % 60000) / 1000);
    if (safe < 60000) {
        const tenths = Math.floor((safe % 1000) / 100);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateClockInterface() {
    const now = performance.now();
    const wall = Date.now();
    const whiteTime = optionalElement('clock-white-time');
    const blackTime = optionalElement('clock-black-time');
    if (whiteTime) whiteTime.textContent = formatClock(clock.getRemaining('w', now, wall));
    if (blackTime) blackTime.textContent = formatClock(clock.getRemaining('b', now, wall));
    ['w', 'b'].forEach((color) => {
        const element = optionalElement(color === 'w' ? 'clock-white' : 'clock-black');
        element?.classList.toggle('active', clock.phase === 'running' && clock.activeColor === color);
        element?.classList.toggle('paused', clock.phase === 'paused');
        element?.classList.toggle('flagged', clock.phase === 'finished' && timeoutContext?.flagColor === color);
    });
    const pauseButton = optionalElement('pause-btn');
    if (pauseButton) {
        pauseButton.disabled = !['running', 'paused'].includes(clock.phase);
        pauseButton.textContent = clock.phase === 'paused' ? 'Reanudar' : 'Pausar';
    }
    const settingsButton = optionalElement('settings-btn');
    if (settingsButton) settingsButton.disabled = clock.phase !== 'ready';
}

function animationLoop() {
    updateClockInterface();
    if (clock.isFlagged()) {
        handleTimeout(clock.activeColor);
        return;
    }
    if (clock.phase === 'running') {
        animationFrameId = requestAnimationFrame(animationLoop);
    }
}

function onClockStateChanged() {
    if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
    updateClockInterface();
    updateStatus();
    if (clock.phase === 'running') animationFrameId = requestAnimationFrame(animationLoop);
}

function pauseOrResume() {
    if (clock.phase === 'running') {
        clock.pause();
        clearSelection();
        closePromotionSelector();
    } else if (clock.phase === 'paused') {
        clock.resume();
    }
    onClockStateChanged();
}

function boundedMatingSearch(fen, matingColor, maxDepth = 3, maxNodes = 1500) {
    const queue = [{ fen, depth: 0, line: [] }];
    const visited = new Set();
    let nodes = 0;
    while (queue.length && nodes < maxNodes) {
        const node = queue.shift();
        const key = `${node.fen}|${node.depth}`;
        if (visited.has(key)) continue;
        visited.add(key);
        const position = new window.Chess(node.fen);
        nodes++;
        if (position.isCheckmate()) {
            const winner = position.turn() === 'w' ? 'b' : 'w';
            if (winner === matingColor) {
                return { status: 'possible', matingLine: node.line, exploredPositions: nodes };
            }
            continue;
        }
        if (node.depth >= maxDepth || position.isGameOver()) continue;
        for (const move of position.moves({ verbose: true })) {
            const child = new window.Chess(node.fen);
            const accepted = child.move({ from: move.from, to: move.to, promotion: move.promotion });
            queue.push({ fen: child.fen(), depth: node.depth + 1, line: [...node.line, accepted.san] });
        }
    }
    return { status: 'undetermined', matingLine: null, exploredPositions: nodes };
}

function assessMatingPossibility(position, color) {
    const pieces = position.board().flat().filter(Boolean);
    const ownNonKing = pieces.filter((piece) => piece.color === color && piece.type !== 'k');
    const enemyNonKing = pieces.filter((piece) => piece.color !== color && piece.type !== 'k');
    if (ownNonKing.length === 0) {
        return { status: 'impossible', reason: 'El rival solo conserva el rey.' };
    }
    if (
        enemyNonKing.length === 0 &&
        ownNonKing.length === 1 &&
        ['b', 'n'].includes(ownNonKing[0].type)
    ) {
        return { status: 'impossible', reason: 'Rey y pieza menor contra rey no pueden dar mate.' };
    }
    return boundedMatingSearch(position.fen(), color);
}

function handleTimeout(flagColor) {
    if (clock.phase === 'finished') return;
    clock.finish('Tiempo agotado');
    clearSelection();
    closePromotionSelector();
    timeoutContext = {
        flagColor,
        winnerColor: flagColor === 'w' ? 'b' : 'w',
        assessment: assessMatingPossibility(game, flagColor === 'w' ? 'b' : 'w'),
        adjudication: null
    };
    updateInterface();
    if (timeoutContext.assessment.status === 'possible') {
        timeoutContext.adjudication = 'automatic';
        finishGame(winResult(timeoutContext.winnerColor, 'Tiempo agotado'));
    } else if (timeoutContext.assessment.status === 'impossible') {
        timeoutContext.adjudication = 'automatic';
        finishGame(drawResult('Tablas por tiempo y posición sin posibilidad de mate'));
    } else {
        showTimeoutArbitration();
    }
}

function showTimeoutArbitration() {
    const result = {
        result: 'Pendiente',
        winner: 'Decisión arbitral pendiente',
        loser: 'Decisión arbitral pendiente',
        reason: 'Tiempo agotado',
        summary: 'Se necesita una decisión arbitral.'
    };
    finishGame(result, { arbitration: true, setPgnResult: false });
}

function resolveTimeoutManually(asDraw) {
    if (!timeoutContext || timeoutContext.assessment.status !== 'undetermined') return;
    timeoutContext.adjudication = 'manual';
    const result = asDraw
        ? drawResult('Tablas por decisión arbitral tras tiempo agotado')
        : winResult(timeoutContext.winnerColor, 'Tiempo agotado');
    finishGame(result, { force: true });
}

function buildLichessUrl() {
    return `https://lichess.org/analysis/pgn/${encodeURIComponent(gameData.pgn)}`;
}

function prepareLichessLink() {
    const link = optionalElement('lichess-link');
    const status = optionalElement('lichess-status');
    if (!link) return;
    const url = buildLichessUrl();
    if (url.length > 8000) {
        link.classList.add('hidden');
        if (status) status.textContent = 'La partida es demasiado larga para abrirla mediante URL sin truncarla.';
        return;
    }
    link.href = url;
    link.classList.remove('hidden');
    if (status) status.textContent = '';
}

function finishGame(result, options = {}) {
    if (!result || (resultModalShown && !options.force)) return;
    clearSelection();
    resultModalShown = true;
    focusBeforeResult = document.activeElement;
    if (options.setPgnResult !== false && ['1-0', '0-1', '½-½'].includes(result.result)) {
        game.setHeader('Result', result.result === '½-½' ? '1/2-1/2' : result.result);
        updateStatus();
    }
    optionalElement('result-summary').textContent = result.summary;
    optionalElement('result-code').textContent = result.result;
    optionalElement('result-winner').textContent = result.winner;
    optionalElement('result-loser').textContent = result.loser;
    optionalElement('result-reason').textContent = result.reason;
    optionalElement('timeout-arbitration')?.classList.toggle('hidden', !options.arbitration);
    optionalElement('result-modal')?.classList.remove('hidden');
    if (!options.arbitration) prepareLichessLink();
    optionalElement('review-position')?.focus();
}

function closeResultModal() {
    optionalElement('result-modal')?.classList.add('hidden');
    if (focusBeforeResult?.isConnected) focusBeforeResult.focus();
    focusBeforeResult = null;
}

function trapFocus(event, modal) {
    if (event.key !== 'Tab') return;
    const focusable = [...modal.querySelectorAll('button:not([disabled]), a[href], input:not([disabled])')]
        .filter((element) => !element.closest('.hidden'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

function handleResultModalKeydown(event) {
    const modal = optionalElement('result-modal');
    if (!modal || modal.classList.contains('hidden')) return;
    if (event.key === 'Escape') {
        event.preventDefault();
        closeResultModal();
    } else {
        trapFocus(event, modal);
    }
}

function populateSettingsForm() {
    optionalElement('initial-minutes').value = settings.initialMs / 60000;
    optionalElement('increment-seconds').value = settings.incrementMs / 1000;
    const radio = document.querySelector(`[name="piece-style"][value="${settings.pieceStyle}"]`);
    if (radio) radio.checked = true;
    optionalElement('show-legal-moves').checked = settings.showLegalMoves;
    optionalElement('settings-error').textContent = '';
}

function openSettingsModal() {
    if (clock.phase !== 'ready') return;
    focusBeforeSettings = document.activeElement;
    populateSettingsForm();
    optionalElement('settings-modal')?.classList.remove('hidden');
    optionalElement('initial-minutes')?.focus();
}

function closeSettingsModal() {
    optionalElement('settings-modal')?.classList.add('hidden');
    if (focusBeforeSettings?.isConnected) focusBeforeSettings.focus();
    focusBeforeSettings = null;
}

function readSettingsForm() {
    const initialMinutes = Number(optionalElement('initial-minutes').value);
    const incrementSeconds = Number(optionalElement('increment-seconds').value);
    const pieceStyle = document.querySelector('[name="piece-style"]:checked')?.value;
    const candidate = {
        version: 1,
        initialMs: initialMinutes * 60000,
        incrementMs: incrementSeconds * 1000,
        pieceStyle,
        showLegalMoves: optionalElement('show-legal-moves').checked
    };
    return isValidSettings(candidate) ? candidate : null;
}

function applySettings() {
    if (clock.phase !== 'ready') return false;
    const candidate = readSettingsForm();
    if (!candidate) {
        optionalElement('settings-error').textContent = 'Revisa los valores introducidos.';
        return false;
    }
    settings = candidate;
    activePieceStyle = settings.pieceStyle;
    persistSettings(settings);
    clock.configure(settings);
    clearSelection();
    updateInterface();
    closeSettingsModal();
    return true;
}

function handleSettingsKeydown(event) {
    const modal = optionalElement('settings-modal');
    if (!modal || modal.classList.contains('hidden')) return;
    if (event.key === 'Escape') {
        event.preventDefault();
        closeSettingsModal();
    } else {
        trapFocus(event, modal);
    }
}

function resetGame() {
    if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
    game.reset();
    moveRecords.length = 0;
    timeoutContext = null;
    clock.configure(settings);
    closePromotionSelector();
    closeResultModal();
    optionalElement('settings-modal')?.classList.add('hidden');
    optionalElement('timeout-arbitration')?.classList.add('hidden');
    optionalElement('lichess-link')?.classList.add('hidden');
    if (optionalElement('lichess-status')) optionalElement('lichess-status').textContent = '';
    ['result-summary', 'result-code', 'result-winner', 'result-loser', 'result-reason'].forEach((id) => {
        if (optionalElement(id)) optionalElement(id).textContent = '';
    });
    resultModalShown = false;
    clearSelection();
    updateInterface();
}

document.addEventListener('DOMContentLoaded', () => {
    optionalElement('reset-btn')?.addEventListener('click', resetGame);
    optionalElement('pause-btn')?.addEventListener('click', pauseOrResume);
    optionalElement('settings-btn')?.addEventListener('click', openSettingsModal);
    optionalElement('cancel-settings')?.addEventListener('click', closeSettingsModal);
    optionalElement('apply-settings')?.addEventListener('click', applySettings);
    document.querySelectorAll('[data-preset]').forEach((button) => {
        button.addEventListener('click', () => {
            const [minutes, increment] = button.dataset.preset.split(',');
            optionalElement('initial-minutes').value = minutes;
            optionalElement('increment-seconds').value = increment;
        });
    });
    document.querySelectorAll('[data-promotion]').forEach((button) => {
        button.addEventListener('click', choosePromotion);
    });
    optionalElement('cancel-promotion')?.addEventListener('click', () => {
        closePromotionSelector();
        clearSelection();
    });
    optionalElement('review-position')?.addEventListener('click', closeResultModal);
    optionalElement('new-game')?.addEventListener('click', resetGame);
    optionalElement('timeout-win')?.addEventListener('click', () => resolveTimeoutManually(false));
    optionalElement('timeout-draw')?.addEventListener('click', () => resolveTimeoutManually(true));
    optionalElement('lichess-link')?.addEventListener('click', () => {
        const status = optionalElement('lichess-status');
        if (status) status.textContent = 'Si Lichess no se abrió, permite ventanas nuevas y vuelve a pulsar.';
    });
    document.addEventListener('keydown', handleResultModalKeydown);
    document.addEventListener('keydown', handleSettingsKeydown);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && clock.phase === 'running') {
            updateClockInterface();
            if (clock.isFlagged()) handleTimeout(clock.activeColor);
        }
    });
    updateInterface();
});
