#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
/* eslint-disable @typescript-eslint/no-loop-func */
import Utils from "./utils.js"; // Really .ts

function toInt(a: number[], pred: (n: number) => boolean): number {
  return a.reduce((t, v) => (t << 1) + (pred(v) ? 1 : 0), 0);
}

function part1(inp: number[][]): number {
  const len = inp[0].length;
  const counts = new Array(len).fill(0);
  for (const p of inp) {
    for (const [i, x] of p.entries()) {
      counts[i] += x;
    }
  }
  const mid = inp.length / 2;
  const gamma = toInt(counts, v => v > mid);
  const epsilon = gamma ^ (2 ** len - 1);
  return gamma * epsilon;
}

function part2(inp: number[][]): number {
  function count(np: number[][], j: number): number {
    return np.reduce((t, v) => t + v[j], 0);
  }
  let bit = 0;
  let inp1 = [...inp];
  while (inp1.length > 1) {
    const crit = (count(inp1, bit) >= inp1.length / 2) ? 1 : 0;
    inp1 = inp1.filter(v => v[bit] === crit);
    bit++;
  }
  const ox = inp1[0].reduce((t, v) => (t << 1) + v, 0);

  bit = 0;
  inp1 = [...inp];
  while (inp1.length > 1) {
    const crit = (count(inp1, bit) < inp1.length / 2) ? 1 : 0;
    inp1 = inp1.filter(v => v[bit] === crit);
    bit++;
  }
  const co2 = inp1[0].reduce((t, v) => (t << 1) + v, 0);
  return ox * co2;
}

export default function main(inFile: string, trace: boolean) {
  const inp: number[][] = Utils.parseFile(inFile, undefined, trace);
  return [part1(inp), part2(inp)];
}

Utils.main(import.meta.url, main);
