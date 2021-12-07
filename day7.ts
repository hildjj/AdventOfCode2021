#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
import Sequence from "./sequence.js";
import Utils from "./utils.js"; // Really .ts

function part1(inp: number[]): number {
  function move(a: number[], pos: number): number {
    return a.reduce<number>((t, v) => t + Math.abs(v - pos), 0);
  }
  return Math.min(...Sequence.range(inp.length).map(pos => move(inp, pos)));
}

function part2(inp: number[]): number {
  function accel(n: number): number {
    // Sequence.rangeI(n).sum() or...
    return n * (n + 1) / 2;
  }
  function move(a: number[], pos: number): number {
    return a.reduce<number>((t, v) => t + accel(Math.abs(v - pos)), 0);
  }
  return Math.min(...Sequence.range(inp.length).map(pos => move(inp, pos)));
}

export default function main(inFile: string, trace: boolean) {
  const inp: number[] = Utils.parseFile(inFile, undefined, trace);
  return [part1(inp), part2(inp)];
}

Utils.main(import.meta.url, main);
