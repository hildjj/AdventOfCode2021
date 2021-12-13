#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
import Utils from "./utils.js"; // Really .ts

type Direction = "x" | "y";
type Fold = [dir: Direction, size: number];

interface Input {
  dots: number[][];
  folds: Fold[];
}

type Point = {
  x: number;
  y: number;
};

class Page {
  dots: { [id: string]: Point } = {};

  constructor(inp: Input) {
    for (const [x, y] of inp.dots) {
      this.dots[`${x},${y}`] = { x, y };
    }
  }

  fold(dir: Direction, size: number) {
    const old = this.dots;
    this.dots = {};
    for (let { x, y } of Object.values(old)) {
      if (dir === "x") {
        if (x > size) {
          x = size - (x - size);
        }
      } else {
        if (y > size) {
          y = size - (y - size);
        }
      }
      this.dots[`${x},${y}`] = { x, y };
    }
  }

  toString() {
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const { x, y } of Object.values(this.dots)) {
      maxX = Math.max(x, maxX);
      maxY = Math.max(y, maxY);
    }
    let res = "";
    for (let j = 0; j <= maxY; j++) {
      for (let i = 0; i <= maxX; i++) {
        if (this.dots[`${i},${j}`]) {
          res += "\u{2588}";
        } else {
          res += " ";
        }
      }
      res += "\n";
    }
    return res;
  }
}

function part1(inp: Input): number {
  const p = new Page(inp);
  p.fold(...inp.folds[0]);
  return Object.keys(p.dots).length;
}

function part2(inp: Input): string {
  const p = new Page(inp);
  for (const fold of inp.folds) {
    p.fold(...fold);
  }
  return p.toString();
}

export default function main(inFile: string, trace: boolean) {
  const inp: Input = Utils.parseFile(inFile, undefined, trace);
  return [part1(inp), part2(inp)];
}

Utils.main(import.meta.url, main);
