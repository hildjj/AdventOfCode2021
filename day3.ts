#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
/* eslint-disable @typescript-eslint/no-loop-func */
import Utils from "./utils.js"; // Really .ts

function toInt(
  a: number[],
  pred: (n: number) => boolean = v => Boolean(v)
): number {
  return a.reduce((t, v) => (t << 1) + (pred(v) ? 1 : 0), 0);
}

function part1(inp: number[][]): number {
  const len = inp[0].length;
  const counts
    = inp.reduce(
      (t, line) => line.map((v, i) => t[i] + v),
      new Array(len).fill(0)
    );
  const gamma = toInt(counts, v => v * 2 > inp.length);
  const epsilon = gamma ^ (2 ** len - 1);
  return gamma * epsilon;
}

function filter(
  ary: number[][], pred: (num: number, len: number) => boolean
): number {
  function count(np: number[][], j: number): number {
    return np.reduce((t, v) => t + v[j], 0);
  }

  let a = [...ary];
  for (let bit = 0; a.length > 1; bit++) {
    const crit = pred(count(a, bit) * 2, a.length) ? 1 : 0;
    a = a.filter(v => v[bit] === crit);
  }
  return toInt(a[0]);
}

function part2(inp: number[][]): number {
  const ox = filter(inp, (x, len) => x >= len);
  const co2 = filter(inp, (x, len) => x < len);
  return ox * co2;
}

export default function main(inFile: string, trace: boolean) {
  const inp: number[][] = Utils.parseFile(inFile, undefined, trace);
  return [part1(inp), part2(inp)];
}

Utils.main(import.meta.url, main);
