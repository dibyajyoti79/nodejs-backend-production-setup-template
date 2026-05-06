/**
 * ESLint Configuration for Node.js + TypeScript Backend
 */

import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: ["dist", "node_modules"],
  },

  js.configs.recommended,

  {
    files: ["src/**/*.ts"],

    languageOptions: {
      parser: tsParser,

      parserOptions: {
        project: "./tsconfig.json",
        sourceType: "module",
        ecmaVersion: "latest",
      },

      globals: {
        ...globals.node,
      },
    },

    plugins: {
      "@typescript-eslint": tseslint,
    },

    rules: {
      ...tseslint.configs.recommended.rules,

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      "@typescript-eslint/no-explicit-any": "warn",

      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },

  prettier,
];
