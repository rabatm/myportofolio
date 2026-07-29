export const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

export function checkWinner(board: string[]): string | null {
  for (const [a,b,c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

export function isBoardFull(board: string[]): boolean {
  return board.every(c => c !== '');
}

function minimax(
  board: string[],
  depth: number,
  isMaximizing: boolean,
  ai: string,
  human: string,
): number {
  const winner = checkWinner(board);
  if (winner === ai) return 10 - depth;
  if (winner === human) return depth - 10;
  if (isBoardFull(board)) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = ai;
        best = Math.max(best, minimax(board, depth + 1, false, ai, human));
        board[i] = '';
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = human;
        best = Math.min(best, minimax(board, depth + 1, true, ai, human));
        board[i] = '';
      }
    }
    return best;
  }
}

function getOptimalMove(board: string[], ai: string, human: string): number {
  let bestScore = -Infinity;
  let bestMove = -1;
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = ai;
      const score = minimax(board, 0, false, ai, human);
      board[i] = '';
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  return bestMove;
}

function getUnderMove(board: string[], ai: string, human: string): number {
  const empty = board.reduce<number[]>((acc, c, i) => (c === '' ? [...acc, i] : acc), []);
  const optimal = getOptimalMove(board, ai, human);
  const nonOptimal = empty.filter(i => i !== optimal);
  if (nonOptimal.length === 0) return optimal;
  return nonOptimal[Math.floor(Math.random() * nonOptimal.length)];
}

export function getBestMove(
  board: string[],
  forceUnder = false,
): number {
  const ai = 'O';
  const human = 'X';
  if (forceUnder) return getUnderMove(board, ai, human);
  return getOptimalMove(board, ai, human);
}
