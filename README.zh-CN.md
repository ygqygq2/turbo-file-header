# turbo-file-header

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/ygqygq2.turbo-file-header.svg?color=07c160&label=turbo-file-header&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=ygqygq2.turbo-file-header)
![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/ygqygq2.turbo-file-header)

[English](README.md)

Turbo file header, 可以全局设置文件头或者项目级设置文件头。

## 功能

- `ctrl + alt + h` 快捷键生成/更新文件头。
- 命令 `Turbo File Header: Generate Custom Template Config File` 生成项目级自定义文件头配置文件.
- 支持全局配置或项目级自定义文件头模板配置生成文件头。
- 更友好的注释高亮显示，支持自定义配置。
- 支持各种语言[VSCode known identifiers](https://code.visualstudio.com/docs/languages/identifiers#_known-language-identifiers).
- 扩展配置说明多语言显示 l10n 支持.

## 配置

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
| 只支持脏文件             | 只有已更新但未保存文件支持插入/更新文件头                             | updateHeaderForModifiedFilesOnly | `false`                  |
| 额外语言支持             | 通过配置支持新/未知语言插入/更新文件头                                | languages                        | the below                |
| JSDoc 注释风格支持 js/ts | js/ts 文件使用 JSDoc 注释风格                                         | useJSDocStyle                    | `false`                  |
| 块注释高亮支持           | 块注释支持高亮功能                                                    | multilineComments                | `true`                   |
| 纯文件高亮支持           | 纯文件支持高亮功能                                                    | highlightPlainText               | `false`                  |
| 配置 `tags`              | 使用 `tags` 配置注释高亮                                              | tags                             | the below                |
| 配置 `tags` 在明亮主题   | 明亮主题中的 `tags` 配置                                              | tagsLight                        | `[]`                     |
| 配置 `tags` 在暗黑主题   | 暗黑主题中的 `tags` 配置                                              | tagsDark                         | `[]`                     |

**注意e**:

- `include` 和 `exclude` 是为了控制文件头影响范围，`addFileheader` 命令不受它们影响。
- `author` 包含用户名/邮箱，如果文件被 VCS 追踪，将从 VCS 中获取用户信息，否则将使用备用用户名/邮箱.

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
