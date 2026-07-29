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

const PRIORITY = [4, 0, 2, 6, 8, 1, 3, 5, 7];

function getOptimalMove(board: string[], ai: string, human: string): number {
  let bestScore = -Infinity;
  const candidates: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = ai;
      const score = minimax(board, 0, false, ai, human);
      board[i] = '';
      if (score > bestScore) {
        bestScore = score;
        candidates.length = 0;
        candidates.push(i);
      } else if (score === bestScore) {
        candidates.push(i);
      }
    }
  }
  if (candidates.length === 1) return candidates[0];
  candidates.sort((a, b) => PRIORITY.indexOf(a) - PRIORITY.indexOf(b));
  return candidates[0];
}

function getWorstMove(board: string[], ai: string, human: string): number {
  let worstScore = Infinity;
  const candidates: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = ai;
      const score = minimax(board, 0, false, ai, human);
      board[i] = '';
      if (score < worstScore) {
        worstScore = score;
        candidates.length = 0;
        candidates.push(i);
      } else if (score === worstScore) {
        candidates.push(i);
      }
    }
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function getBestMove(
  board: string[],
  forceUnder = false,
): number {
  const ai = 'O';
  const human = 'X';
  if (forceUnder) return getWorstMove(board, ai, human);
  return getOptimalMove(board, ai, human);
}
