#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
import Utils from "./utils.js"; // Really .ts

function grow(input: number[], days: number): number {
  // Count the number of fishes at each generation
  const fishes = input.reduce((t, v) => {
    t[v]++;
    return t;
  }, new Array(9).fill(0));
  for (let day = 0; day < days; day++) {
    const n = fishes.shift();
    fishes.push(n); // Progeny
    fishes[6] += n; // Stayin' alive.
  }
  return fishes.reduce((t, v) => t + v, 0);
}

function part1(inp: number[]): number {
  return grow(inp, 80);
}

function part2(inp: number[]): number {
  return grow(inp, 256);
}

export default function main(inFile: string, trace: boolean) {
  const inp: number[] = Utils.parseFile(inFile, undefined, trace);
  return [part1(inp), part2(inp)];
}

Utils.main(import.meta.url, main);
