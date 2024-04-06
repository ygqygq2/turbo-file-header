/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const vscode = require('vscode');
const { TestEnvironment } = require('jest-environment-node');

class VsCodeEnvironment extends TestEnvironment {
  async setup() {
    await super.setup();
    this.global.vscode = vscode;
  }

  async teardown() {
    this.global.vscode = {};
    await super.teardown();
  }
}

module.exports = VsCodeEnvironment;
