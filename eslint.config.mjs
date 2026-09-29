import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // app del tracker (tracker/, tsconfig proprio): si controllano i sorgenti, non la build né gli script di Electron
    "tracker/dist/**",
    "tracker/out/**",
    "tracker/node_modules/**",
    "tracker/scripts/*.cjs",
  ]),
]);

export default eslintConfig;
