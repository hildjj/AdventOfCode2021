#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
import Sequence from "./sequence.js";
import Utils from "./utils.js"; // Really .ts

function part1(inp: number[]): number {
  let count = 0;
  inp.reduce((t, v) => {
    if (v > t) { count++; }
    return v;
  }, Infinity);
  return count;
}

function part2(inp: number[]): number {
  return new Sequence(inp)
    .windows(4)
    .filter(w => w[3] > w[0])
    .count();
}

export default function main(inFile: string, trace: boolean) {
  const inp: number[] = Utils.parseFile(inFile, undefined, trace);
  return [part1(inp), part2(inp)];
}

Utils.main(import.meta.url, main);
