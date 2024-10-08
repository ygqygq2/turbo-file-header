import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { workspace, WorkspaceConfiguration } from 'vscode';

import { ConfigManager } from '@/configuration/ConfigManager';
import { ConfigReader } from '@/configuration/ConfigReader';
import { CONFIG_TAG, ConfigSection } from '@/constants';

vi.mock('vscode');
vi.mock('@/extension', () => ({
  logger: {
    handleError: vi.fn(),
    throw: vi.fn(),
  },
}));

describe('ConfigManager Tests', () => {
  const mockConfigSection: { [key: string]: string } = {
    [ConfigSection.companyName]: 'mockValue',
  };
  let configReader: ConfigReader;
  let configManager: ConfigManager;
  let mockWorkspaceConfiguration: WorkspaceConfiguration;

  beforeEach(() => {
    vi.clearAllMocks();
    configReader = ConfigReader.getInstance();
    configManager = ConfigManager.getInstance(configReader);
    mockWorkspaceConfiguration = {
      get: (section: string) => mockConfigSection[section],
      update: (section: string, value: string) => {
        mockConfigSection[section] = value;
      },
    } as unknown as WorkspaceConfiguration;
    workspace.getConfiguration = vi.fn().mockImplementation((section: string) => {
      if (section === CONFIG_TAG) {
        return mockWorkspaceConfiguration;
      } else {
        return { ...mockWorkspaceConfiguration, default: 'defaultValue' };
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该获取到正确配置', () => {
    const result = configManager.get(ConfigSection.companyName);
    expect(result).toBe('mockValue');
  });

  it('应该设置成功正确配置', async () => {
    await configManager.set(ConfigSection.userName, 'mockUsername');
    const result = configManager.get(ConfigSection.userName);
    expect(result).toBe('mockUsername');
  });
});
