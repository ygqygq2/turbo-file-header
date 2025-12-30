# Contributing

感谢贡献!

## 快速开始

```bash
# Fork 并克隆
git clone https://github.com/YOUR_USERNAME/turbo-file-header.git
cd turbo-file-header

# 安装依赖 (需要 Node.js >= 18, pnpm >= 8)
pnpm install

# 按 F5 在 VS Code 中调试
```

## 开发流程

1. 创建分支: `git checkout -b feature/xxx`
2. 修改并测试: `pnpm test`
3. 提交: `git commit -m "feat: xxx"`
4. 推送并创建 PR

## 提交规范

- `feat:` 新功能
- `fix:` 修复
- `docs:` 文档
- `refactor:` 重构

## 添加语言支持

1. 在 `src/function-params-parser/` 创建解析器
2. 在 `src/language-providers/` 创建提供者
3. 在 `LanguageManager` 注册
4. 添加测试

## 代码要求

- 使用 TypeScript 严格模式
- 避免 `any`
- 新功能需要测试
