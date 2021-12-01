#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
import Utils from "./utils";

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
  const prev: number[] = [];
  let last = Infinity;
  let count = 0;
  for (const i of inp) {
    if (prev.length === 3) {
      prev.shift();
    }
    prev.push(i);
    console.log(prev);
    if (prev.length === 3) {
      const n = prev.reduce<number>((t, v) => t + v, 0);
      if (n > last) {
        count++;
      }
      console.log(last, n, count)
      last = n;
    }
  }
  return count;
}

export default function main(
  inFile: string, trace: boolean, args: unknown
) {
  const inp: number[] = Utils.parseFile(inFile, undefined, trace);
  return [part1(inp), part2(inp)];
}

Utils.main(import.meta.url, main);
