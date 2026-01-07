# turbo-file-header

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/ygqygq2.turbo-file-header.svg?color=07c160&label=turbo-file-header&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=ygqygq2.turbo-file-header)
[![VSCode Installs](https://img.shields.io/visual-studio-marketplace/i/ygqygq2.turbo-file-header?label=vscode%20installs)](https://marketplace.visualstudio.com/items?itemName=ygqygq2.turbo-file-header)
[![OpenVSX Downloads](https://img.shields.io/open-vsx/dt/ygqygq2/turbo-file-header?label=openvsx%20downloads)](https://open-vsx.org/extension/ygqygq2/turbo-file-header)

[English](README.md) | [Wiki](https://github.com/ygqygq2/turbo-file-header/wiki)

> 🎨 **让你的代码注释专业、统一、智能** — 团队协作的最佳实践工具

一键生成专业的文件头和函数注释 • 支持多种主流语言 • 团队配置共享 • Git 智能集成

---

## ✨ 核心特性

### 🚀 文件头管理

- ⚡ **快捷键操作** - `Ctrl+Alt+H` 一键生成/更新文件头
- 🎯 **项目级配置** - YAML 配置文件，团队成员自动同步
- 🔄 **批量更新** - 支持按 glob 模式批量更新多个文件
- 📦 **VCS 集成** - 自动从 Git 获取作者信息和文件时间

### 💡 函数注释生成

- 🔧 **自动解析** - 支持多种主流编程语言，自动提取函数签名信息
- ⌨️ **快捷键** - `Ctrl+Alt+/` 光标所在函数自动生成注释框架
- 📝 **参数类型识别** - 自动提取函数参数、返回值类型
- 🎨 **多种风格** - 支持 JSDoc、标准块注释等格式

### 🎨 注释高亮增强

- 🌈 **注释高亮增强** - 自定义标签高亮，可配置颜色样式
- 🎯 **自定义标签** - # ! ? // todo \* 等标签高亮
- 🌓 **主题适配** - 支持明亮/暗黑主题分别配置
- ⚙️ **完全可配置** - 颜色、样式、标签全可自定义

---

## � 功能演示

### 📝 一键生成文件头

![文件头生成演示](https://raw.githubusercontent.com/ygqygq2/turbo-file-header/main/docs/images/file-header.gif)

按 `Ctrl+Alt+H` 自动生成包含作者、时间、版权等信息的文件头

### 🔧 自动函数注释

![函数注释演示](https://raw.githubusercontent.com/ygqygq2/turbo-file-header/main/docs/images/function-comment.gif)

按 `Ctrl+Alt+/` 自动提取函数签名，生成注释模板

### 🎨 注释高亮

![注释高亮展示](https://raw.githubusercontent.com/ygqygq2/turbo-file-header/main/docs/images/highlight.png)

`# ! ? // todo *` 等标签自动着色，代码更易读

---

## �🌟 核心优势

| 特性                | 说明                                                                            |
| ------------------- | ------------------------------------------------------------------------------- |
| 📁 **项目级配置**   | YAML 配置文件，团队成员自动同步，统一代码规范                                   |
| 🔥 **自动函数注释** | 支持多种语言（TypeScript/JavaScript/Java/Go/Python/PHP/Rust/C）自动解析函数签名 |
| 📦 **VCS 深度集成** | 自动从 Git 获取作者信息、文件创建/修改时间                                      |
| 🎨 **注释高亮增强** | 内置完整注释高亮功能，# ! ? // todo \* 等标签自动着色                           |
| 🌍 **多语言界面**   | 配置界面支持中英文切换，更友好的本地化体验                                      |
| ⚡ **批量操作**     | 支持 glob 模式批量更新，一键处理整个项目                                        |
| 🎯 **精细配置**     | 20+ 配置项，完全掌控文件头和注释的每个细节                                      |
| 🔧 **高级变量系统** | 支持变量计算、引用、自定义格式化                                                |
| 🔄 **自动化工作流** | 支持文件创建时自动插入、保存时自动更新                                          |
| 📝 **保留字段**     | 更新文件头时可保留特定字段（如 description）                                    |

---

## 🚀 快速开始

### 📦 安装

从 VS Code 市场搜索 `turbo-file-header` 或 [点击安装](vscode:extension/ygqygq2.turbo-file-header)

### ⚡ 10 秒上手

1. **创建/打开文件** → 按 `Ctrl+Alt+H` → 自动插入文件头 ✨
2. **光标移到函数名** → 按 `Ctrl+Alt+/` → 生成函数注释 🎯
3. **保存时自动更新** → 开启 `autoUpdateOnSave` 配置 🔄

### 👥 团队协作

```bash
# 1. 在项目根目录执行命令
Ctrl+Shift+P → "Turbo File Header: Generate Custom Template Config File"

# 2. 编辑生成的配置文件
.fileheader/fileheader.config.yaml

# 3. 提交到 Git
git add .fileheader/
git commit -m "feat: 添加统一文件头配置"

# 4. 团队成员拉取后自动生效 ✅
```

---

## 📚 功能详解

### 🎯 基础功能

- **`Ctrl+Alt+H`** - 快捷键生成/更新文件头
- **`Ctrl+Alt+/`** - 快捷键添加函数注释(光标在函数名行时)
- **项目配置生成** - 命令 `Generate Custom Template Config File` 创建项目级配置
- **全局 + 项目配置** - 支持全局配置和项目级配置，项目配置优先
- **注释高亮** - 内置注释高亮功能，支持自定义标签和颜色
- **多语言支持** - 支持所有 [VSCode 已知语言](https://code.visualstudio.com/docs/languages/identifiers#_known-language-identifiers)
- **国际化界面** - 配置说明支持中英文 l10n 显示

### 💻 函数注释支持语言

当前支持以下语言的函数注释智能生成：

| 语言           | 支持特性                                  |
| -------------- | ----------------------------------------- |
| **TypeScript** | ✅ 参数类型、返回值类型、可选参数、默认值 |
| **JavaScript** | ✅ 箭头函数、普通函数、类方法、生成器函数 |
| **Java**       | ✅ 方法签名、修饰符、注解支持             |
| **Go**         | ✅ 函数、方法、多返回值                   |
| **Python**     | ✅ 函数、类方法、类型注解                 |
| **PHP**        | ✅ 函数、类方法、类型声明                 |
| **Rust**       | ✅ 函数、方法、trait 实现                 |
| **C**          | ✅ 函数声明、指针参数                     |

> 💡 **提示**: 文件头功能支持所有 VSCode 语言，不受上述限制

---

## ⚙️ 配置说明

### 配置项总览

Turbo File Header 提供了 **20+ 配置项**，让你完全掌控文件头和注释的每个细节：

Properties:

| Feature                  | Description                                                           | Setting                          | Default                  |
| ------------------------ | --------------------------------------------------------------------- | -------------------------------- | ------------------------ |
| 备用用户名               | 备用用户名，默认来自 VCS                                              | userName                         | ``                       |
| 备用邮箱                 | 备用用户邮箱. 默认来自 VCS                                            | userEmail                        | ``                       |
| 公司名                   | 版权信息公司名                                                        | companyName                      | `YourCompanyName`        |
| 时间格式                 | 时间格式 [date format](https://momentjs.com/docs/#/displaying/format) | dateFormat                       | `YYYY-MM-DD HH:mm:ss`    |
| 创建文件时插入文件头     | 创建文件时插入文件头                                                  | autoInsertOnCreateFile           | `false`                  |
| 保存文件时更新文件头     | 保存文件时更新文件头                                                  | autoUpdateOnSave                 | `false`                  |
| `include` glob 模式      | 全局的 `include` glob 模式，项目级 `include` 优先                     | include                          | `**/this-default-glob/*` |
| `exclude` glob 模式      | 全局的 `exclude` glob 模式，项目级 `exclude` 优先                     | exclude                          | ``                       |
| 文件头中禁用字段         | 文件头中不展示的字段                                                  | disableLabels                    | `[]`                     |
| 自定义文件头变量         | 文件头变量支持引用其它变量                                            | customVariables                  | the below                |
| 自定义文件头             | 自定义文件头内容覆盖默认文件头                                        | fileheader                       | `[]`                     |
| 多行正则匹配原文件头     | 使用多行正则匹配模式获取原文件头信息                                  | patternMultiline                 | `false`                  |
| 只支持脏文件             | 只有已更新但未保存文件支持插入/更新文件头                             | updateHeaderForModifiedFilesOnly | `false`                  |
| 额外语言支持             | 通过配置支持新/未知语言插入/更新文件头                                | languages                        | the below                |
| JSDoc 注释风格支持 js/ts | js/ts 文件使用 JSDoc 注释风格                                         | useJSDocStyle                    | `false`                  |
| 函数注释设置             | 针对不同语言的函数注释设置                                            | functionComment                  | the below                |
| 块注释高亮支持           | 块注释支持高亮功能                                                    | multilineComments                | `true`                   |
| 纯文件高亮支持           | 纯文件支持高亮功能                                                    | highlightPlainText               | `false`                  |
| 配置 `tags`              | 使用 `tags` 配置注释高亮                                              | tags                             | the below                |
| 配置 `tags` 在明亮主题   | 明亮主题中的 `tags` 配置                                              | tagsLight                        | `[]`                     |
| 配置 `tags` 在暗黑主题   | 暗黑主题中的 `tags` 配置                                              | tagsDark                         | `[]`                     |

**注意**:

- `include` 和 `exclude` 是为了控制文件头影响范围，`addFileheader` 命令不受它们影响。
- `author` 包含用户名/邮箱，如果文件被 VCS 追踪，将从 VCS 中获取用户信息，否则将使用备用用户名/邮箱.
- `patternMultiline` 为 `true` 时，正则匹配会少一些，批量更新时性能好一些。为 `false` 时支持部分与新文件头相同的行和行位置不同的情况，性能影响不大。

**文件头可用变量**

- `{{birthtime}}` {string} 文件创建时间. 来自 VCS 或文件系统
- `{{mtime}}` {string} 文件最后修改时间. 来自 VCS 或文件系统
- `{{authorName}}` {string} 文件作者名. 如果文件被 VCS 跟踪, 则从 VCS 中获取作者名, 否则从当前用户名中获取
- `{{authorEmail}}` {string} 文件作者邮箱. 如果文件被 VCS 跟踪, 则从 VCS 中获取作者邮箱, 否则从当前用户邮箱中获取
- `{{userName}}` {string} 备用用户名. 默认来自 VCS
- `{{userEmail}}` {string} 备用用户邮箱. 默认来自 VCS
- `{{companyName}}` {string} 公司名
- `{{projectName}}` {string} 当前项目名
- `{{filePath}}` {string} 文件路径. 相对于项目根目录. POSIX 路径分隔符
- `{{dirPath}}` {string} 目录路径. 相对于项目根目录. POSIX 路径分隔符
- `{{fileName}}` {string} 包含扩展名的文件名
- `{{description}}` {string} 文件描述，由用户输入
- `{{now}}` {string} 生成文件头时的时间

**自定义变量可以这样使用:**

- `{{now 'YYYY-MM-DD HH:mm:ss'}}` {string} 生成文件头的当前时间，可以自定义格式
- `{{now-1 'MM'}}` {string} 自定义格式的当前时间，并且支持简单计算，注意格式化后值是支持计算的才行

## 默认配置列表

`customVariables` 默认设置:

```
[
  {
    "name": "description",
    "value": ""
  },
  {
    "name": "copyright",
    "value": "Copyright ©{{companyName}} All rights reserved"
  }
]
```

> 提示:

- 为了配合 `fileheader` 中的使用 `usePrevious` 的字段而设置

`fileheader` default settings:

```
[
  {
    "label": " * @file",
    "value": "{{filePath}}"
  },
  {
    "label": " * @description",
    "value": "{{description}}",
    "usePrevious": true
  },
  {
    "label": " * @author",
    "value": "{{authorName}} <{{authorEmail}}>"
  },
  {
    "label": " * @createTime",
    "value": "{{birthtime}}"
  },
  {
    "label": " * @lastModified",
    "value": "{{mtime}}"
  },
  {
    "label": "@copyright",
    "value": "{{copyright}}",
    "wholeLine": true
  }
]
```

> 提示:

- 如果使用 `"usePrevious": true`，请先在 `customVariables` 配置自定义变量，然后在整个字段中使用该定义变量

`languages` 默认配置:

```
[
  {
    id: "astro",
    extensions: [".astro"],
    aliases: ["astro"],
    configuration: {
      comments: {
        blockComment: ["<!--", "-->"],
      },
    },
  },
]
```

`functionComment` default settings:

```
{
  "languagesSettings": [
    {
      "languageId": "typescript",
      "defaultReturnName": "default",
      "defaultReturnType": "auto",
      "defaultParamType": "any"
    }
  ]
}
```

`tags` default settings:

```
[
  {
    "tag": "#",
    "color": "#18b566",
    "strikethrough": false,
    "underline": false,
    "backgroundColor": "transparent",
    "bold": true,
    "italic": false
  },
  {
    "tag": "!",
    "color": "#FF2D00",
    "strikethrough": false,
    "underline": false,
    "backgroundColor": "transparent",
    "bold": false,
    "italic": false
  },
  {
    "tag": "?",
    "color": "#3498DB",
    "strikethrough": false,
    "underline": false,
    "backgroundColor": "transparent",
    "bold": false,
    "italic": false
  },
  {
    "tag": "//",
    "color": "#474747",
    "strikethrough": true,
    "underline": false,
    "backgroundColor": "transparent",
    "bold": false,
    "italic": false
  },
  {
    "tag": [
      "todo",
      "to-do"
    ],
    "color": "#FF8C00",
    "strikethrough": false,
    "underline": false,
    "backgroundColor": "transparent",
    "bold": false,
    "italic": false
  },
  {
    "tag": "*",
    "color": "#98C379",
    "strikethrough": false,
    "underline": false,
    "backgroundColor": "transparent",
    "bold": false,
    "italic": false
  }
]
```

## 协议

[MIT](./LICENSE)

**Enjoy!**
