#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
import Counter from "./counter.js"; // Really .ts
import { Sequence } from "./sequence.js"; // Really .ts
import Utils from "./utils.js"; // Really .ts

type Point = [number, number, number];

type RotMatrix = [Point, Point, Point];

interface Input {
  scanner: number;
  beacons: Point[];
  rot?: Sequence<Point>[]; // All rotations for this input
  offset?: Point; // Absolute offset from scanner 0
}

const sin = [0, 1, 0, -1];
const cos = [1, 0, -1, 0];

function rotX(t: number): RotMatrix {
  return [
    [1, 0, 0],
    [0, cos[t], -sin[t] | 0], // |0 turns -0 into 0
    [0, sin[t], cos[t]],
  ];
}

function rotY(t: number): RotMatrix {
  return [
    [cos[t], 0, sin[t]],
    [0, 1, 0],
    [-sin[t] | 0, 0, cos[t]],
  ];
}

function rotZ(t: number): RotMatrix {
  return [
    [cos[t], -sin[t] | 0, 0],
    [sin[t], cos[t], 0],
    [0, 0, 1],
  ];
}

function mult(A: RotMatrix, B: RotMatrix): RotMatrix {
  return A.map(rowA => B[0].map( // Just the indexes of B[0]
    (_, xb) => rowA.reduce((t, a, yb) => t + a * B[yb][xb], 0)
  )) as RotMatrix;
}

// Found kinda emperically.  I know from previous years that there are
// lots of dups with multiple rotations, so instead of re-discovering which
// ones are correct, I put them all in a set, and removed the dups.
const allRots: RotMatrix[] = [
  rotX(0), rotX(1), rotX(2), rotX(3),
  rotY(1), rotY(2), rotY(3),
  rotZ(1), rotZ(2), rotZ(3),
  mult(rotX(1), rotY(1)), mult(rotX(1), rotY(2)), mult(rotX(1), rotY(3)),
  mult(rotX(2), rotY(1)), mult(rotX(2), rotY(3)),
  mult(rotX(3), rotY(1)), mult(rotX(3), rotY(2)), mult(rotX(3), rotY(3)),
  mult(rotX(1), rotZ(1)), mult(rotX(1), rotZ(3)),
  mult(rotX(2), rotZ(1)), mult(rotX(2), rotZ(3)),
  mult(rotX(3), rotZ(1)), mult(rotX(3), rotZ(3)),
];

function sub(a: Point, b: Point): Point {
  return a.map((x, i) => x - b[i]) as Point;
}

function add(a: Point, b: Point): Point {
  return a.map((x, i) => x + b[i]) as Point;
}

function rotate(p: Point, m: RotMatrix): Point {
  return m.map(row => row.reduce((t, d, i) => t + d * p[i], 0)) as Point;
}

function manhattan(a: Point, b: Point): number {
  return a.reduce((t, v, i) => t + Math.abs(v - b[i]), 0);
}

// I'm not happy about this.
function strToPoint(s: string): Point {
  return s.split(",").map(x => parseInt(x, 10)) as Point;
}

const rotated: Input[] = [];
function part1(inp: Input[]): number {
  const first = inp.shift() as Input;
  first.offset = [0, 0, 0];
  rotated.push(first);
  const allTried = new Counter<number>();
  const allBeacons = new Counter<Point>();

  // Each pair of sensors
  HAVE_INPUT:
  while (inp.length > 0) {
    for (const [n, i] of inp.entries()) {
      if (!i.rot) {
        i.rot = allRots.map(
          rot => new Sequence(i.beacons.map(ib => rotate(ib, rot)))
        );
      }

      // Check i against all previously-found inputs that we haven't
      // tried before
      for (const r of rotated) {
        if (allTried.add(r.scanner, i.scanner) > 1) {
          continue;
        }
        const rBeacons = new Sequence(r.beacons);

        // Check each rotation of i
        for (const iBeaconsRot of i.rot) {
          const c = new Counter();
          for (const [u, v] of Sequence.product([rBeacons, iBeaconsRot])) {
            c.add(...sub(u, v));
          }
          const entry = c.max();
          if (entry && (entry[1] >= 12)) {
            // If it matches, rotate and translate into absolute coordinates,
            // and remove it from inp
            delete i.rot;
            // Since everything previous is already in absolute coordinates,
            // the offset to the match is the absolute offset.
            i.offset = strToPoint(entry[0]);
            // Translate into absolute coordinates
            i.beacons = iBeaconsRot.map(ip => add(i.offset as Point, ip))
              .toArray();
            inp.splice(n, 1);

            // Put the new one on the front so we get to it first
            rotated.unshift(i);
            continue HAVE_INPUT;
          }
        }
      }
    }
  }

  for (const r of rotated) {
    for (const b of r.beacons) {
      allBeacons.add(b);
    }
  }

  return allBeacons.size();
}

function part2(_: Input[]): number {
  return Math.max(...new Sequence(rotated)
    .combinations(2)
    .map(([a, b]) => manhattan(a.offset as Point, b.offset as Point)));
}

export default function main(inFile: string, trace: boolean) {
  const inp: Input[] = Utils.parseFile(inFile, undefined, trace);
  return [part1(inp), part2(inp)];
}

Utils.main(import.meta.url, main);
