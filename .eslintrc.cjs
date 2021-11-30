module.exports = {
  root: true,
  ignorePatterns: [
    "coverage/",
    "pnpm-global/",
    "out/",
  ],
  extends: ["@peggyjs", "plugin:@typescript-eslint/recommended"],
  plugins: ["node", "tsdoc"],
  env: {
    es2020: true,
  },
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2021,
  },
  rules: {
    "@typescript-eslint/comma-dangle": ["error", {
      "arrays": "only-multiline",
      "objects": "only-multiline",
      "imports": "never",
      "exports": "never",
      "functions": "never",
    }],
    "@typescript-eslint/no-explicit-any": "off",
    "tsdoc/syntax": "error",
    "sort-imports": "error",
    // [Possible Errors](https://eslint.org/docs/rules/#possible-errors)
    "node/no-unsupported-features/es-syntax": [
      "error",
      {
        version: ">=12.19",
        ignores: ["modules"],
      },
    ],
  },
};
