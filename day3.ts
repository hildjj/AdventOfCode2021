#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
import Utils from "./utils.js"; // Really .ts

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ident(_: number): boolean { return true; }

function toInt(a: number[], pred = ident): number {
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
  const x = toInt(counts, v => v > mid);
  const y = x ^ (2 ** len - 1);
  return x * y;
}

function part2(inp: number[][]): number {
  let inp1 = [...inp];
  let inp2 = [...inp];
  function count(np: number[][], j: number): number {
    return np.reduce((t, v) => t + (v[j] === 1 ? 1 : 0), 0);
  }
  let bit = 0;
  while (inp1.length > 1) {
    const crit = (count(inp1, bit) >= inp1.length / 2) ? 1 : 0;
    // eslint-disable-next-line @typescript-eslint/no-loop-func
    inp1 = inp1.filter(v => v[bit] === crit);
    bit++;
  }
  const x = parseInt(inp1[0].join(""), 2);

  bit = 0;
  while (inp2.length > 1) {
    const crit = (count(inp2, bit) < inp2.length / 2) ? 1 : 0;
    // eslint-disable-next-line @typescript-eslint/no-loop-func
    inp2 = inp2.filter(v => v[bit] === crit);
    bit++;
  }
  const y = parseInt(inp2[0].join(""), 2);
  return x * y;
}

export default function main(inFile: string, trace: boolean) {
  const inp: number[][] = Utils.parseFile(inFile, undefined, trace);
  return [part1(inp), part2(inp)];
}

Utils.main(import.meta.url, main);
