import { ProgressLocation, window } from 'vscode';

// 在命令执行时显示进度条
export const withProgress = () => {
  // 显示进度条
  window.withProgress(
    {
      location: ProgressLocation.Notification, // 进度条显示在通知栏
      title: '执行命令中...', // 进度条标题
      cancellable: false, // 是否允许取消操作
    },
    async (progress, _token) => {
      // 设置进度条总进度为 100
      progress.report({ increment: 0, message: '开始执行命令' });

      // 模拟执行命令的过程
      for (let i = 0; i <= 100; i += 10) {
        // 更新进度条
        progress.report({ increment: i, message: `已完成 ${i}%` });

        // 模拟耗时操作
        await sleep(500);
      }

      // 完成进度条
      progress.report({ increment: 100, message: '命令执行完成' });
      return new Promise<void>((resolve) => resolve());
    },
  );
};

// 等待指定的毫秒数
const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
