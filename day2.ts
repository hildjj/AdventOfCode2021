#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
import Utils from "./utils.js"; // Really .ts

function part1(inp: [number, number][]): number {
  const [x, y] = inp.reduce(([x, y], [dx, dy]) => [x + dx, y + dy], [0, 0]);
  return x * y;
}

function part2(inp: [number, number][]): number {
  const { x, y } = inp.reduce(({ x, y, aim }, [dX, dAim]) => {
    aim += dAim;
    x += dX;
    y += aim * dX;
    return { x, y, aim };
  }, { x: 0, y: 0, aim: 0 });
  return x * y;
}

export default function main(inFile: string, trace: boolean) {
  const inp: [number, number][] = Utils.parseFile(inFile, undefined, trace);
  return [part1(inp), part2(inp)];
}

Utils.main(import.meta.url, main);
