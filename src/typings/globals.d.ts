declare module '*.template' {
  const content: string;
  export default content;
}

interface CommentConfig {
  lineComment?: string;
  blockComment?: [string, string];
}

interface Contributions {
  // 多行注释
  multilineComments: boolean;
  supportPlainText: boolean;
}
