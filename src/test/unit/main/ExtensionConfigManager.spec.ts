import { ConfigSection } from '@/constants';
import { ConfigManager } from '@/configuration/ConfigManager';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorkspaceConfiguration, workspace } from 'vscode';

vi.mock('vscode');

describe('ConfigManager Tests', () => {
  const mockConfigSection: { [key: string]: string } = {
    [ConfigSection.companyName]: 'mockValue',
  };
  let mockWorkspaceConfiguration: WorkspaceConfiguration;

  beforeEach(() => {
    mockWorkspaceConfiguration = {
      get: (section: string) => mockConfigSection[section],
      update: (section: string, value: string) => {
        mockConfigSection[section] = value;
      },
    } as unknown as WorkspaceConfiguration;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该获取到正确配置', () => {
    workspace.getConfiguration = vi.fn().mockReturnValueOnce(mockWorkspaceConfiguration);
    const configManager = new ConfigManager();
    const result = configManager.get(ConfigSection.companyName);
    expect(result).toBe('mockValue');
  });

  it('应该设置成功正确配置', async () => {
    workspace.getConfiguration = vi.fn().mockReturnValue(mockWorkspaceConfiguration);
    const configManager = new ConfigManager();
    await configManager.set(ConfigSection.userName, 'mockUsername');
    const result = configManager.get(ConfigSection.userName);
    expect(result).toBe('mockUsername');
  });
});
