const PIECE_SYMBOLS = {
    solid: {
        w: {
            k: '♚',
            q: '♛',
            r: '♜',
            b: '♝',
            n: '♞',
            p: '♟'
        },
        b: {
            k: '♚',
            q: '♛',
            r: '♜',
            b: '♝',
            n: '♞',
            p: '♟'
        }
    },
    outline: {
        w: {
            k: '♔',
            q: '♕',
            r: '♖',
            b: '♗',
            n: '♘',
            p: '♙'
        },
        b: {
            k: '♚',
            q: '♛',
            r: '♜',
            b: '♝',
            n: '♞',
            p: '♟'
        }
    }
};

const DEFAULT_PIECE_STYLE = 'solid';
const PIECE_STYLE_STORAGE_KEY = 'dragon-board.piece-style.v1';
const PIECE_STYLE_STORAGE_VERSION = 1;

function isValidPieceStyle(pieceStyle) {
    return Object.hasOwn(PIECE_SYMBOLS, pieceStyle);
}

function loadPieceStyle(storage) {
    try {
        const targetStorage = storage || window.localStorage;
        const storedValue = targetStorage.getItem(PIECE_STYLE_STORAGE_KEY);
        if (!storedValue) {
            return DEFAULT_PIECE_STYLE;
        }

        const parsedValue = JSON.parse(storedValue);
        if (
            parsedValue?.version !== PIECE_STYLE_STORAGE_VERSION ||
            !isValidPieceStyle(parsedValue.pieceStyle)
        ) {
            return DEFAULT_PIECE_STYLE;
        }

        return parsedValue.pieceStyle;
    } catch {
        return DEFAULT_PIECE_STYLE;
    }
}

function persistPieceStyle(pieceStyle, storage) {
    try {
        const targetStorage = storage || window.localStorage;
        targetStorage.setItem(PIECE_STYLE_STORAGE_KEY, JSON.stringify({
            version: PIECE_STYLE_STORAGE_VERSION,
            pieceStyle
        }));
        return true;
    } catch {
        return false;
    }
}

const game = new window.Chess();
const gameData = {
    fen: game.fen(),
    pgn: game.pgn()
};
let activePieceStyle = loadPieceStyle();
let selectedSquare = null;
let legalMoves = [];
let pendingPromotion = null;
let resultModalShown = false;
let focusBeforeResult = null;

function createBoard() {
    const chessboard = document.getElementById('chessboard');
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
    if (!isValidPieceStyle(pieceStyle)) {
        return false;
    }

    activePieceStyle = pieceStyle;
    renderPieceSymbols();
    renderPromotionOptions();

    return persist ? persistPieceStyle(pieceStyle, storage) : true;
}

function highlightCheckedKing() {
    if (!game.isCheck()) {
        return;
    }

    const checkedColor = game.turn();
    const checkedKing = game.board()
        .flat()
        .find((piece) => piece?.type === 'k' && piece.color === checkedColor);

    if (!checkedKing) {
        return;
    }

    const kingSquare = document.querySelector(`[data-square="${checkedKing.square}"]`);
    kingSquare?.classList.add(game.isCheckmate() ? 'in-checkmate' : 'in-check');
}

function handleSquareKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleSquareClick(event);
    }
}

function handleSquareClick(event) {
    if (game.isGameOver() || pendingPromotion) {
        return;
    }

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
    selectedSquare = squareName;
    legalMoves = game.moves({ square: squareName, verbose: true });

    const selectedElement = document.querySelector(`[data-square="${squareName}"]`);
    selectedElement.classList.add('selected');

    new Set(legalMoves.map((move) => move.to)).forEach((destination) => {
        const targetSquare = document.querySelector(`[data-square="${destination}"]`);
        if (targetSquare) {
            targetSquare.classList.add('valid-move');
        }
    });
}

function clearSelection() {
    selectedSquare = null;
    legalMoves = [];
    document.querySelectorAll('.square').forEach((square) => {
        square.classList.remove('selected', 'valid-move');
    });
}

function makeMove(move) {
    try {
        const acceptedMove = game.move(move);
        clearSelection();
        updateInterface();
        return acceptedMove;
    } catch (error) {
        clearSelection();
        updateStatus('Movimiento no válido.');
        return null;
    }
}

function openPromotionSelector(from, to) {
    pendingPromotion = { from, to };
    document.getElementById('promotion-modal').classList.remove('hidden');
    document.querySelector('[data-promotion="q"]').focus();
}

function closePromotionSelector() {
    pendingPromotion = null;
    document.getElementById('promotion-modal').classList.add('hidden');
}

function choosePromotion(event) {
    if (!pendingPromotion) {
        return;
    }

    const move = {
        ...pendingPromotion,
        promotion: event.currentTarget.dataset.promotion
    };
    closePromotionSelector();
    makeMove(move);
}

