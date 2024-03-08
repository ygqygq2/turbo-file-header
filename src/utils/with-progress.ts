import { ProgressLocation, window } from 'vscode';

// 在命令执行时显示进度条
export const withProgress = async (
  title: string,
  callback: () => Promise<void>,
  totalSteps: number,
) => {
  // 显示进度条
  window.withProgress(
    {
      location: ProgressLocation.Notification, // 进度条显示在通知栏
      title, // 进度条标题
      cancellable: true, // 是否允许取消操作
    },
    async (progress, _token) => {
      // 设置进度条总进度为 0
      progress.report({ increment: 0, message: 'Starting...' });

      // 执行命令的过程
      for (let i = 1; i <= totalSteps; i++) {
        // 耗时操作
        await callback();
        // 更新进度条，计算增量
        const increment = 100 / totalSteps;
        progress.report({
          increment: increment,
          message: `Finish [${(i / totalSteps) * 100}%]`,
        });
      }
    },
  );
};
