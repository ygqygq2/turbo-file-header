# Change Log

All notable changes to the "turbo-file-header" extension will be documented in this file.

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
