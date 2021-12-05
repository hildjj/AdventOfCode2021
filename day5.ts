#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
import Counter from "./counter.js";
import Sequence from "./sequence.js";
import Utils from "./utils.js"; // Really .ts

function dir(a: number, b: number): number {
  return (b < a) ? -1 : 1;
}

function points(a: number, b: number): [boolean, Sequence<number>] {
  const same = a === b;
  return [same, same ? Sequence.forEver(a) : Sequence.rangeI(a, b, dir(a, b))];
}

function part1(inp: number[][]): number {
  const count = new Counter();
  for (const [x1, y1, x2, y2] of inp) {
    const [vert, xs] = points(x1, x2);
    const [horz, ys] = points(y1, y2);

    if (horz && vert) {
      // Point.  Both x and y will be infinite sequences.
      count.add(x1, y1);
    } else if (horz || vert) {
      for (const [x, y] of Sequence.zip(xs, ys)) {
        count.add(x, y);
      }
    }
  }
  return count.total(p => p > 1);
}

function part2(inp: number[][]): number {
  const count = new Counter();
  for (const [x1, y1, x2, y2] of inp) {
    const [vert, xs] = points(x1, x2);
    const [horz, ys] = points(y1, y2);

    if (horz && vert) {
      // Point.  Both x and y will be infinite sequences.
      count.add(x1, y1);
    } else {
      for (const [x, y] of Sequence.zip(xs, ys)) {
        count.add(x, y);
      }
    }
  }
  return count.total(p => p > 1);
}

export default function main(inFile: string, trace: boolean) {
  const inp: number[][] = Utils.parseFile(inFile, undefined, trace);
  return [part1(inp), part2(inp)];
}

Utils.main(import.meta.url, main);
