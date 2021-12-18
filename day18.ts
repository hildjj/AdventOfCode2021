#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
import { Sequence } from "./sequence.js";
import Utils from "./utils.js"; // Really .ts

type Direction = "left" | "right";
type SubPair = Pair | number;

function isNumber(n: any): n is number {
  return typeof n === "number";
}

function isPair(n: any): n is Pair {
  return typeof n !== "number";
}

function oppositeDir(d: Direction): Direction {
  return (d === "left") ? "right" : "left";
}

class Pair {
  left: SubPair;

  right: SubPair;

  parent: Pair | null = null;

  constructor(left: SubPair, right: SubPair) {
    this.left = left;
    this.right = right;
    if (isPair(left)) {
      left.parent = this;
    }
    if (isPair(right)) {
      right.parent = this;
    }
  }

  static split(n: number): Pair {
    const half = n / 2;
    return new Pair(Math.floor(half), Math.ceil(half));
  }

  static dirMost(p: Pair, d: Direction): [Pair, Direction] {
    const opposite = oppositeDir(d);
    let op: SubPair = p[opposite];
    if (isNumber(op)) {
      return [p, opposite];
    }
    while (!isNumber((op as Pair)[d])) {
      op = (op as Pair)[d];
    }
    return [op as Pair, d];
  }

  static explodeAll(p: Pair, depth = 0): boolean {
    if (depth >= 4) {
      p.explode();
      return true;
    }
    if ((typeof p.left !== "number") && Pair.explodeAll(p.left, depth + 1)) {
      return true;
    }
    if ((typeof p.right !== "number") && Pair.explodeAll(p.right, depth + 1)) {
      return true;
    }
    return false;
  }

  static splitAll(p: Pair): boolean {
    let found = false;
    if (isNumber(p.left)) {
      if (p.left >= 10) {
        p.left = Pair.split(p.left);
        p.left.parent = p;
        found = true;
      }
    } else {
      found = Pair.splitAll(p.left);
    }
    if (found) {
      return true;
    }
    if (isNumber(p.right)) {
      if (p.right >= 10) {
        p.right = Pair.split(p.right);
        p.right.parent = p;
        found = true;
      }
    } else {
      found = Pair.splitAll(p.right);
    }
    return found;
  }

  explode() {
    // Exploding pairs will always consist of two regular numbers,
    // with a parent.
    if (!this.parent) {
      throw new Error("No parent for explosion");
    }
    const dir = (this.parent.left === this) ? "left" : "right";
    const odir = oppositeDir(dir);

    // Go up until we find a branch where we're on the opposite side;
    let r: Pair | null = this.parent;
    while (r.parent && (r.parent[dir] === r)) {
      r = r.parent;
    }
    r = r.parent;
    if (r) {
      const [p, d] = Pair.dirMost(r, odir);
      (p[d] as number) += this[dir] as number;
    }
    const [p, d] = Pair.dirMost(this.parent, dir);
    (p[d] as number) += this[odir] as number;
    this.parent[dir] = 0;
  }

  reduce(): Pair {
    let found = false;
    do {
      found = Pair.explodeAll(this) || Pair.splitAll(this);
    } while (found);
    return this;
  }

  add(right: Pair): Pair {
    return new Pair(this, right).reduce();
  }

  magnitude(): number {
    const left = 3 * (
      isNumber(this.left) ? this.left : this.left.magnitude()
    );
    const right = 2 * (
      isNumber(this.right) ? this.right : this.right.magnitude()
    );
    return left + right;
  }

  clone(): Pair {
    return new Pair(
      isNumber(this.left) ? this.left : this.left.clone(),
      isNumber(this.right) ? this.right : this.right.clone()
    );
  }
}

function fromJSON(inp: string[]): Pair[] {
  const pairs: Pair[] = [];
  for (const line of inp) {
    const pair: Pair = JSON.parse(
      line,
      (k: string, x: any) => Array.isArray(x) ? new Pair(x[0], x[1]) : x
    );
    pairs.push(pair);
  }
  return pairs;
}

function part1(inp: string[]): number {
  const pairs = fromJSON(inp);
  const sum = pairs.reduce((t, v) => t.add(v));
  return sum.magnitude();
}

function part2(inp: string[]): number {
  const pairs = fromJSON(inp);
  let max = -Infinity;
  for (const [x, y] of new Sequence(pairs).permutations(2)) {
    // Add is destructive.  Make sure to clone first.
    max = Math.max(max, x.clone().add(y.clone()).magnitude());
  }

  return max;
}

export default function main(inFile: string, trace: boolean) {
  const inp: string[] = Utils.parseFile(inFile, undefined, trace);
  return [part1(inp), part2(inp)];
}

Utils.main(import.meta.url, main);
