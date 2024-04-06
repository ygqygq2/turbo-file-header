const path = require("path");

module.exports = {
  moduleFileExtensions: ["js"],
  testMatch: ["<rootDir>/out/test/suite-jest/**.test.js"],
  testEnvironment: "./src/test/vscode-environment.js",
  verbose: true,
  moduleNameMapper: {
    vscode: path.join(__dirname, "src", "test", "vscode.js"),
  },
};
