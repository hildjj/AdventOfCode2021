#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
import { Heap } from "heap-js";
import Utils from "./utils.js"; // Really .ts

// 65.4.3.2.10
//   A B C D

const HALL_LEN = 7;

// One nibble for each hall spot.
export enum Pod {
  Free = 0b0000,
  A = 0b0001,
  B = 0b0011,
  C = 0b0101,
  D = 0b0111
}
// 0x06543210
// e.g. D in slot 6 is 0x07000000

type PodString = keyof typeof Pod;

const Energy: { [id: number]: number } = {
  [Pod.A]: 1,
  [Pod.B]: 10,
  [Pod.C]: 100,
  [Pod.D]: 1000,
};

/** To get from hall i to stack j, HPaths[i][j] & state === 0 */
const HPaths = [
  [0, 0x00011110, 0, 0x00001110, 0, 0x00000110, 0, 0x00000100],
  [0, 0x00011100, 0, 0x00001100, 0, 0x00000100, 0, 0x00000000],
  [0, 0x00011000, 0, 0x00001000, 0, 0x00000000, 0, 0x00000000],
  [0, 0x00010000, 0, 0x00000000, 0, 0x00000000, 0, 0x00000100],
  [0, 0x00000000, 0, 0x00000000, 0, 0x00001000, 0, 0x00001100],
  [0, 0x00000000, 0, 0x00010000, 0, 0x00011000, 0, 0x00011100],
  [0, 0x00100000, 0, 0x00110000, 0, 0x00111000, 0, 0x00111100],
];

/** To get from stack i to stack j, SPaths[i][j] & state === 0 */
const SPaths = [
  [],
  [0, NaN,        0, 0x00010000, 0, 0x00011000, 0, 0x00011100],
  [],
  [0, 0x00010000, 0, NaN,        0, 0x00001000, 0, 0x00001100],
  [],
  [0, 0x00011000, 0, 0x00001000, 0, NaN,        0, 0x00000100],
  [],
  [0, 0x00011100, 0, 0x00001100, 0, 0x00000100, 0, NaN],
];

/** Distance from hall i to stack j is HDistances[i][j] */
const HDistances = [
  [0, 8, 0, 6, 0, 4, 0, 2],
  [0, 7, 0, 5, 0, 3, 0, 1],
  [0, 5, 0, 3, 0, 1, 0, 1],
  [0, 3, 0, 1, 0, 1, 0, 3],
  [0, 1, 0, 1, 0, 3, 0, 5],
  [0, 1, 0, 3, 0, 5, 0, 7],
  [0, 2, 0, 4, 0, 6, 0, 8],
];

export class Stack {
  name: Pod;

  contents: Pod[];

  depth: number;

  // Can be inserted into.  All 0+ pods in this stack are ths same as
  // this.name
  open = false;

  constructor(name: Pod, contents: Pod[], depth: number) {
    this.name = name;
    this.contents = contents;
    this.depth = depth;
  }

  toString(): string {
    let s = "";
    if (this.open && this.contents.length < this.depth) {
      s += "_";
    }
    if (this.contents.length > 0) {
      s += this.contents.reduce((t, v) => (t << 4 | v), 0).toString(16);
    }
    return s;
  }

  checkOpen(): boolean {
    if (this.contents.every(x => x === this.name)) {
      this.open = true;
      return true;
    }
    return false;
  }

  /**
   * @returns Pod that was popped, how many spots to move to get to the
   *   entrance, and the new stack state.
   */
  pop(): [Pod, number, Stack] {
    const res = this.contents[0];
    const clone = new Stack(this.name, this.contents.slice(1), this.depth);
    clone.checkOpen();
    return [res, this.depth - clone.contents.length, clone];
  }

  push(n: Pod): [number, Stack] {
    if (n !== this.name) {
      throw new Error("push to wrong stack");
    }
    if (!this.open) {
      throw new Error("push to closed stack");
    }
    const clone = new Stack(this.name, this.contents.slice(0), this.depth);
    clone.open = true;
    const cost = this.depth - this.contents.length;
    clone.contents.unshift(n);
    return [cost, clone];
  }
}

export class StateHeap extends Heap<State> {
  constructor() {
    super(State.compare);
  }

  pop(): State | undefined {
    let s: State | undefined;
    do {
      s = super.pop();
    } while (s && s.visited);
    return s;
  }
}

export class State {
  static allStates: { [id: string]: State } = {};

  hall: number;

  stacks: Stack[];

  energy: number;

  visited = false;

  constructor(hall: number, energy: number, stacks: Stack[]) {
    this.hall = hall;
    this.stacks = stacks;
    this.energy = energy;
  }

  static toString(hall: number, stacks: Stack[]): string {
    return `${hall.toString(16).padStart(7, "0")}: ${stacks.join("|")}`;
  }