function updateMovesList() {
    const movesList = document.getElementById('moves-list');
    const history = game.history({ verbose: true });
    movesList.innerHTML = '';

    for (let index = 0; index < history.length; index += 2) {
        const moveRow = document.createElement('div');
        moveRow.className = 'move';

        const moveNumber = document.createElement('span');
        moveNumber.className = 'move-number';
        moveNumber.textContent = `${index / 2 + 1}.`;

        const whiteMove = document.createElement('span');
        whiteMove.className = 'move-white';
        whiteMove.textContent = history[index].san;

        const blackMove = document.createElement('span');
        blackMove.className = 'move-black';
        blackMove.textContent = history[index + 1]?.san || '';

        moveRow.append(moveNumber, whiteMove, blackMove);
        movesList.appendChild(moveRow);
    }

    movesList.scrollTop = movesList.scrollHeight;
}

function getGameStatus() {
    const sideToMove = game.turn() === 'w' ? 'blancas' : 'negras';

    if (game.isCheckmate()) {
        const winner = game.turn() === 'w' ? 'negras' : 'blancas';
        return `Jaque mate. Ganan las ${winner}.`;
    }
    if (game.isStalemate()) {
        return 'Tablas por ahogado.';
    }
    if (game.isThreefoldRepetition()) {
        return 'Tablas por triple repetición.';
    }
    if (game.isInsufficientMaterial()) {
        return 'Tablas por material insuficiente.';
    }
    if (game.isDrawByFiftyMoves()) {
        return 'Tablas por la regla de los cincuenta movimientos.';
    }
    if (game.isCheck()) {
        return `Jaque. Turno de ${sideToMove}.`;
    }
    return `Turno de ${sideToMove}.`;
}

function getFinalResult() {
    if (!game.isCheckmate()) {
        return null;
    }

    const winnerColor = game.turn() === 'w' ? 'Negras' : 'Blancas';
    const loserColor = game.turn() === 'w' ? 'Blancas' : 'Negras';

    return {
        result: winnerColor === 'Blancas' ? '1-0' : '0-1',
        winner: `${winnerColor} — 1 punto`,
        loser: `${loserColor} — 0 puntos`,
        reason: 'Jaque mate',
        summary: `${winnerColor} ganan por jaque mate.`
    };
}

function finishGame(result) {
    if (!result || resultModalShown) {
        return;
    }

    clearSelection();
    resultModalShown = true;
    focusBeforeResult = document.activeElement;

    document.getElementById('result-summary').textContent = result.summary;
    document.getElementById('result-code').textContent = result.result;
    document.getElementById('result-winner').textContent = result.winner;
    document.getElementById('result-loser').textContent = result.loser;
    document.getElementById('result-reason').textContent = result.reason;
    document.getElementById('result-modal').classList.remove('hidden');
    document.getElementById('review-position').focus();
}

function closeResultModal() {
    document.getElementById('result-modal').classList.add('hidden');
    if (focusBeforeResult?.isConnected) {
        focusBeforeResult.focus();
    }
    focusBeforeResult = null;
}

function handleResultModalKeydown(event) {
    const resultModal = document.getElementById('result-modal');
    if (resultModal.classList.contains('hidden')) {
        return;
    }

    if (event.key === 'Escape') {
        event.preventDefault();
        closeResultModal();
        return;
    }

    if (event.key !== 'Tab') {
        return;
    }

    const focusableElements = [...resultModal.querySelectorAll('button:not([disabled])')];
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
    }
}

function updateStatus(overrideMessage) {
    document.getElementById('game-status').textContent = overrideMessage || getGameStatus();
    gameData.fen = game.fen();
    gameData.pgn = game.pgn();
}

function updateInterface() {
    createBoard();
    updateMovesList();
    updateStatus();
    finishGame(getFinalResult());
}

function resetGame() {
    game.reset();
    closePromotionSelector();
    closeResultModal();
    [
        'result-summary',
        'result-code',
        'result-winner',
        'result-loser',
        'result-reason'
    ].forEach((id) => {
        document.getElementById(id).textContent = '';
    });
    resultModalShown = false;
    clearSelection();
    updateInterface();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('reset-btn').addEventListener('click', resetGame);
    document.querySelectorAll('[data-promotion]').forEach((button) => {
        button.addEventListener('click', choosePromotion);
    });
    document.getElementById('cancel-promotion').addEventListener('click', () => {
        closePromotionSelector();
        clearSelection();
    });
    document.getElementById('review-position').addEventListener('click', closeResultModal);
    document.getElementById('new-game').addEventListener('click', resetGame);
    document.addEventListener('keydown', handleResultModalKeydown);
    updateInterface();
});
