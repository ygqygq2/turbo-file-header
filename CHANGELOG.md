**Change Log**

All notable changes to the "turbo-file-header" extension will be documented in this file.

# [0.3.1]

## 问题修复 🐛

- fix: 修复批量更新文件头失败文件无限重试导致死循环的问题（最多重试 2 次）
- fix: 修复 createVCSProvider 漏 await validate 导致 VCS 校验失效的问题
- fix: 保存时自动更新文件头改为在保存事务内完成（e.waitUntil），消除二次写盘与 mtime 自更新
- fix: git/svn 命令路径统一加引号，支持含空格路径；svn 去除 awk 依赖，兼容 Windows
- fix: exec 仅按退出码判失败，不再把 git/svn 成功输出的 stderr 当作错误
- fix: 修复 GitVCSProvider.isChanged 已暂存修改被误判为未修改的问题
- fix: 修复 include/exclude 为空时 minimatch 抛错的问题
- fix: 无 VCS 环境降级可用，不再强制抛异常终止

## 功能优化 🚀

- refactor: 抽出独立服务模块 src/services.ts，打破业务模块对入口文件的循环依赖
- refactor: FileheaderVariableBuilder 动态读取配置，修改设置即时生效无需重启
- feat: include/exclude 支持逗号分隔多个 glob 模式

## 测试增强 ✅

- test: 单元测试覆盖从 84 个增加到 116 个（新增 FileMatcher/DocumentHandler/文件头更新决策/批量重试/VCS 校验等）
- test: vitest 增加 coverage 阈值兜底与 typecheck 类型检查
- ci: 修复 CI ERR_PNPM_IGNORED_BUILDS（构建批准迁移至 pnpm-workspace.yaml 并锁定 pnpm 版本）
- ci: workflow actions 全面升级（checkout@v5/setup-node@v5/codecov-action@v5），Node 升级至 24

# [0.3.0]

## 功能优化 🚀

- refactor: 移除 mathjs 依赖，使用自定义轻量级数学表达式解析器，减小包体积 1.4MB
- refactor: 优化 .vscodeignore 配置，VSIX 包体积优化至 2.56MB
- refactor: 更新所有 npm 依赖至最新稳定版本（vite 7.x, vitest 4.x 等）

## 测试增强 ✅

- test: 单元测试覆盖从 30 个增加到 84 个
- test: 新增独立测试配置 tsconfig.test.json，支持 ESNext 模块

## 问题修复 🐛

- fix: 修复 utils.exec 函数 stdout/stderr 类型转换问题
- fix: 修复所有 ESLint 警告

# [0.2.9]

## 问题修复 🐛

- fix: 修复自定义模板配置文件路径获取错误问题

# [0.2.8]

## 新增功能 🌱

- feat: 函数注释支持 c

## 问题修复 🐛

- fix: 修复 paramNameBeforeType 解构时未设置默认值引起问题

# [0.2.7]

## 新增功能 🌱

- feat: 函数注释支持 rust

## 功能优化 🚀

- refactor: 增加配置控制函数注释参数在前还是类型在前

# [0.2.6]

## 新增功能 🌱

- feat: 函数注释支持 php

# [0.2.5]

## 新增功能 🌱

- feat: 函数注释支持 python

# [0.2.4]

## 新增功能 🌱

- feat: 函数注释支持 java

# [0.2.3]

## 新增功能 🌱

- feat: 函数注释支持 go

## 功能优化 🚀

- refactor: js/ts 匹配更准确，支持可选参数，默认参数

# [0.2.2]

## 新增功能 🌱

- feat: 增加函数注释配置

## 功能优化 🚀

- refactor: js/ts 使用解析库，匹配更准确

# [0.2.1]

## 新增功能 🌱

- feat: 增加函数注释配置

# [0.2.0]

## 新增功能 🌱

- feat: 增加 js/ts 文件函数注释功能

# [0.1.1]

## 新增功能 🌱

- feat: 新增配置 `patternMultiline` 支持匹配原文件头是否使用多行正则模式

# [0.1.0]

## 新增功能 🌱

- feat: 新增配置 `customVariables` 和 `fileheader`，支持自定义变量和自定义文件头内容
- feat: 配置中使用 `usePrevious: true` 支持文件头保留字段
- feat: 配置中使用 `wholeLine: true` 支持文件头变量值占据整行

# [0.0.8]

## 新增功能 🌱

- feat: 新增配置 `include` 和 `exclude` 控制更新范围

# [0.0.7]

## 新增功能 🌱

- feat: 新增支持自定义字段 description

## 功能优化 🚀

- refactor: 删除多余的 provider

# [0.0.6]

## 新增功能 🌱

- feat: 支持自定义语言设置

## 问题修复 🐛

- fix: 自定义模板中的 provider 无法正确获取注释符号

# [0.0.5]

## 功能优化 🚀

- perf: 增加防抖、更新文件头判断准确性

# [0.0.4]

## 新增功能 🌱

- feat: 增加 l10n 多语言支持

## 功能优化 🚀

- chore: 配置名使用小驼峰开始

# [0.0.3]

## 新增功能 🌱

- feat: js/ts 支持 `useJSDocStyle` 配置控制文件头注释风格
- feat: 支持批量更新/插入文件头信息

## 问题修复 🐛

- fix: 修复 `/**` 和 `/*` 不统一引起的文件头匹配不正确的问题

# [0.0.2]

## 功能优化 🚀

- perf: 只有一个工作空间时直接使用，不需要用户选择
- chore: 默认设置统一

# [0.0.1]

## 新增功能 🌱

- feat: 快捷键 `ctrl + alt + h` 更新/插入文件头信息
- feat: 生成自定义模板配置，支持自定义模板
- feat: 注释内容高亮
