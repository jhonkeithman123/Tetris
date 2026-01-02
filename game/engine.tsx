import { BlockColor, getRandomBlockColor } from "@/app/utils/blockAssets";

export interface Piece {
  type: string;
  color: BlockColor;
  shape: number[][];
  x: number;
  y: number;
}

export interface BoardCell {
  filled: boolean;
  color?: BlockColor;
}

// Tetromino shapes
export const SHAPES: { [key: string]: number[][][] } = {
  straight_block: [
    // I piece
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ],
  ],
  square_block: [
    // O piece
    [
      [1, 1],
      [1, 1],
    ],
  ],
  short_T_block: [
    // T piece
    [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 1, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
  ],
  zig_block: [
    // S piece
    [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 0, 1],
    ],
  ],
  reverse_zig_block: [
    // Z piece (reverse of S)
    [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
  ],
  cross_block: [
    // + piece (rare)
    [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
  ],
  short_L_block: [
    // J piece
    [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, 1],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
  ],
  reverse_short_L_block: [
    // mirrored J piece
    [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [1, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [1, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
    ],
  ],
  L_block: [
    // L piece
    [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [1, 0, 0],
    ],
    [
      [1, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ],
  ],
  reverse_L_block: [
    // Reverse L piece (mirror of L)
    [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, 1],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
  ],
};

// Probability of piece generation (cross_block is rare)
const PIECE_PROBABILITY: { [key: string]: number } = {
  straight_block: 10,
  square_block: 10,
  short_T_block: 10,
  zig_block: 10,
  reverse_zig_block: 10,
  short_L_block: 10,
  reverse_short_L_block: 10,
  L_block: 10,
  reverse_L_block: 10,
  cross_block: 2, // Rare piece
};

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 24;

// Combo constants
export const MAX_COMBO = 7;
export const COMBO_MULTIPLIER = 10; // +10, +20, +30, etc.

export const createEmptyBoard = (): BoardCell[][] => {
  return Array(BOARD_HEIGHT)
    .fill(null)
    .map(() =>
      Array(BOARD_WIDTH)
        .fill(null)
        .map(() => ({ filled: false }))
    );
};

export const createPiece = (boardWidth: number = BOARD_WIDTH): Piece => {
  // Weighted random selection
  const weightedTypes: string[] = [];
  Object.entries(PIECE_PROBABILITY).forEach(([type, weight]) => {
    for (let i = 0; i < weight; i++) {
      weightedTypes.push(type);
    }
  });

  const type = weightedTypes[Math.floor(Math.random() * weightedTypes.length)];
  const color = getRandomBlockColor();

  return {
    type,
    color,
    shape: SHAPES[type][0],
    x: Math.floor(boardWidth / 2) - Math.floor(SHAPES[type][0][0].length / 2),
    y: 0,
  };
};

export const checkCollision = (
  piece: Piece,
  board: BoardCell[][],
  offsetX = 0,
  offsetY = 0
): boolean => {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const newX = piece.x + x + offsetX;
        const newY = piece.y + y + offsetY;

        // Check boundaries
        if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
          return true;
        }

        // Check collision with existing blocks
        if (newY >= 0 && board[newY][newX].filled) {
          return true;
        }
      }
    }
  }
  return false;
};

export const mergePiece = (
  piece: Piece,
  board: BoardCell[][]
): BoardCell[][] => {
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));

  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const boardY = piece.y + y;
        const boardX = piece.x + x;
        if (
          boardY >= 0 &&
          boardY < BOARD_HEIGHT &&
          boardX >= 0 &&
          boardX < BOARD_WIDTH
        ) {
          newBoard[boardY][boardX] = {
            filled: true,
            color: piece.color,
          };
        }
      }
    }
  }

  return newBoard;
};

