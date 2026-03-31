import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";


export default defineConfig([
  {
    ignores: ["node_modules", "dist", "build"]
  },

  // Base recommended rules
  js.configs.recommended,

  // Frontend (browser)
  {
    files: ["**/*.js"],
    ignores: ["Firebase/functions/**", "tests/**", "unitTest/**"],
    languageOptions: {
      globals: globals.browser,
      ecmaVersion: "latest",
      sourceType: "module"
    }
  },

  //  Node.js (backend, configs, Firebase)
  {
    files: [
      "Firebase/functions/**/*.js",
      "*.config.js",
      "*.config.cjs",
      "jest.config.cjs",
      "**/*.helpers.js"
    ],
    languageOptions: {
      globals: globals.node
    }
  },

  // Tests (Jest)
  {
    files: ["tests/**/*.js", "unitTest/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest
      }
    }
  }
]);