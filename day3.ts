#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
import Sequence from "./sequence.js";
import Utils from "./utils.js"; // Really .ts

function part1(inp: string[][]): number {
  const counts = inp[0].map(_ => 0);
  const ones = parseInt(inp[0].map<string>(_ => "1").join(""), 2);
  for (const p of inp) {
    for (const [i, x] of p.entries()) {
      counts[i] += (x === "1") ? 1 : 0;
    }
  }
  const x = parseInt(counts.map(x => (x > inp.length / 2) ? 1 : 0).join(""), 2);
  const y = x ^ ones;
  return x * y;
}

function part2(inp: string[][]): number {
  let inp1 = [...inp];
  let inp2 = [...inp];
  function count(np: string[][], j: number): number {
    return np.reduce((t, v) => t + (v[j] === "1" ? 1 : 0), 0);
  }
  let bit = 0;
  while (inp1.length > 1) {
    const crit = (count(inp1, bit) >= inp1.length / 2) ? "1" : "0";
    inp1 = inp1.filter(v => v[bit] === crit);
    bit++;
  }
  console.log(inp1[0].join(""));
  const x = parseInt(inp1[0].join(""), 2);

  bit = 0;
  while (inp2.length > 1) {
    const crit = (count(inp2, bit) < inp2.length / 2) ? "1" : "0";
    inp2 = inp2.filter(v => v[bit] === crit);
    bit++;
  }
  console.log(inp2[0].join(""));
  const y = parseInt(inp2[0].join(""), 2);
  return x * y;
}

export default function main(inFile: string, trace: boolean) {
  const inp: string[][] = Utils.parseFile(inFile, undefined, trace);
  return [part1(inp), part2(inp)];
}

Utils.main(import.meta.url, main);
