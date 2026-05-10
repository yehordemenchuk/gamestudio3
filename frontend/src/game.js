export const EDGE_EMPTY = 0;
export const EDGE_LINE = 1;
export const EDGE_BLOCKED = 2;

/** Difficulty presets: each puzzle is built from a known valid loop, then clues are partially hidden. */
export const PUZZLE_LEVELS = [
  { name: "Easy", rows: 5, cols: 5, hiddenClueRatio: 0.22 },
  { name: "Medium", rows: 5, cols: 5, hiddenClueRatio: 0.22 },
  { name: "Hard", rows: 5, cols: 5, hiddenClueRatio: 0.22 }
];

/**
 * Single closed loop: outer border of an rows×cols cell grid (classic Slitherlink shape).
 */
export function rectangularLoopEdges(rows, cols) {
  const hEdges = Array.from({ length: rows + 1 }, () => Array(cols).fill(EDGE_EMPTY));
  const vEdges = Array.from({ length: rows }, () => Array(cols + 1).fill(EDGE_EMPTY));
  for (let c = 0; c < cols; c++) {
    hEdges[0][c] = EDGE_LINE;
    hEdges[rows][c] = EDGE_LINE;
  }
  for (let r = 0; r < rows; r++) {
    vEdges[r][0] = EDGE_LINE;
    vEdges[r][cols] = EDGE_LINE;
  }
  return { hEdges, vEdges };
}

function fullClueGridFromLoop(hEdges, vEdges, rows, cols) {
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push(countCellEdges(hEdges, vEdges, r, c));
    }
    grid.push(row);
  }
  return grid;
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/**
 * Copy grid and hide a fraction of clues (null). The underlying loop remains a solution.
 */
function hideRandomClues(fullGrid, hiddenRatio) {
  const rows = fullGrid.length;
  const cols = fullGrid[0].length;
  const positions = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) positions.push([r, c]);
  shuffleInPlace(positions);
  const hideCount = Math.min(
    positions.length - 1,
    Math.max(0, Math.floor(rows * cols * hiddenRatio))
  );
  const grid = fullGrid.map((row) => [...row]);
  for (let k = 0; k < hideCount; k++) {
    const [r, c] = positions[k];
    grid[r][c] = null;
  }
  return grid;
}

/**
 * Build a solvable puzzle: derive clues from a valid loop, then hide some numbers.
 */
export function generatePuzzleFromLevel(level) {
  const { name, rows, cols, hiddenClueRatio } = level;
  const { hEdges, vEdges } = rectangularLoopEdges(rows, cols);
  const full = fullClueGridFromLoop(hEdges, vEdges, rows, cols);
  const grid = hideRandomClues(full, hiddenClueRatio);
  const ok = checkSolvedInternal(grid, hEdges, vEdges);
  if (!ok) {
    throw new Error("Puzzle generation invariant failed");
  }
  return { name, grid };
}

/** Used at module load and in tests; each call randomizes hidden cells. */
export function createInitialPuzzleList() {
  return PUZZLE_LEVELS.map((level) => generatePuzzleFromLevel(level));
}

/** One stable set per page load (avoids Strict Mode double-init mismatch with edges). */
export const INITIAL_PUZZLES = createInitialPuzzleList();

function checkSolvedInternal(grid, hEdges, vEdges) {
  const rows = grid.length;
  const cols = grid[0].length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const clue = grid[r][c];
      if (clue === null) continue;
      if (countCellEdges(hEdges, vEdges, r, c) !== clue) return false;
    }
  }
  const graph = buildGraph(hEdges, vEdges);
  if (graph.size === 0) return false;
  for (const edges of graph.values()) {
    if (edges.length !== 2) return false;
  }
  const start = graph.keys().next().value;
  const visited = new Set();
  const stack = [start];
  while (stack.length) {
    const node = stack.pop();
    if (visited.has(node)) continue;
    visited.add(node);
    for (const neighbor of graph.get(node)) stack.push(neighbor);
  }
  return visited.size === graph.size;
}

