#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
import { Sequence } from "./sequence.js";
import Utils from "./utils.js"; // Really .ts

type Pair = [number | Pair, number | Pair] | number;

interface Leaf {
  val: number;
  depth: number;
}

interface LeafClump {
  val: LeafClump[] | number;
  depth: number;
}

function isNumber(n: any): n is number {
  return typeof n === "number";
}

function explode(snails: Leaf[]): boolean {
  for (const [i, { val, depth }] of snails.entries()) {
    if (depth > 4) {
      if (i > 0) {
        snails[i - 1].val += val;
      }
      if (i < snails.length - 2) {
        snails[i + 2].val += snails[i + 1].val;
      }
      snails.splice(i, 2, { val: 0, depth: depth - 1 });
      return true;
    }
  }
  return false;
}

function split(snails: Leaf[]): boolean {
  for (const [i, { val, depth }] of snails.entries()) {
    if (val >= 10) {
      const half = val / 2;
      snails.splice(
        i,
        1,
        { val: Math.floor(half), depth: depth + 1 },
        { val: Math.ceil(half), depth: depth + 1 }
      );
      return true;
    }
  }
  return false;
}

function add(...snails: Leaf[][]): Leaf[] {
  const res = snails.flatMap(
    n => n.map(({ val, depth }) => ({ val, depth: depth + 1 }))
  );
  while (explode(res) || split(res)) {
    // Keep going
  }
  return res;
}

function tree(snails: Leaf[]): LeafClump {
  let res: LeafClump[] = snails;
  do {
    let i = 0;
    // Clump together two adjacent things that are at the same depth,
    // until we get them all.
    for (const [left, right] of new Sequence(res).windows(2)) {
      if (left.depth === right.depth) {
        res = [
          ...res.slice(0, i),
          { val: [left, right], depth: left.depth - 1 },
          ...res.slice(i + 2),
        ];
        break;
      }
      i++;
    }
  } while (res.length > 1);

  return res[0];
}

function magnitude(snails: Leaf[]): number {
  function sum(c: LeafClump): number {
    return isNumber(c.val) ? c.val : 3 * sum(c.val[0]) + 2 * sum(c.val[1]);
  }
  return sum(tree(snails));
}

function adjacent(a: Pair, depth = 0): Leaf[] {
  if (isNumber(a)) {
    return [{ val: a, depth }];
  }
  return a.flatMap(x => adjacent(x, depth + 1));
}

function fromJSON(inp: string[]): Leaf[][] {
  const snails: Leaf[][] = [];
  for (const line of inp) {
    snails.push(adjacent(JSON.parse(line)));
  }
  return snails;
}

function part1(inp: string[]): number {
  const snails = fromJSON(inp);
  return magnitude(snails.reduce((t, v) => add(t, v)));
}

function part2(inp: string[]): number {
  const snails: Leaf[][] = fromJSON(inp);
  let max = -Infinity;
  for (const [x, y] of new Sequence(snails).permutations(2)) {
    // Add is destructive.  Make sure to clone first.
    max = Math.max(max, magnitude(add([...x], [...y])));
  }

  return max;
}

export default function main(inFile: string, trace: boolean) {
  const inp: string[] = Utils.parseFile(inFile, undefined, trace);
  return [part1(inp), part2(inp)];
}

Utils.main(import.meta.url, main);
