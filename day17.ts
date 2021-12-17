#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
import { Sequence } from "./sequence.js";
import Utils from "./utils.js"; // Really .ts

interface Input {
  x: [number, number];
  y: [number, number];
}

function* yPos(v: number): Generator<number, void, undefined> {
  let pos = 0;
  while (true) {
    yield pos;
    pos += v;
    v--;
  }
}

function* xPos(v: number): Generator<number, void, undefined> {
  let pos = 0;
  while (true) {
    yield pos;
    pos += v;
    if (v < 0) {
      v++;
    } else if (v > 0) {
      v--;
    }
  }
}

function part1(inp: Input): number {
  const minY = Math.min(...inp.y);
  const maxY = Math.max(...inp.y);
  const lim = 2 * Math.abs(minY);
  let max = -Infinity;
  for (let i = 0; i < lim; i++) {
    const stops = [
      ...new Sequence(yPos(i)).until(y => y < minY).startWhen(y => y < maxY)
    ];
    if (stops.length > 0) {
      max = i;
    }
  }
  return Math.max(...new Sequence(yPos(max)).until(y => y < minY));
}

function part2(inp: Input): number {
  let tot = 0;
  const minX = Math.min(...inp.x);
  const maxX = Math.max(...inp.x);
  const minY = Math.min(...inp.y);
  const maxY = Math.max(...inp.y);
  const xlim = 2 * Math.abs(maxX);
  const ylim = 2 * Math.abs(minY);

  for (let i = -ylim; i < ylim; i++) {
    const ystops = [
      ...new Sequence(yPos(i))
        .map((y, i) => [y, i])
        .until(([y]) => y < minY)
        .startWhen(([y]) => y <= maxY)
    ];
    if (ystops.length > 0) {
      const xSet = new Set<number>();
      for (const [_, steps] of ystops) {
        // Find all Vx0 such that we'll end up in the box at step steps.
        // Catch dups.
        for (let j = 1; j < xlim; j++) {
          const x = new Sequence(xPos(j)).at(steps);
          if (x && (x >= minX) && (x <= maxX)) {
            if (!xSet.has(j)) {
              xSet.add(j);
              tot++;
            }
          }
        }
      }
    }
  }
  return tot;
}

export default function main(inFile: string, trace: boolean) {
  const inp: Input = Utils.parseFile(inFile, undefined, trace);
  return [part1(inp), part2(inp)];
}

Utils.main(import.meta.url, main);
