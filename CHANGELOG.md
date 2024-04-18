# Change Log

All notable changes to the "turbo-file-header" extension will be documented in this file.

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
