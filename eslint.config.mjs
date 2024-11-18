import {FlatCompat} from "@eslint/eslintrc";
import path from "path";
import {fileURLToPath} from "url";

import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginGoogle from "eslint-config-google";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});


export default [
  ...compat.extends("plugin:react-hooks/recommended"),
  {files: ["**/*.{js,mjs,cjs,jsx}"]},
  {languageOptions: {globals: globals.browser}},
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginGoogle,
  {
    rules: {
      "no-undef": "off",
      "no-unused-vars": "warn",
      "semi": "error",
      "quotes": ["error", "double"],
      "indent": ["error", 2],
      "max-len": ["error", {"code": 120}],
      "react-hooks/exhaustive-deps": 0,
    },
  },
];
