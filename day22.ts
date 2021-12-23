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

function part1(inp: Input[]): number {
  const on = new Set<string>();
  for (const line of inp) {
    const clamped: Range[] = line.coord.map(clamp);

    for (const coord of
      Sequence.product(clamped.map(r => Sequence.rangeI(...r)))
    ) {
      if (line.dir) {
        on.add(coord.toString());
      } else {
        on.delete(coord.toString());
      }
    }
  }
  return on.size;
  return 0;
}

function part2(inp: Input[]): number {
  const xs: number[] = [];
  const ys: number[] = [];
  const zs: number[] = [];

  for (const line of inp) {
    xs.push(line.coord[0][0], line.coord[0][1] + 1);
    ys.push(line.coord[1][0], line.coord[1][1] + 1);
    zs.push(line.coord[2][0], line.coord[2][1] + 1);
  }

  inp = inp.reverse();
  xs.sort(numeric);
  ys.sort(numeric);
  zs.sort(numeric);

  let count = 0;
  // For each pair of coordinates that have a matching input
  for (const [x1, x2] of new Sequence(xs).windows(2)) {
    const x_inp = inp.filter(i => inRange(x1, i.coord[0]));
    for (const [y1, y2] of new Sequence(ys).windows(2)) {
      const y_inp = x_inp.filter(i => inRange(y1, i.coord[1]));
      for (const [z1, z2] of new Sequence(zs).windows(2)) {
        const z_inp = y_inp.filter(i => inRange(z1, i.coord[2]));
        if ((z_inp.length > 0) && (z_inp[0].dir)) {
          // If this subsection is on, add it.
          count += (x2 - x1) * (y2 - y1) * (z2 - z1);
        }
      }
    }
  }

  return count;
}

export default function main(inFile: string, trace: boolean) {
  const inp: Input[] = Utils.parseFile(inFile, undefined, trace);
  return [part1(inp), part2(inp)];
}

Utils.main(import.meta.url, main);
