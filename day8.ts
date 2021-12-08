#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
import Utils from "./utils.js"; // Really .ts

// Digits use how many segments?
// 0: 6
// 1: 2
// 2: 5
// 3: 5
// 4: 4
// 5: 5
// 6: 6
// 7: 3
// 8: 7
// 9: 6

// Segments to digits:
// 2: 1 cf
// 3: 7 acf
// 4: 4 bcdf
// 5: 2, 3, 5
// 6: 0 abcefg, 6 abdefg, 9 abcdfg
// 7: 8 abcdef

function part1(inp: string[][][]): number {
  return inp.reduce(
    (t, [_, output]) => t
      + output.filter(w => [2, 3, 4, 7].indexOf(w.length) !== -1).length
    , 0
  );
}

// Everything in a that's not in b
function minus(a: string, b: string): string {
  let ret = "";
  for (const c of a) {
    if (b.indexOf(c) === -1) {
      ret += c;
    }
  }
  return ret;
}

function sortStr(a: string): string {
  return a.split("").sort().join("");
}

type strToStr = { [id: string]: string };
type strToNum = { [id: string]: number };

function select(src: strToStr, query: string): string {
  let ret = "";
  for (const c of query) {
    ret += src[c];
  }
  return sortStr(ret);
}

// Order:
// 1: len 2 adds cf
// 4: len 4, has cf, adds bd
// 7: len 3, adds [a]
// 8: len 7
// 6: len 6: missing [c], nails [f] from 1
// 0: len 6: missing [d], nails [b] from 4
// 9: other len 6, missing [e] from 0
// [g] is the one that's left, 8 - abcdef

function part2(inp: string[][][]): number {
  let sum = 0;
  for (let [wires, output] of inp) {
    wires = wires.map(sortStr);
    output = output.map(sortStr);
    const map: strToStr = {};

    const nums = new Array<string>(10).fill("");
    nums[1] = wires.filter(w => w.length === 2)[0];
    nums[4] = wires.filter(w => w.length === 4)[0];
    nums[7] = wires.filter(w => w.length === 3)[0];
    nums[8] = wires.filter(w => w.length === 7)[0];

    map.a = minus(nums[7], nums[1]);
    const bd = minus(nums[4], nums[1]);
    const six_069 = wires.filter(w => w.length === 6);
    for (const sss of six_069) {
      const c = minus(nums[1], sss);
      if (c.length === 1) {
        map.c = c;
        map.f = minus(nums[1], c);
        nums[6] = sss;
      } else {
        const d = minus(bd, sss);
        if (d.length === 1) {
          map.d = d;
          map.b = minus(bd, d);
          nums[0] = sss;
        } else {
          nums[9] = sss;
        }
      }
    }
    map.e = minus(nums[0], nums[9]);
    map.g = minus(nums[8], select(map, "abcdef"));
    nums[2] = select(map, "acdeg");
    nums[3] = select(map, "acdfg");
    nums[5] = select(map, "abdfg");

    const words: strToNum = {};
    for (const [i, w] of nums.entries()) {
      words[w] = i;
    }
    sum += output.reduce((t, v) => (t * 10) + words[v], 0);
  }
  return sum;
}

export default function main(inFile: string, trace: boolean) {
  const inp: string[][][] = Utils.parseFile(inFile, undefined, trace);
  return [part1(inp), part2(inp)];
}

Utils.main(import.meta.url, main);