export function createEdgeState(grid) {
  const rows = grid.length;
  const cols = grid[0].length;

  const hEdges = Array.from({ length: rows + 1 }, () =>
    Array(cols).fill(EDGE_EMPTY)
  );
  const vEdges = Array.from({ length: rows }, () =>
    Array(cols + 1).fill(EDGE_EMPTY)
  );

  return { hEdges, vEdges };
}

export function countCellEdges(hEdges, vEdges, r, c) {
  let count = 0;
  if (hEdges[r][c] === EDGE_LINE) count++;
  if (hEdges[r + 1][c] === EDGE_LINE) count++;
  if (vEdges[r][c] === EDGE_LINE) count++;
  if (vEdges[r][c + 1] === EDGE_LINE) count++;
  return count;
}

export function validateProgress(grid, hEdges, vEdges) {
  const rows = grid.length;
  const cols = grid[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const clue = grid[r][c];
      if (clue === null) continue;
      if (countCellEdges(hEdges, vEdges, r, c) > clue) {
        return false;
      }
    }
  }
  return true;
}

function buildGraph(hEdges, vEdges) {
  const rows = vEdges.length;
  const cols = hEdges[0].length;
  const graph = new Map();

  const addNode = (node) => {
    if (!graph.has(node)) graph.set(node, []);
  };
  const addEdge = (a, b) => {
    addNode(a);
    addNode(b);
    graph.get(a).push(b);
    graph.get(b).push(a);
  };

  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (hEdges[r][c] === EDGE_LINE) addEdge(`${r},${c}`, `${r},${c + 1}`);
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c <= cols; c++) {
      if (vEdges[r][c] === EDGE_LINE) addEdge(`${r},${c}`, `${r + 1},${c}`);
    }
  }

  return graph;
}

export function checkSolved(grid, hEdges, vEdges) {
  const rows = grid.length;
  const cols = grid[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const clue = grid[r][c];
      if (clue === null) continue;
      if (countCellEdges(hEdges, vEdges, r, c) !== clue) {
        return { ok: false, reasonKey: "numbersMismatch" };
      }
    }
  }

  const graph = buildGraph(hEdges, vEdges);
  if (graph.size === 0) {
    return { ok: false, reasonKey: "loopMissing" };
  }

  for (const edges of graph.values()) {
    if (edges.length !== 2) {
      return { ok: false, reasonKey: "branchOrDeadEnd" };
    }
  }

  const start = graph.keys().next().value;
  const visited = new Set();
  const stack = [start];

  while (stack.length) {
    const node = stack.pop();
    if (visited.has(node)) continue;
    visited.add(node);
    for (const neighbor of graph.get(node)) stack.push(neighbor);
  }

  if (visited.size !== graph.size) {
    return { ok: false, reasonKey: "multipleLoops" };
  }

  return { ok: true, reasonKey: "solved" };
}

/**
 * Points for POST /api/v1/scores (field `score`): tier, grid size, loop length, solve time.
 * Always a non-negative integer suitable for @PositiveOrZero.
 */
export function computeSubmittedScore(levelIndex, rows, cols, loopEdgeCount, elapsedMs) {
  const cells = rows * cols;
  const tier = [1, 1.2, 1.35][levelIndex] ?? 1;
  const base = Math.round(100 * tier + cells * 5);
  const loopPts = Math.round(loopEdgeCount * 10);
  const elapsedSec = Math.max(0, elapsedMs / 1000);
  const timeBonus = Math.max(0, Math.round(400 - elapsedSec * 10));
  return Math.max(0, base + loopPts + timeBonus);
}

export function countLoopEdges(hEdges, vEdges) {
  let count = 0;
  for (const row of hEdges) for (const edge of row) if (edge === EDGE_LINE) count++;
  for (const row of vEdges) for (const edge of row) if (edge === EDGE_LINE) count++;
  return count;
}
