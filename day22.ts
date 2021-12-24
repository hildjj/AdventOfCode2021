#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
import Sequence from "./sequence.js";
import Utils from "./utils.js"; // Really .ts

type Range = [number, number];
interface Input {
  dir: 0 | 1;
  coord: Range[];
}

function numeric(a: number, b: number): number {
  return a - b;
}

function inRange(i: number, r: Range): boolean {
  return (r[0] <= i) && (i <= r[1]);
}

function clamp(r: Range): Range {
  const res: Range = [...r];
  if (r[0] < -50) {
    res[0] = -50;
  } else if (r[0] > 50) {
    res[0] = 51;
  }
  if (r[1] > 50) {
    res[1] = 50;
  } else if (r[1] < -50) {
    res[1] = -51;
  }
  return res;
}

const DIRS = [0, 1, 2];
const [X, Y, Z] = DIRS;

function calc(inp: Input[], clamp?: (r: Range) => Range): number {
  const points: number[][] = [[], [], []];

  for (const line of inp) {
    for (const dir of DIRS) {
      let r: Range = [line.coord[dir][0], line.coord[dir][1] + 1];
      if (clamp) {
        r = clamp(r);
      }
      points[dir].push(...r);
    }
  }

  // Get rid of dupes, calculate pairs
  const seqs: number[][][] = points.map<number[][]>(
    p => new Sequence([...new Set(p)].sort(numeric)).windows(2).toArray()
  );

  let count = 0;
  // For each pair of coordinates that have a matching input
  for (const [x1, x2] of seqs[X]) {
    const x_inp = inp.filter(i => inRange(x1, i.coord[X]));
    for (const [y1, y2] of seqs[Y]) {
      const y_inp = x_inp.filter(i => inRange(y1, i.coord[Y]));
      for (const [z1, z2] of seqs[Z]) {
        const z_inp = y_inp.filter(i => inRange(z1, i.coord[Z]));
        // All of z_inp are the overlapping boxes.  Use the last one.
        if ((z_inp.length > 0) && (z_inp[z_inp.length - 1].dir)) {
          // If this box is on, add it.
          count += (x2 - x1) * (y2 - y1) * (z2 - z1);
        }
      }
    }
  }

  return count;
}

function part1(inp: Input[]): number {
  return calc(inp, clamp);
}

function part2(inp: Input[]): number {
  return calc(inp);
}

export default function main(inFile: string, trace: boolean) {
  const inp: Input[] = Utils.parseFile(inFile, undefined, trace);
  return [part1(inp), part2(inp)];
}

Utils.main(import.meta.url, main);