  static compare(a: State, b: State): number {
    return a.energy - b.energy;
  }

  static getState(
    pending: StateHeap,
    hall: number,
    energy: number,
    stacks: Stack[]
  ): State {
    const id = this.toString(hall, stacks);
    let res = this.allStates[id];
    if (!res) {
      res = new State(hall, energy, stacks);
      this.allStates[id] = res;
      pending.push(res);
    } else if (energy < res.energy) {
      res.energy = energy;
      pending.push(res);
    }
    return res;
  }

  static toState(pending: StateHeap, inp: PodString[][]): State {
    const istacks: Pod[][] = [[], [], [], []];
    for (const line of inp) {
      for (const [o, pod] of line.entries()) {
        istacks[o].push(Pod[pod]);
      }
    }
    const stacks = [
      new Stack(Pod.A, istacks[0], inp.length),
      new Stack(Pod.B, istacks[1], inp.length),
      new Stack(Pod.C, istacks[2], inp.length),
      new Stack(Pod.D, istacks[3], inp.length),
    ];
    for (const s of stacks) {
      s.checkOpen();
    }
    return State.getState(pending, 0, 0, stacks);
  }

  toString(): string {
    return State.toString(this.hall, this.stacks) + ` ${this.energy}`;
  }

  [Symbol.for("nodejs.util.inspect.custom")]() {
    return this.toString();
  }

  done(): boolean {
    return this.stacks.every(
      x => x.open && (x.contents.length === x.depth)
    );
  }

  // Move pods to/from the hall.
  addHalls(pending: StateHeap) {
    for (const s of this.stacks) {
      if (!s) {
        throw new Error(this.toString());
      }
      if (!s.open) {
        // All of the states that would come from popping from a closed stack,
        // then putting that Pod in each available hallway slot.
        const [pod, depth, t] = s.pop();
        for (let i = 0; i < HALL_LEN; i++) {
          const newSpot = i << 2;  // 4 bits per spot

          // The path, and the final spot are all open.
          if ((this.hall & (HPaths[i][s.name] | (1 << newSpot))) === 0) {
            const newStacks = [...this.stacks];
            newStacks[s.name >> 1] = t;
            State.getState(
              pending,
              this.hall | (pod << newSpot),
              this.energy + ((depth + HDistances[i][s.name]) * Energy[pod]),
              newStacks
            );
          }
        }
      } else {
        // All of the states that would come from moving a pod in the hallway
        // to its correct open stack.
        let masked = this.hall;
        let shift = 0;
        while (masked) {
          const pod = masked & 0xf;
          if ((pod === s.name) && ((this.hall & HPaths[shift][pod]) === 0)) {
            const [depth, t] = s.push(pod);
            const newStacks = [...this.stacks];
            newStacks[pod >> 1] = t;
            State.getState(
              pending,
              this.hall & ~(0xf << (shift << 2)),
              this.energy + ((depth + HDistances[shift][pod]) * Energy[pod]),
              newStacks
            );
          }
          shift++;
          masked >>>= 4;
        }
      }
    }
  }

  addTransfers(pending: StateHeap) {
    // All of the states from transferring between two stacks directly.
    for (const s of this.stacks) {
      if (!s.open) {
        const [pod, depthUp, t] = s.pop();
        const target = this.stacks[pod >> 1];
        if (target.open) {
          const [depthDown, u] = target.push(pod);
          if ((SPaths[t.name][u.name] & this.hall) === 0) {
            const newStacks = [...this.stacks];
            newStacks[s.name >> 1] = t;
            newStacks[pod >> 1] = u;
            const pathLen = depthUp + depthDown + Math.abs(pod - s.name);
            State.getState(
              pending,
              this.hall,  // No change in a transfer
              this.energy + (pathLen * Energy[pod]),
              newStacks
            );
          }
        }
      }
    }
  }
}

let minEnergy = Infinity;
function depthFirst(pq: StateHeap) {
  for (const s of pq) {
    if (s.done()) {
      minEnergy = Math.min(minEnergy, s.energy);
    } else if (s.energy <= minEnergy) {
      const nq = new StateHeap();
      s.addHalls(nq);
      s.addTransfers(nq);
      depthFirst(nq);
    }
  }
}

function part1(inp: PodString[][]): number {
  const init = new StateHeap();
  State.toState(init, inp);

  depthFirst(init);
  return minEnergy;
}

function part2(inp: PodString[][]): number {
  minEnergy = Infinity;
  const init = new StateHeap();
  inp.splice(1, 0, ["D", "C", "B", "A"], ["D", "B", "A", "C"]);
  State.toState(init, inp);

  depthFirst(init);
  return minEnergy;
}

export default function main(inFile: string, trace: boolean) {
  const inp: PodString[][] = Utils.parseFile(inFile, undefined, trace);
  return [part1(inp), part2(inp)];
}

Utils.main(import.meta.url, main);
