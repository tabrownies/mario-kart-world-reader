import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(eslint.configs.recommended, ...tseslint.configs.recommended, {
  ignores: [
    "**/generated/**",
    "node_modules/**",
    ".venv/**",
    "dist/**",
    "build/**",
    ".jj/**",
    ".git/**",
  ],
});
