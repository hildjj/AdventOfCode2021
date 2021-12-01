export default {
  files: [
    "test/*.ava.ts",
  ],
  extensions: {
    ts: "module",
  },
  nodeArguments: [
    "--loader=ts-node/esm",
    "--experimental-specifier-resolution",
    "node",
  ],
};
