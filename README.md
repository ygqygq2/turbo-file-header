# turbo-file-header

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/ygqygq2.turbo-file-header.svg?color=07c160&label=turbo-file-header&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=ygqygq2.turbo-file-header)
![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/ygqygq2.turbo-file-header)

[中文](README.zh-CN.md)

Turbo file header, sets file header information globally or for a project.

## Features

- `ctrl + alt + h` generate the active document file header.
- Command `Turbo File Header: Generate Custom Template Config File` generate custom file header template configuration file.
- Generate file header based on the file header template configuration.
- Use more reader-friendly comments to highlight important parts in your code.
- Support for languages in [VSCode known identifiers](https://code.visualstudio.com/docs/languages/identifiers#_known-language-identifiers).
- Extension configuration Multi-language display, l10n support.

## Settings

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
| Multiline regex pattern           | Match the original file header using multiline regex pattern.        | patternMultiline                 | `false`                  |
| Only dirty file or not to support | Only dirty file to support update file header                        | updateHeaderForModifiedFilesOnly | `false`                  |
| Extra languages support           | To support new or unknown languages                                  | languages                        | the below                |
| JSDoc style for js/ts             | File header user JSDoc style comments                                | useJSDocStyle                    | `false`                  |
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