export const clearLines = (
  board: BoardCell[][]
): { newBoard: BoardCell[][]; linesCleared: number } => {
  let linesCleared = 0;

  const newBoard = board.filter((row) => {
    if (row.every((cell) => cell.filled)) {
      linesCleared++;
      return false;
    }
    return true;
  });

  // Add empty rows at top
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(
      Array(BOARD_WIDTH)
        .fill(null)
        .map(() => ({ filled: false }))
    );
  }

  return { newBoard, linesCleared };
};

export const rotatePiece = (
  piece: Piece,
  rotation: number,
  board: BoardCell[][]
): { piece: Piece; rotation: number } | null => {
  const shapes = SHAPES[piece.type];
  const nextRotation = (rotation + 1) % shapes.length;
  const rotatedPiece = { ...piece, shape: shapes[nextRotation] };

  // Try to rotate at current position
  if (!checkCollision(rotatedPiece, board)) {
    return { piece: rotatedPiece, rotation: nextRotation };
  }

  // Wall kick - try moving left or right
  const wallKickOffsets = [1, -1, 2, -2];
  for (const offset of wallKickOffsets) {
    if (!checkCollision(rotatedPiece, board, offset, 0)) {
      return {
        piece: { ...rotatedPiece, x: rotatedPiece.x + offset },
        rotation: nextRotation,
      };
    }
  }

  // Floor kick - try moving up
  for (let i = 1; i <= 2; i++) {
    if (!checkCollision(rotatedPiece, board, 0, -i)) {
      return {
        piece: { ...rotatedPiece, y: rotatedPiece.y - i },
        rotation: nextRotation,
      };
    }
  }

  return null;
};

export const movePiece = (
  piece: Piece,
  board: BoardCell[][],
  direction: "left" | "right" | "down"
): Piece | null => {
  const offsets = {
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
    down: { x: 0, y: 1 },
  };

  const offset = offsets[direction];

  if (!checkCollision(piece, board, offset.x, offset.y)) {
    return { ...piece, x: piece.x + offset.x, y: piece.y + offset.y };
  }

  return null;
};

export const hardDrop = (piece: Piece, board: BoardCell[][]): Piece => {
  let dropDistance = 0;
  while (!checkCollision(piece, board, 0, dropDistance + 1)) {
    dropDistance++;
  }

  return { ...piece, y: piece.y + dropDistance };
};

export const renderBoardWithPiece = (
  board: BoardCell[][],
  piece: Piece | null
): BoardCell[][] => {
  const displayBoard = board.map((row) => row.map((cell) => ({ ...cell })));

  if (piece) {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardY = piece.y + y;
          const boardX = piece.x + x;
          if (
            boardY >= 0 &&
            boardY < BOARD_HEIGHT &&
            boardX >= 0 &&
            boardX < BOARD_WIDTH
          ) {
            displayBoard[boardY][boardX] = {
              filled: true,
              color: piece.color,
            };
          }
        }
      }
    }
  }

  return displayBoard;
};

export const calculateScore = (linesCleared: number, level: number): number => {
  return linesCleared * 100 * level;
};

/**
 * Calculate combo bonus score
 * @param comboCount - Current combo count (1-7)
 * @returns Bonus points to add to score
 */
export const calculateComboBonus = (comboCount: number): number => {
  if (comboCount <= 0) return 0;
  // Clamp combo to MAX_COMBO
  const clampedCombo = Math.min(comboCount, MAX_COMBO);
  return clampedCombo * COMBO_MULTIPLIER; // +10, +20, +30, ..., +70
};

/**
 * Update combo count based on lines cleared
 * @param currentCombo - Current combo count
 * @param linesCleared - Number of lines just cleared
 * @returns New combo count
 */
export const updateCombo = (
  currentCombo: number,
  linesCleared: number
): number => {
  if (linesCleared > 0) {
    // Increment combo, max at MAX_COMBO
    return Math.min(currentCombo + 1, MAX_COMBO);
  }
  // Reset combo if no lines cleared
  return 0;
};
