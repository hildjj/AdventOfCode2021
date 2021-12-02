#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
import Utils from "./utils.js"; // Really .ts

function part1(inp: [number, number][]): number {
  const [x, y] = inp.reduce((t, v) => [t[0] + v[0], t[1] + v[1]], [0, 0]);
  return x * y;
}

function part2(inp: [number, number][]): number {
  const { x, y } = inp.reduce((t, v) => {
    const aim = t.aim + v[1];
    return { x: t.x + v[0], y: t.y + (aim * v[0]), aim };
  }, { x: 0, y: 0, aim: 0 });
  return x * y;
}

export default function main(inFile: string, trace: boolean) {
  const inp: [number, number][] = Utils.parseFile(inFile, undefined, trace);
  return [part1(inp), part2(inp)];
}

Utils.main(import.meta.url, main);
