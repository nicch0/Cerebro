import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import importPlugin from "eslint-plugin-import";
import jestPlugin from "eslint-plugin-jest";

export default [
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        ignores: [
            "node_modules/**",
            "main.js",
            "*.config.js",
            "*.config.mjs",
            "*.config.mts",
            "!eslint.config.js",
        ],
    },
    {
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: "module",
            globals: {
                ...globals.node,
            },
            parser: tseslint.parser,
            parserOptions: {
                project: true,
            },
        },
        plugins: {
            "@typescript-eslint": tseslint.plugin,
            import: importPlugin,
            "simple-import-sort": simpleImportSort,
        },
        rules: {
            // ESLint rules
            eqeqeq: "error",
            "no-shadow": "off",
            "@typescript-eslint/no-shadow": "error",
            "no-param-reassign": "error",
            "no-else-return": "warn",
            "dot-notation": "error",
            "no-unused-private-class-members": "error",
            curly: "error",
            "no-eval": "error",
            "no-template-curly-in-string": "error",
            "no-duplicate-imports": "error",
            "no-constructor-return": "error",
            "prefer-const": "error",
            "no-implicit-coercion": "error",

            // Import rules
            "simple-import-sort/imports": [
                "warn",
                // no blank lines between groups
                { groups: [["^\\u0000", "^node:", "^@?\\w", "^", "^\\."]] },
            ],
            "simple-import-sort/exports": "warn",
            "import/first": "error",
            "import/newline-after-import": "error",
            "import/no-duplicates": "error",

            // TypeScript rules
            "@typescript-eslint/no-inferrable-types": "error",
            "@typescript-eslint/explicit-function-return-type": "error",
            "@typescript-eslint/explicit-member-accessibility": [
                "error",
                {
                    overrides: {
                        constructors: "no-public",
                    },
                },
            ],
            "@typescript-eslint/naming-convention": [
                "error",
                {
                    selector: "default",
                    format: ["camelCase", "snake_case"],
                },
                {
                    selector: "import",
                    format: ["camelCase", "PascalCase"],
                },
                {
                    selector: "variable",
                    format: ["camelCase", "UPPER_CASE", "snake_case"],
                },
                {
                    selector: "typeLike",
                    format: ["PascalCase"],
                },
                {
                    selector: "enumMember",
                    format: ["UPPER_CASE"],
                },
                {
                    selector: "objectLiteralProperty",
                    format: null,
                },
                {
                    selector: "variable",
                    modifiers: ["destructured"],
                    format: null,
                },
                {
                    selector: "parameter",
                    format: ["camelCase", "snake_case"],
                    leadingUnderscore: "allow",
                },
            ],
            "@typescript-eslint/no-require-imports": "error",
            "@typescript-eslint/switch-exhaustiveness-check": "error",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                },
            ],
        },
    },
    // For test files
    {
        files: ["**/*.test.ts", "**/*.test.tsx", "**/tests/*.ts"],
        plugins: {
            jest: jestPlugin,
        },
        rules: {
            "jest/expect-expect": "off",
            "jest/prefer-expect-assertions": [
                "warn",
                {
                    onlyFunctionsWithAsyncKeyword: true,
                    onlyFunctionsWithExpectInCallback: true,
                },
            ],
            "jest/unbound-method": "warn",
            "@typescript-eslint/no-unsafe-member-access": "warn",
            "@typescript-eslint/no-unsafe-call": "warn",
        },
    },
    // For command files
    {
        files: ["**/commands/*.ts"],
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/explicit-function-return-type": "off",
        },
    },
];
