import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConfigSection, ConfigTag } from '@/constants';
import { ConfigManager } from '@/configuration/ConfigManager';
import { WorkspaceConfiguration, workspace } from 'vscode';

vi.mock('vscode');
vi.mock('@/extension', () => ({
  errorHandler: {
    handle: vi.fn(),
    throw: vi.fn(),
  },
}));

describe('ConfigManager Tests', () => {
  const mockConfigSection: { [key: string]: string } = {
    [ConfigSection.companyName]: 'mockValue',
  };
  let mockWorkspaceConfiguration: WorkspaceConfiguration;

  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkspaceConfiguration = {
      get: (section: string) => mockConfigSection[section],
      update: (section: string, value: string) => {
        mockConfigSection[section] = value;
      },
    } as unknown as WorkspaceConfiguration;
    workspace.getConfiguration = vi.fn().mockImplementation((section: string) => {
      if (section === ConfigTag) {
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
    const configManager = ConfigManager.getInstance();
    const result = configManager.get(ConfigSection.companyName);
    expect(result).toBe('mockValue');
  });

  it('应该设置成功正确配置', async () => {
    const configManager = ConfigManager.getInstance();
    await configManager.set(ConfigSection.userName, 'mockUsername');
    const result = configManager.get(ConfigSection.userName);
    expect(result).toBe('mockUsername');
  });
});
