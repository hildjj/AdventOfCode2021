#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
import Utils from "./utils.js"; // Really .ts

type BoardNum = number[][];

/**
 * Output of the parser.
 */
interface Input {
  balls: number[];
  boards: BoardNum[];
}

class Cell {
  /** Has this number been called? */
  marked = false;

  num: number;

  constructor(n: number) {
    this.num = n;
  }
}

class Board {
  cells: Cell[][];

  won = false;

  constructor(bn: BoardNum) {
    this.cells = bn.map(row => row.map(c => new Cell(c)));
  }

  [Symbol.iterator]() {
    return this.cells[Symbol.iterator]();
  }

  toString() {
    return this.cells.map(r => r.map(c => c.marked ? "X" : c.num));
  }

  isWinner(): boolean {
    // Rows
    if (this.cells.some(r => r.every(c => c.marked))) {
      return true;
    }
    // Columns
    for (let i = 0; i < this.cells[0].length; i++) {
      if (this.cells.every(r => r[i].marked)) {
        return true;
      }
    }
    return false;
  }

  score(): number {
    return this.cells.reduce(
      (t, row) => t + row.reduce(
        (v, cell) => v + (cell.marked ? 0 : cell.num),
        0
      ), 0
    );
  }

  mark(ball: number) {
    for (const row of this) {
      for (const cell of row) {
        if (cell.num === ball) {
          cell.marked = true;
        }
      }
    }
  }
}

function part1(inp: Input): number {
  const boards = inp.boards.map(b => new Board(b));

  for (const ball of inp.balls) {
    for (const board of boards) {
      board.mark(ball);
      if (board.isWinner()) {
        return board.score() * ball;
      }
    }
  }

  return 0;
}

function part2(inp: Input): number {
  const boards = inp.boards.map(b => new Board(b));

  let lastBoard: Board | null = null;
  let lastBall = Infinity;
  for (const ball of inp.balls) {
    let done = true;
    for (const board of boards) {
      if (!board.won) {
        board.mark(ball);
        if (board.isWinner()) {
          board.won = true;
          lastBoard = board;
          lastBall = ball;
        }
        done = false;
      }
    }
    if (done) {
      break;
    }
  }
  if (!lastBoard) {
    return 0;
  }
  return lastBoard.score() * lastBall;
}

export default function main(inFile: string, trace: boolean) {
  const inp: Input = Utils.parseFile(inFile, undefined, trace);
  return [part1(inp), part2(inp)];
}

Utils.main(import.meta.url, main);
