#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
import Utils from "./utils.js"; // Really .ts

interface Input {
  alg: number[];
  image: number[][];
}

function bin(...bits: number[]): number {
  return bits.reduce((t, v) => (t << 1) | v);
}

const EDGE = 2;
function enhance(inp: Input, times: number): number {
  const BORDER = times + EDGE;

  // Copy the image, and wrap it in a warm blanket of zeros
  let img = inp.image.map(line => [
    ...new Array(BORDER).fill(0),
    ...line,
    ...new Array(BORDER).fill(0)
  ]);
  for (let i = 0; i < BORDER; i++) {
    img.unshift(img[0].map(_ => 0));
    img.push(img[0].map(_ => 0));
  }

  for (let k = 0; k < times; k++) {
    const next: number[][] = [];
    next.push([...img[0]]);

    for (let i = 1; i < img.length - 1; i++) {
      const line = img[i];
      const nextLine = [0];
      for (let j = 1; j < line.length - 1; j++) {
        nextLine.push(inp.alg[bin(
          img[i - 1][j - 1],
          img[i - 1][j],
          img[i - 1][j + 1],
          img[i][j - 1],
          img[i][j],
          img[i][j + 1],
          img[i + 1][j - 1],
          img[i + 1][j],
          img[i + 1][j + 1]
        )]);
      }
      nextLine.push(0);
      next.push(nextLine);
    }
    next.push([...img[0]]);
    if (k % 2) {
      // Smooth down the edges so they don't propagate in.
      for (const line of next) {
        line[1] = 0;
        line[line.length - 2] = 0;
      }
      next[1] = next[1].map(_ => 0);
      next[next.length - 2] = next[next.length - 2].map(_ => 0);
    }
    img = next;
  }
  img = img.slice(EDGE, -EDGE).map(line => line.slice(EDGE, -EDGE));
  return img.reduce((t, line) => t + line.reduce((u, v) => u + v), 0);
}

function part1(inp: Input): number {
  return enhance(inp, 2);
}

function part2(inp: Input): number {
  return enhance(inp, 50);
}

export default function main(inFile: string, trace: boolean) {
  const inp: Input = Utils.parseFile(inFile, undefined, trace);
  return [part1(inp), part2(inp)];
}

Utils.main(import.meta.url, main);
