module.exports = {
  root: true,
  ignorePatterns: [
    "coverage/",
    "pnpm-global/",
    "out/",
    "template/",
  ],
  extends: ["@peggyjs"],
  plugins: ["node"],
  env: {
    es2020: true,
  },
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2021,
  },
  rules: {
    "capitalized-comments": ["error", "always",  {
      "ignorePattern": "c8",
      "ignoreConsecutiveComments": true,
    }],
    "spaced-comment": [
      "error",
      "always",
      {
        line: {
          markers: ["/", "#region", "#endregion"],
        },
        block: { markers: ["*"], balanced: true },
      },
    ],
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
  overrides: [
    {
      files: ["*.ts"],
      plugins: ["tsdoc"],
      extends: ["plugin:@typescript-eslint/recommended"],
      rules: {
        "@typescript-eslint/comma-dangle": ["error", {
          "arrays": "only-multiline",
          "objects": "only-multiline",
          "imports": "never",
          "exports": "never",
          "functions": "never",
        }],
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": ["error", { varsIgnorePattern: "_" }],
        "tsdoc/syntax": "error",
      },
    },
  ],
};
