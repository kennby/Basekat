let gameSessions = new Map();

function createBoard(rows, cols, initialValue = 0) {
  const board = [];
  for (let i = 0; i < rows; i++) {
    board[i] = new Array(cols).fill(initialValue);
  }
  return board;
}

function placeSnake(board) {
  const y = Math.floor(Math.random() * board[0].length);
  board[0][y] = '🐍';
}

function printHiddenBoard(conn, m, revealedBoard) {
  let result = '*Búsqueda de Serpiente*\n\nPara jugar elije la casilla que quieras destapar, ejemplo: 2';
  for (let i = 0; i < revealedBoard.length; i++) {
    for (let j = 0; j < revealedBoard[i].length; j++) {
      result += revealedBoard[i][j] ? '⬛ ' : '⬜ ';
    }
    result += '\n';
  }
  conn.reply(m.chat, result, m);
}

function printRevealedBoard(conn, m, revealedBoard, gameBoard) {
  let result = '*Búsqueda de Serpiente*\n\nPara jugar elije la casilla que quieras destapar, ejemplo: 2';
  for (let i = 0; i < revealedBoard.length; i++) {
    for (let j = 0; j < revealedBoard[i].length; j++) {
      result += revealedBoard[i][j] ? gameBoard[i][j] + ' ' : '⬜ ';
    }
    result += '\n';
  }
  conn.reply(m.chat, result, m);
}

async function findSnake(conn, m, y, userId) {
  const userSession = gameSessions.get(userId);
  if (userSession.revealedBoard[0][y]) {
    conn.reply(m.chat, 'Ya has buscado en esta posición.', m);
  } else if (userSession.gameBoard[0][y] === 'S') {
    userSession.revealedBoard[0][y] = true;
    printRevealedBoard(conn, m, userSession.revealedBoard, userSession.gameBoard);
    conn.reply(m.chat, '*¡Encontraste la serpiente! ¡Has ganado!*', m);
    gameSessions.delete(userId);
  } else {
    userSession.revealedBoard[0][y] = true;
    printRevealedBoard(conn, m, userSession.revealedBoard, userSession.gameBoard);

    userSession.attempts--;

    if (userSession.attempts === 0) {
      conn.reply(m.chat, 'No encontraste la serpiente. Se han agotado tus intentos. *¡Juego terminado!*', m);
      gameSessions.delete(userId);
    } else {
      conn.reply(m.chat, `No encontraste la serpiente. Te quedan ${userSession.attempts} intentos. *¡Inténtalo de nuevo!*`, m);
    }
  }
}

let handler = async (m, { conn }) => {
  const userId = m.sender;
  if (gameSessions.has(userId)) {
    conn.reply(m.chat, '*Ya tienes un juego en curso.* Completa o cancela el juego actual antes de iniciar uno nuevo.', m);
    return;
  }
  const numCols = 4;

  const userGameBoard = createBoard(1, numCols);
  const userRevealedBoard = createBoard(1, numCols, false);

  placeSnake(userGameBoard);
  gameSessions.set(userId, { gameBoard: userGameBoard, revealedBoard: userRevealedBoard, attempts: 2 });

  const userSession = gameSessions.get(userId);
  printHiddenBoard(conn, m, userSession.revealedBoard);
};

handler.help = ['buscarserpiente'];
handler.tags = ['game'];
handler.command = /^(buscarserpiente)$/i;

handler.before = async (m, { conn }) => {
  const userId = m.sender;
  const input = m.text.trim();
  const userSession = gameSessions.get(userId);

  if (/^\d+$/i.test(input)) {
    const y = parseInt(input) - 1;
    if (y >= 0 && y < userSession.gameBoard[0].length) {
      findSnake(conn, m, y, userId);
    } else {
      conn.reply(m.chat, 'Posición inválida. Debes ingresar un número dentro del rango del tablero.', m);
    }
  }
};

export default handler;