#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
import Utils from "./utils.js"; // Really .ts
import fs from "fs";
import peggy from "peggy";

function part1(inp: string[], parser: peggy.Parser): number {
  let tot = 0;
  for (const line of inp) {
    try {
      parser.parse(line);
    } catch (er) {
      if (er instanceof Error) {
        const m = er.message.match(/but "([\]>})])" found\.$/m);
        if (m) {
          switch (m[1]) {
            case ")": tot += 3; break;
            case "]": tot += 57; break;
            case "}": tot += 1197; break;
            case ">": tot += 25137; break;
            default:
              throw new Error("unknown char");
          }
        }
      }
    }
  }
  return tot;
}

function fix(line: string, parser: peggy.Parser): string {
  try {
    parser.parse(line);
  } catch (er) {
    if (!(er instanceof Error)) {
      return "";
    }
    let m = er.message.match(/end of input found\.$/m);
    if (!m) {
      return "";
    }
    m = er.message.match(/"([\]>})])"/m);
    if (!m) {
      return "";
    }
    return m[1];
  }
  return "";
}

function part2(inp: string[], parser: peggy.Parser): number {
  const completions = [];
  for (let line of inp) {
    let c = "";
    let tot = 0;
    do {
      c = fix(line, parser);
      if (c !== "") {
        line += c;
        tot = (tot * 5) + " )]}>".indexOf(c);
      }
    } while (c !== "");
    if (tot > 0) {
      completions.push(tot);
    }
  }
  completions.sort((a, b) => a - b);
  return completions[(completions.length - 1) / 2];
}

export default function main() {
  const txt = fs.readFileSync(new URL("./inputs/day10.txt", import.meta.url), "utf8");
  const inp = txt.split("\n");
  const p = fs.readFileSync(new URL("./day10.peggy", import.meta.url), "utf8");
  const parser = peggy.generate(p);
  return [part1(inp, parser), part2(inp, parser)];
}

Utils.main(import.meta.url, main);
