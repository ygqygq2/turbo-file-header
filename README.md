# turbo-file-header

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/ygqygq2.turbo-file-header.svg?color=07c160&label=turbo-file-header&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=ygqygq2.turbo-file-header)
![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/ygqygq2.turbo-file-header)

Turbo file header, sets file header information globally or for a project.

## Features

- `ctrl + alt + h` generate the active document file header.
- Command `Turbo File Header: Generate Custom Template Config File` generate custom file header template configuration file.
- Generate file header based on the file header template configuration.
- Use more reader-friendly comments to highlight important parts in your code.
- Support for languages in [VSCode known identifiers](https://code.visualstudio.com/docs/languages/identifiers#_known-language-identifiers).

## Settings

Properties:

| Feature                           | Description                                                      | Setting                          | Default               |
| --------------------------------- | ---------------------------------------------------------------- | -------------------------------- | --------------------- |
| Custom user name                  | The fixed user name. The default is from your VCS                | userName                         | ``                    |
| Custom user email                 | The fixed user email. The default is from your VCS               | userEmail                        | ``                    |
| Custom company name               | Company name                                                     | companyName                      | `YourCompanyName`     |
| Date format                       | The [date format](https://momentjs.com/docs/#/displaying/format) | dateFormat                       | `YYYY-MM-DD HH:mm:ss` |
| Auto insert on create file        | When create file, auto insert file header                        | autoInsertOnCreateFile           | `false`               |
| Auto update on save file          | When save file, auto update file header                          | autoUpdateOnSave                 | `false`               |
| Disable fields in file header     | The fields that you want to disable in file header               | disableFields                    | `[]`                  |
| Only dirty file or not to support | Only dirty file to support update file header                    | updateHeaderForModifiedFilesOnly | `false`               |
| Extra languages support           | To support new or unknown languages                              | languages                        | the below             |
| Multiline comment highlighter     | Whether the multiline comment highlighter should be active       | multilineComments                | `true`                |
| plaintext comment highlighter     | Whether the plaintext comment highlighter should be active       | highlightPlainText               | `false`               |
| Use tags to color the comments    | Tags which are used to color the comments                        | tags                             | the below             |
| Tags for light themes             | Overwrite tags options for light themes                          | tagsLight                        | `[]`                  |
| Tags for dark themes              | Overwrite tags options for dark themes                           | tagsDark                         | `[]`                  |

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
