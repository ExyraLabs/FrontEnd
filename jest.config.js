/* eslint-disable */
const nextJest = require("next/jest");

const createJestConfig = nextJest({
	dir: "./",
});

/** @type {import('jest').Config} */
const customJestConfig = {
	testEnvironment: "jsdom",
	setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
		"^next/image$": "<rootDir>/test/__mocks__/nextImageMock.js",
		"\\.(css|less|scss|sass)$": "identity-obj-proxy",
	},
	testMatch: ["<rootDir>/src/__tests__/**/*.test.(ts|tsx)"],
	testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
};

module.exports = createJestConfig(customJestConfig);

