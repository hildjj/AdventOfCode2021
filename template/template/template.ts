import Utils from "./utils.js";

function part1(inp: any, args: Utils.mainParams) {
  return 0;
}

function part2(inp: any, args: Utils.mainParams) {
  return 0;
}

function main(inFile: string, trace: boolean, args: Utils.mainParams) {
  const inp = Utils.parseFile(inFile, null, trace);
  return [part1(inp, args), part2(inp, args)];
}

module.exports = main;
Utils.main(require.main, module, main);
