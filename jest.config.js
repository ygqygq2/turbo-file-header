/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const { rootDir } = require("./jest.e2e.config");

/* eslint-disable no-undef */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './',
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/out/$1',
  },
  testMatch: ['<rootDir>/src/test/unit/**/*.spec.ts'],
};
