/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    preset: "ts-jest",
    testEnvironment: "jsdom",
    roots: ["<rootDir>/tests"],
    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                tsconfig: "tsconfig.json",
                useESM: true,
            },
        ],
    },
    moduleNameMapper: {
        "^src/(.*)$": "<rootDir>/src/$1",
        "^obsidian$": "<rootDir>/tests/mocks/obsidian.ts",
    },
    testRegex: "(/tests/(?!e2e/).*\\.(test|spec))\\.tsx?$", // Exclude e2e tests
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    collectCoverage: true,
    coverageReporters: ["text", "lcov"],
    collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts", "!src/main.ts"],
    extensionsToTreatAsEsm: [".ts", ".tsx"],
};