#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
import Utils from "./utils.js"; // Really .ts

function part1(inp: number[]) {
  let last = Infinity;
  let count = 0;
  for (const i of inp) {
    if (i > last) {
      count++;
    }
    last = i;
  }
  return count;
}

function part2(inp: number[]) {
  let last = Infinity;
  let count = 0;
  let n = inp[0] + inp[1];
  for (let i = 2; i < inp.length; i++) {
    n = inp[i - 2] + inp[i - 1] + inp[i];
    if (n > last) {
      count++;
    }
    last = n;
  }
  return count;
}

export default function main(inFile: string, trace: boolean) {
  const inp: number[] = Utils.parseFile(inFile, undefined, trace);
  return [part1(inp), part2(inp)];
}

Utils.main(import.meta.url, main);
