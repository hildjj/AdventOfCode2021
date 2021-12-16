#!/usr/bin/env node --loader ts-node/esm --experimental-specifier-resolution=node
import NoFilter from "nofilter";
import Utils from "./utils.js"; // Really .ts

interface Packet {
  id?: number;
  size: number;
  version: number;
  pkt?: Packet[];
  value?: number;
}

function bitNum(bits: number, i: NoFilter): number {
  const src = i.read(bits);
  const val = parseInt(src, 2);
  if (isNaN(val)) {
    throw new Error(`Can't be parsed as binary: "${src}"`);
  }
  return val;
}

function operatorBytes(id: number, version: number, i: NoFilter): Packet {
  // 15 bits of bit length
  const len = bitNum(15, i);
  let bytesRead = 0;
  const pkt = [];

  while (bytesRead < len) {
    const p = packet(i);
    bytesRead += p.size;
    pkt.push(p);
  }
  return {
    id,
    version,
    pkt,
    size: 22 + len, // 3 + 3 + 1 + 15 + len
  };
}

function operatorPackets(id: number, version: number, i: NoFilter): Packet {
  // 11 bits of number of packets
  const len = bitNum(11, i);
  const pkt = [];
  let size = 18; // 3 + 3 + 1 + 11
  for (let j = 0; j < len; j++) {
    const p = packet(i);
    size += p.size;
    pkt.push(p);
  }
  return {
    id,
    version,
    pkt,
    size
  };
}

function operator(id: number, version: number, i: NoFilter): Packet {
  const lenType = i.read(1);
  if (lenType === "0") {
    return operatorBytes(id, version, i);
  }
  return operatorPackets(id, version, i);
}

function literal(id: number, version: number, i: NoFilter): Packet {
  let all = "";
  let size = 6; // 3 + 3
  // eslint-disable-next-line no-constant-condition
  while (true) {
    size += 5;
    const cont = i.read(1);
    all += i.read(4);
    if (cont === "0") {
      break;
    }
  }
  return {
    id,
    version,
    value: parseInt(all, 2),
    size,
  };
}

function packet(i: NoFilter): Packet {
  const version = bitNum(3, i);
  const pktID = bitNum(3, i);
  return (pktID === 4)
    ? literal(pktID, version, i)
    : operator(pktID, version, i);
}

function addVersions(p: Packet) {
  let tot = p.version;
  if (p.pkt) {
    tot = p.pkt.reduce<number>(
      (t: number, v: Packet) => t + addVersions(v)
      , tot
    );
  }
  return tot;
}

function calculate(p: Packet): number {
  switch (p.id) {
    case 0: // Sum
      if (!p.pkt) {
        throw new Error("Bad sum packet");
      }
      return p.pkt.reduce((t, v) => t + calculate(v), 0);
    case 1: // Product
      if (!p.pkt) {
        throw new Error("Bad product packet");
      }
      return p.pkt.reduce((t, v) => t * calculate(v), 1);
    case 2: // Minimum
      if (!p.pkt) {
        throw new Error("Bad minimum packet");
      }
      return Math.min(...p.pkt.map(calculate));
    case 3: // Maximum
      if (!p.pkt) {
        throw new Error("Bad maximum packet");
      }
      return Math.max(...p.pkt.map(calculate));
    case 4: // Value
      if (typeof p.value !== "number") {
        throw new Error("Bad value packet");
      }
      return p.value;
    case 5: // Greater than
      if (!p.pkt || (p.pkt.length !== 2)) {
        throw new Error("Bad gt packet");
      }
      return (calculate(p.pkt[0]) > calculate(p.pkt[1])) ? 1 : 0;
    case 6: // Less than
      if (!p.pkt || (p.pkt.length !== 2)) {
        throw new Error("Bad lt packet");
      }
      return (calculate(p.pkt[0]) < calculate(p.pkt[1])) ? 1 : 0;
    case 7: // Equals
      if (!p.pkt || (p.pkt.length !== 2)) {
        throw new Error("Bad eq packet");
      }
      return (calculate(p.pkt[0]) === calculate(p.pkt[1])) ? 1 : 0;
    default:
      throw new Error("Unknown op");
  }
}

function part1(inp: string): number {
  const nof = new NoFilter(inp, { encoding: "utf8" });
  const res = packet(nof);
  return addVersions(res);
}

function part2(inp: string): number {
  const nof = new NoFilter(inp, { encoding: "utf8" });
  const res = packet(nof);
  return calculate(res);
}

export default function main(inFile: string, trace: boolean) {
  const inp: Buffer = Utils.parseFile(inFile, undefined, trace);
  const str: string = Array.prototype.map.call(
    inp, (x: number) => x.toString(2).padStart(8, "0")
  ).join("");
  return [part1(str), part2(str)];
}

Utils.main(import.meta.url, main);
