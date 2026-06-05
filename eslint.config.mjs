import nextPlugin from "@next/eslint-plugin-next";
import tsParser from "@typescript-eslint/parser";

const nextRules = {
  ...nextPlugin.configs.recommended.rules,
  ...nextPlugin.configs["core-web-vitals"].rules,
};

export default [
  {
    ignores: [".next/**", "node_modules/**", "public/**", "data/**", "database/**"],
  },
  {
    files: ["src/**/*.{ts,tsx}", "next-env.d.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: nextRules,
    settings: {
      next: {
        rootDir: ["./"],
      },
    },
  },
  {
    files: ["*.mjs", "scripts/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
];
