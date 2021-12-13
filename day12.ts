#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
import Counter from "./counter.js";
import Utils from "./utils.js"; // Really .ts
import util from "util";

class Node {
  neighbors = new Set<Node>();

  name: string;

  constructor(name: string) {
    this.name = name;
  }

  toString() {
    return `[Node ${this.name}]-${[...this.neighbors].map(n => n.name).join(",")}`;
  }

  [util.inspect.custom]() {
    return this.toString();
  }

  addEdge(n: Node) {
    this.neighbors.add(n);
  }

  visit(path: Node[] = [], found: Node[][] = []) {
    const p = path.concat(this);
    if (this.name === "end") {
      found.push([...p]);
      return found;
    } else if (this.name.toLowerCase() === this.name) {
      if (path.includes(this)) {
        return found;
      }
    }

    for (const n of this.neighbors) {
      n.visit(p, found);
    }
    return found;
  }

  visit2(path: Node[] = [], found: Node[][] = []) {
    const p = path.concat(this);
    if (this.name === "end") {
      found.push([...p]);
      return found;
    } else if (this.name === "start" && (path.length > 0)) {
      return found;
    } else if (this.name.toLowerCase() === this.name) {
      const smalls = new Counter<string>();
      for (const n of p) {
        if (n.name.toLowerCase() === n.name) {
          smalls.add(n.name);
        }
      }
      // If adding this small cave gives us a path with two small caves twice,
      // stop.
      if (smalls.total(v => v > 1) > 1) {
        return found;
      }
      // If adding this small cave gives us a path with three of this node,
      // stop.
      if (smalls.total(v => v > 2) > 0) {
        return found;
      }
    }

    for (const n of this.neighbors) {
      n.visit2(p, found);
    }
    return found;
  }
}

class Graph {
  nodes: { [id: string]: Node } = {};

  constructor(pairs: string[][]) {
    for (const [start, end] of pairs) {
      this.addEdge(start, end);
    }
  }

  getNode(id: string): Node {
    let n = this.nodes[id];
    if (!n) {
      n = new Node(id);
      this.nodes[id] = n;
    }
    return n;
  }

  addEdge(start: string, end: string) {
    const startN = this.getNode(start);
    const endN = this.getNode(end);
    startN.addEdge(endN);
    endN.addEdge(startN);
  }
}

function part1(inp: Graph): number {
  const start = inp.getNode("start");
  const found = start.visit();
  return found.length;
}

function part2(inp: Graph): number {
  const start = inp.getNode("start");
  const found = start.visit2();
  return found.length;
}

export default function main(inFile: string, trace: boolean) {
  const inp: string[][] = Utils.parseFile(inFile, undefined, trace);
  return [part1(new Graph(inp)), part2(new Graph(inp))];
}

Utils.main(import.meta.url, main);
