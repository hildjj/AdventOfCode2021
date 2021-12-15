#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
import { Heap } from "heap-js";
import Utils from "./utils.js"; // Really .ts

type Node = {
  x: number;
  y: number;
  cost: number;
  path: number;
};

type NodeMap = { [id: string]: Node };

function search(
  unvisited: NodeMap
): number {
  let n: Node | undefined = unvisited.start;
  const end = unvisited.end;
  const pq = new Heap<Node>((a, b) => a.path - b.path);
  do {
    for (const [x1, y1] of [
      [n.x, n.y + 1],
      [n.x, n.y - 1],
      [n.x + 1, n.y],
      [n.x - 1, n.y]
    ]) {
      const nn = unvisited[`${x1},${y1}`];
      if (nn) {
        const newCost = n.path + nn.cost;
        if (newCost < nn.path) {
          nn.path = newCost;
          pq.push(nn);
        }
      }
    }
    delete unvisited[`${n.x},${n.y}`];
    if (n === end) {
      return n.path;
    }

    n = pq.pop();
  } while (n);
  return Infinity;
}

function init(inp: number[][], copies = 1): NodeMap {
  const unvisited: NodeMap = {};
  for (let i = 0; i < inp.length; i++) {
    for (let j = 0; j < inp[i].length; j++) {
      for (let v = 0; v < copies; v++) {
        for (let w = 0; w < copies; w++) {
          const x = i + (v * inp.length);
          const y = j + (w * inp[i].length);
          unvisited[`${x},${y}`] = {
            x,
            y,
            cost: ((inp[i][j] + v + w) % 9) || 9, // 1-9, cycling
            path: Infinity,
          };
        }
      }
    }
  }
  const start = unvisited["0,0"];
  start.path = 0;
  unvisited.start = start;
  unvisited.end = unvisited[
    `${(inp.length * copies) - 1},${(inp[0].length * copies) - 1}`
  ];
  return unvisited;
}

function part1(inp: number[][]): number {
  const unvisited = init(inp);
  return search(unvisited);
}

function part2(inp: number[][]): number {
  const unvisited = init(inp, 5);
  return search(unvisited);
}

export default function main(inFile: string, trace: boolean) {
  const inp: number[][] = Utils.parseFile(inFile, undefined, trace);
  return [part1(inp), part2(inp)];
}

Utils.main(import.meta.url, main);
