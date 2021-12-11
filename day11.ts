#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
import Utils from "./utils.js"; // Really .ts

function each(
  inp: number[][], fn: (i: number, j: number) => number
): number {
  let count = 0;
  for (let i = 1; i < inp.length - 1; i++) {
    for (let j = 1; j < inp[i].length - 1; j++) {
      count += fn(i, j);
    }
  }
  return count;
}

function flash(inp: number[][], i: number, j: number, incr = 0): number {
  inp[i][j] += incr;
  if (inp[i][j] > 9) {
    inp[i][j] = -Infinity;
    return 1
      + flash(inp, i - 1, j - 1, 1)
      + flash(inp, i - 1, j, 1)
      + flash(inp, i - 1, j + 1, 1)
      + flash(inp, i, j - 1, 1)
      + flash(inp, i, j + 1, 1)
      + flash(inp, i + 1, j - 1, 1)
      + flash(inp, i + 1, j, 1)
      + flash(inp, i + 1, j + 1, 1);
  }
  return 0;
}

function reset(inp: number[][]) {
  return each(inp, (i, j) => {
    if (inp[i][j] === -Infinity) {
      inp[i][j] = 0;
      return 1;
    }
    return 0;
  });
}

function part1(inp: number[][]): number {
  // Copy
  inp = [...inp.map(line => [...line])];
  let count = 0;

  for (let times = 0; times < 100; times++) {
    each(inp, (i: number, j: number) => inp[i][j]++);
    let step = 0;
    do {
      step = each(inp, (i, j) => flash(inp, i, j));
      count += step;
    } while (step > 0);

    reset(inp);
  }
  return count;
}

function part2(inp: number[][]): number {
  // Copy
  inp = [...inp.map(line => [...line])];
  const all = (inp.length - 2) * (inp[0].length - 2);

  for (let times = 0; times < Infinity; times++) {
    each(inp, (i: number, j: number) => inp[i][j]++);
    let step = 0;
    do {
      step = each(inp, (i, j) => flash(inp, i, j));
    } while (step > 0);

    if (reset(inp) === all) {
      return times + 1;
    }
  }
  return Infinity;
}

export default function main(inFile: string, trace: boolean) {
  const inp: number[][] = Utils.parseFile(inFile, undefined, trace);
  // Surround with a box of -Infinity
  for (const line of inp) {
    line.unshift(-Infinity);
    line.push(-Infinity);
  }
  inp.unshift(new Array(inp[0].length).fill(-Infinity));
  inp.push(new Array(inp[0].length).fill(-Infinity));
  return [part1(inp), part2(inp)];
}

Utils.main(import.meta.url, main);
