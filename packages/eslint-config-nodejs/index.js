module.exports = {
  extends: ["prettier", "eslint:recommended"],
  plugins: ["prettier", "simple-import-sort"],
  rules: {
    "prettier/prettier": [
      "error",
      {
        singleQuote: true,
        trailingComma: "all",
      },
    ],
    "simple-import-sort/imports": 2,
    "simple-import-sort/exports": 2,
  },
  env: {
    node: true,
    es6: true,
  },
  globals: {},
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      extends: [
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
      ],
      rules: {
        "@typescript-eslint/explicit-module-boundary-types": 1,
        "@typescript-eslint/no-explicit-any": 1,
        "@typescript-eslint/no-namespace": "off",
        "@typescript-eslint/no-unused-vars": [
          2,
          { args: "after-used", ignoreRestSiblings: true },
        ],
      },
    },
  ],
};
