import { Progress, ProgressLocation, window } from 'vscode';

// 在命令执行时显示进度条
export const withProgress = async (
  title: string,
  callback: (
    progress: Progress<{
      message?: string | undefined;
      increment?: number | undefined;
    }>,
  ) => Promise<void>,
  totalSteps: number,
) => {
  // 显示进度条
  await window.withProgress(
    {
      location: ProgressLocation.Notification, // 进度条显示在通知栏
      title, // 进度条标题
      cancellable: true, // 是否允许取消操作
    },
    async (progress, token) => {
      // 设置进度条总进度为 0
      updateProgress(progress, 0, totalSteps);

      // 执行命令的过程
      for (let i = 1; i <= totalSteps; i++) {
        // 耗时操作， 包含更新进度条了
        await callback(progress);

        // 如果用户取消了任务，就退出循环
        if (token.isCancellationRequested) {
          break;
        }
      }
    },
  );
};

export const updateProgress = (
  progress: Progress<{
    message?: string | undefined;
    increment?: number | undefined;
  }>,
  current: number,
  total: number,
) => {
  const message = `Updating... (${current}/${total} files)`;
  const increment = 100 / total;
  progress.report({ increment, message });
};
