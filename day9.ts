#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
import Utils from "./utils.js"; // Really .ts

function lowPoints(inp: number[][]): [number, number, number][] {
  const low: [number, number, number][] = [];
  for (const [i, line] of inp.entries()) {
    for (const [j, num] of line.entries()) {
      if (((i === 0) || (inp[i - 1][j] > num))
          && ((j === 0) || (inp[i][j - 1] > num))
          && ((i === inp.length - 1) || (inp[i + 1][j] > num))
          && ((j === line.length - 1) || (inp[i][j + 1] > num))
      ) {
        low.push([i, j, num]);
      }
    }
  }
  return low;
}

function part1(inp: number[][]): number {
  return lowPoints(inp).reduce((t, [, , num]) => t + num + 1, 0);
}

function flow(
  inp: number[][], i: number, j: number, found: Set<string>
): Set<string> {
  const ij = `${i},${j}`;
  if (found.has(ij) || (inp[i][j] === 9)) {
    return found;
  }
  found.add(ij);
  if (i > 0) {
    flow(inp, i - 1, j, found);
  }
  if (j > 0) {
    flow(inp, i, j - 1, found);
  }
  if (i < inp.length - 1) {
    flow(inp, i + 1, j, found);
  }
  if (j < inp[0].length - 1) {
    flow(inp, i, j + 1, found);
  }
  return found;
}

function part2(inp: number[][]): number {
  const low = lowPoints(inp);
  const basins = low.map(([i, j]) => flow(inp, i, j, new Set<string>()));
  basins.sort((a, b) => b.size - a.size);

  return basins[0].size * basins[1].size * basins[2].size;
}

export default function main(inFile: string, trace: boolean) {
  const inp: number[][] = Utils.parseFile(inFile, undefined, trace);
  return [part1(inp), part2(inp)];
}

Utils.main(import.meta.url, main);
