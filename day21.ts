#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
import Counter from "./counter.js";
import Utils from "./utils.js"; // Really .ts

interface Input {
  player: number;
  pos: number;
}

let rolls = 0;

function* die(max: number): Generator<number, void, undefined> {
  let cur = 0;
  while (true) {
    rolls++;
    if (++cur > max) {
      cur = 1;
    }
    yield cur;
  }
}

function* roll3(max: number): Generator<number, void, undefined> {
  const gen = die(max);
  while (true) {
    yield (gen.next().value as number)
      + (gen.next().value as number)
      + (gen.next().value as number);
  }
}

class Player {
  num: number;

  pos: number;

  score = 0;

  constructor(inp: Input) {
    this.num = inp.player;
    this.pos = inp.pos;
  }

  move(spaces: number): boolean {
    this.pos = ((this.pos + spaces) % 10) || 10;
    this.score += this.pos;
    return this.score >= 1000;
  }
}

function part1(inp: Input[]): number {
  const die = roll3(100);
  const players = inp.map(i => new Player(i));
  let turns = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const moves = die.next().value as number;
    const player = players[turns++ % 2];
    if (player.move(moves)) {
      break;
    }
  }

  return players[turns % 2].score * rolls;
}

type ScorePos = [number, number];
const SCORE = 0;
const POS = 1;

const c = new Counter();
for (let i = 1; i <= 3; i++) {
  for (let j = 1; j <= 3; j++) {
    for (let k = 1; k <= 3; k++) {
      c.add(i + j + k);
    }
  }
}
const PROB = [...Object.entries(c.points)
  .map(([moves, count]) => [Number(moves), count])];

type Totals = [number, number];
const state: { [id: string]: Totals } = {};

function play(we: ScorePos, they: ScorePos): Totals {
  if (we[SCORE] >= 21) {
    return [1, 0];
  }
  if (they[SCORE] >= 21) {
    return [0, 1];
  }

  const key = `${we}-${they}`;
  const prev = state[key];
  if (prev) {
    return prev;
  }

  const wins: Totals = [0, 0];
  for (const [sum, times] of PROB) {
    const newPos = ((we[POS] + sum) % 10) || 10;
    const score = we[SCORE] + newPos;
    const [theirs, mine] = play(they, [score, newPos]);
    wins[0] += mine * times;
    wins[1] += theirs * times;
  }
  state[key] = wins;
  return wins;
}

function part2(inp: Input[]): number {
  return Math.max(...play([0, inp[0].pos], [0, inp[1].pos]));
}

export default function main(inFile: string, trace: boolean) {
  const inp: Input[] = Utils.parseFile(inFile, undefined, trace);
  return [part1(inp), part2(inp)];
}

Utils.main(import.meta.url, main);
