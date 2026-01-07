# turbo-file-header

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/ygqygq2.turbo-file-header.svg?color=07c160&label=turbo-file-header&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=ygqygq2.turbo-file-header)
[![VSCode Installs](https://img.shields.io/visual-studio-marketplace/i/ygqygq2.turbo-file-header?label=vscode%20installs)](https://marketplace.visualstudio.com/items?itemName=ygqygq2.turbo-file-header)
[![OpenVSX Downloads](https://img.shields.io/open-vsx/dt/ygqygq2/turbo-file-header?label=openvsx%20downloads)](https://open-vsx.org/extension/ygqygq2/turbo-file-header)

[中文](README.zh-CN.md) | [Wiki](https://github.com/ygqygq2/turbo-file-header/wiki)

> 🎨 **Make Your Code Comments Professional, Unified, and Intelligent** — Best Practice Tool for Team Collaboration

One-Click Professional File Headers & Function Comments • Multiple Languages Supported • Team Config Sharing • Git Smart Integration

---

## ✨ Core Features

### 🚀 File Header Management

- ⚡ **Keyboard Shortcuts** - `Ctrl+Alt+H` to generate/update file headers instantly
- 🎯 **Project-Level Config** - YAML config file, auto-sync across team members
- 🔄 **Batch Update** - Batch update multiple files with glob patterns
- 📦 **VCS Integration** - Auto-fetch author info and file time from Git

### 💡 Function Comment Generation

- 🔧 **Auto Parsing** - Supports multiple mainstream languages, auto-extract function signatures
- ⌨️ **Quick Shortcut** - `Ctrl+Alt+/` to auto-generate comment template for current function
- 📝 **Type Recognition** - Auto-extract function parameters and return types
- 🎨 **Multiple Styles** - Supports JSDoc, standard block comments, etc.

### 🎨 Comment Highlighting

- 🌈 **Comment Highlighting** - Custom tags highlighting with configurable colors
- 🎯 **Custom Tags** - # ! ? // todo \* tag highlighting
- 🌓 **Theme Adaptive** - Separate configs for light/dark themes
- ⚙️ **Fully Configurable** - Colors, styles, tags all customizable

---

## 🎬 Feature Demos

### 📝 File Header Generation

![File Header Demo](https://raw.githubusercontent.com/ygqygq2/turbo-file-header/main/docs/images/file-header.gif)

Press `Ctrl+Alt+H` to auto-generate file headers with author, time, copyright info

### 🔧 Auto Function Comments

![Function Comment Demo](https://raw.githubusercontent.com/ygqygq2/turbo-file-header/main/docs/images/function-comment.gif)

Press `Ctrl+Alt+/` to auto-extract function signature and generate comment template

### 🎨 Comment Highlighting

![Comment Highlighting](https://raw.githubusercontent.com/ygqygq2/turbo-file-header/main/docs/images/highlight.png)

`# ! ? // todo * tags` auto-colored for better readability

---

## 🌟 Core Advantages

| Feature                              | Description                                                                                     |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| 📁 **Project-Level Config**          | YAML config file, auto-sync across team, unified code standards                                 |
| 🔥 **Auto Function Comments**        | Supports multiple languages (TypeScript/JavaScript/Java/Go/Python/PHP/Rust/C) with auto parsing |
| 📦 **Deep VCS Integration**          | Auto-fetch author info, file creation/modification time from Git                                |
| 🎨 **Enhanced Comment Highlighting** | Built-in full comment highlighting, auto-color # ! ? // todo \* tags                            |
| 🌍 **Multi-Language UI**             | Config interface supports English/Chinese, better localization                                  |
| ⚡ **Batch Operations**              | Supports glob pattern batch update, one-click for entire project                                |
| 🎯 **Fine-Grained Config**           | 20+ config options, complete control over every detail                                          |
| 🔧 **Advanced Variable System**      | Supports variable calculation, reference, custom formatting                                     |
| 🔄 **Automated Workflow**            | Auto-insert on file creation, auto-update on save                                               |
| 📝 **Field Preservation**            | Keep specific fields (like description) when updating                                           |

---

## 🚀 Quick Start

### 📦 Installation

Search `turbo-file-header` in VS Code Marketplace or [Click to Install](vscode:extension/ygqygq2.turbo-file-header)

### ⚡ Get Started in 10 Seconds

1. **Create/Open a file** → Press `Ctrl+Alt+H` → Auto-insert file header ✨
2. **Move cursor to function** → Press `Ctrl+Alt+/` → Generate function comment 🎯
3. **Auto-update on save** → Enable `autoUpdateOnSave` config 🔄

### 👥 Team Collaboration

```bash
# 1. Execute command in project root
Ctrl+Shift+P → "Turbo File Header: Generate Custom Template Config File"

# 2. Edit the generated config file
.fileheader/fileheader.config.yaml

# 3. Commit to Git
git add .fileheader/
git commit -m "feat: add unified file header config"

# 4. Team members auto-sync after pull ✅
```

---

## 📚 Features in Detail

### 🎯 Basic Features

- **`Ctrl+Alt+H`** - Generate/update file headers with keyboard shortcut
- **`Ctrl+Alt+/`** - Add function comments (when cursor is on function name line)
- **Project Config** - Command `Generate Custom Template Config File` to create project-level config
- **Global + Project Config** - Supports both global and project configs, project config takes priority
- **Comment Highlighting** - Built-in comment highlighting with custom tags and colors
- **Multi-Language** - Supports all [VSCode known languages](https://code.visualstudio.com/docs/languages/identifiers#_known-language-identifiers)
- **i18n Interface** - Configuration descriptions support English/Chinese l10n

### 💻 Function Comment Supported Languages

Currently supports automatic function comment generation for (auto-extract function signature, parameters, return values):

| Language       | Features                                                          |
| -------------- | ----------------------------------------------------------------- |
| **TypeScript** | ✅ Parameter types, return types, optional params, default values |
| **JavaScript** | ✅ Arrow functions, regular functions, class methods, generators  |
| **Java**       | ✅ Method signatures, modifiers, annotation support               |
| **Go**         | ✅ Functions, methods, multiple return values                     |
| **Python**     | ✅ Functions, class methods, type hints                           |
| **PHP**        | ✅ Functions, class methods, type declarations                    |
| **Rust**       | ✅ Functions, methods, trait implementations                      |
| **C**          | ✅ Function declarations, pointer parameters                      |

> 💡 **Tip**: File header feature supports all VSCode languages, not limited to the above

---

## ⚙️ Configuration Guide

### Configuration Overview

Turbo File Header provides **20+ configuration options** to give you complete control over every detail of file headers and comments:

Properties:

| Feature                           | Description                                                          | Setting                          | Default                  |
| --------------------------------- | -------------------------------------------------------------------- | -------------------------------- | ------------------------ |
| Custom user name                  | The fixed user name. The default is from your VCS                    | userName                         | ``                       |
| Custom user email                 | The fixed user email. The default is from your VCS                   | userEmail                        | ``                       |
| Custom company name               | Company name                                                         | companyName                      | `YourCompanyName`        |
| Date format                       | The [date format](https://momentjs.com/docs/#/displaying/format)     | dateFormat                       | `YYYY-MM-DD HH:mm:ss`    |
| Auto insert on create file        | When create file, auto insert file header                            | autoInsertOnCreateFile           | `false`                  |
| Auto update on save file          | When save file, auto update file header                              | autoUpdateOnSave                 | `false`                  |
| Include glob                      | "include glob" for `autoInsertOnCreateFile` and batch update command | include                          | `**/this-default-glob/*` |
| Exclude glob                      | "exclude glob" for `autoInsertOnCreateFile` and batch update command | exclude                          | ``                       |
| Disable fields in file header     | The fields that you want to disable in file header                   | disableLabels                    | `[]`                     |
| Custom variable                   | Support use other variable                                           | customVariables                  | the below                |
| File header content               | File header content, overwrite the default file header content       | fileheader                       | the below                |
| Multiline regex pattern           | Match the original file header using multiline regex pattern         | patternMultiline                 | `false`                  |
| Only dirty file or not to support | Only dirty file to support update file header                        | updateHeaderForModifiedFilesOnly | `false`                  |
| Extra languages support           | To support new or unknown languages                                  | languages                        | the below                |
| JSDoc style for js/ts             | File header user JSDoc style comments                                | useJSDocStyle                    | `false`                  |
| Function comment settings         | Function comment settings for languages                              | functionComment                  | the below                |
| Multiline comment highlighter     | Whether the multiline comment highlighter should be active           | multilineComments                | `true`                   |
| plaintext comment highlighter     | Whether the plaintext comment highlighter should be active           | highlightPlainText               | `false`                  |
| Use tags to color the comments    | Tags which are used to color the comments                            | tags                             | the below                |
| Tags for light themes             | Overwrite tags options for light themes                              | tagsLight                        | `[]`                     |
| Tags for dark themes              | Overwrite tags options for dark themes                               | tagsDark                         | `[]`                     |

**Note**:

- `include` and `exclude` are used to control the scope of the file header update, except for `addFileheader` command.
- `author` if the file is tracked by VCS, it will get the author name/email from VCS, else it will get it from `userName`/`userEmail`.
- `patternMultiline` is `true`, the regular match will be less, and the performance will be better when batch update. When `false`, it supports some lines that are the same as the new file header and the line positions are different, and the performance impact is not significant.

**Fileheader variables**

- `{{birthtime}}` {string} file create time. will get it from VCS or fallback to filesystem when it is not available
- `{{mtime}}` {string} file modification time. will get it from VCS or fallback to filesystem when it is not available
- `{{authorName}}` {string} if the file is tracked by VCS, it will get the author name from VCS. else it will get it from current user name
- `{{authorEmail}}` {string} if the file is tracked by VCS, it will get the author email from VCS. else it will get it from current user email
- `{{userName}}` {string} else it will get it from current user name
- `{{userEmail}}` {string} userEmail user email is from VSCode config, and fallback to VCS config
- `{{companyName}}` {string} companyName
- `{{projectName}}` {string} name of current project
- `{{filePath}}` {string} the file path, relative to project root with POSIX path separator
- `{{dirPath}}` {string} the directory path, relative to project root with POSIX path separator
- `{{fileName}}` {string} filename with extension
- `{{description}}` {string} description for the file
- `{{now}}` {string} current time when the fileheader is generating, use `dateFormat` to format the time

**Custom variable value can use like this:**

- `{{now 'YYYY-MM-DD HH:mm:ss'}}` {string} current time when the fileheader is generating, use the custom format to format the time
- `{{now-1 'MM'}}` {string} current time when the fileheader is generating, use month, support calculation

## Default settings list

`customVariables` default settings:

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

> Tips:

- To match the `fileheader` settings `usePrevious` fields

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

> Tips:

- if use `"usePrevious": true`, please set the custom variable, then use the entire variable to represent the entire value.

`languages` default settings:

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
      "defaultParamType": "any",
      "typesUsingDefaultReturnType": [
        "void",
        "never",
        "unknown",
        "any"
      ],
      "useTypeAlias": true,
      "paramNameBeforeType": true
    },
    {
      "languageId": "java",
      "defaultReturnName": "default",
      "defaultReturnType": "auto",
      "defaultParamType": "any",
      "paramNameBeforeType": false
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

## License

[MIT](./LICENSE)

**Enjoy!**
