#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
import Counter from "./counter.js";
import Sequence from "./sequence.js";
import Utils from "./utils.js"; // Really .ts

interface Input {
  initial: string[];
  transforms: string[][];
}
type StringMap = { [id: string]: string };

function polymer(inp: Input, times: number): number {
  const trans: StringMap = Object.fromEntries(inp.transforms);
  let count = new Counter<string>();
  const seq = new Sequence(inp.initial).windows(2);
  for (const [first, second] of seq) {
    count.add(first + second);
  }
  for (let i = 0; i < times; i++) {
    const newCount = new Counter<string>();
    for (const [pair, val] of Object.entries(count.points)) {
      const mid = trans[pair];
      if (mid) {
        newCount.sum(val, pair[0] + mid);
        newCount.sum(val, mid + pair[1]);
      } else {
        newCount.sum(val, pair);
      }
    }
    count = newCount;
  }

  const letters = new Counter<string>();
  for (const [k, v] of Object.entries(count.points)) {
    letters.sum(v, k[1]);
  }
  // If we only count the second letters, we have to add the first letter
  // of the sequence back in.  That's always the first letter of the initial
  // sequence.
  letters.add(inp.initial[0]);
  const vals = Object.values(letters.points);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  return max - min;
}

function part1(inp: Input): number {
  return polymer(inp, 10);
}

function part2(inp: Input): number {
  return polymer(inp, 40);
}

export default function main(inFile: string, trace: boolean) {
  const inp: Input = Utils.parseFile(inFile, undefined, trace);
  return [part1(inp), part2(inp)];
}

Utils.main(import.meta.url, main);
