export type TestInfo = {
  workspaceName: string;
  files: {
    fileName: string;
    cursorLine: number;
  }[];
}[];
