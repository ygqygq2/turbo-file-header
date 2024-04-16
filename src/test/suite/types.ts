export type TestInfo = {
  testName: string;
  workspaceName: string;
  files: {
    fileName: string;
    cursorLine: number;
  }[];
}[];
