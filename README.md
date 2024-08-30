# SVGLint

Lints SVG files. Can be run as a commandline utility, or as a NodeJS library.

<!-- markdownlint-disable MD033 MD024 -->

<p align="center">
    <img src="https://raw.githubusercontent.com/birjolaxew/svglint/master/example.png" alt="Example of a commandline execution"/>
</p>

<!-- markdownlint-enable MD033 -->

## Usage

The tool can be used as a commandline tool by executing the CLI.
If installed as a dependency by NPM this will be found at `./node_modules/.bin/svglint`.
If installed globally by NPM it can be executed directly as `svglint`.

```shell
$ svglint --help

  Linter for SVGs

  Usage:
      svglint [--config config.js] [--ci] [--debug] file1.svg file2.svg
      svglint --stdin [--config config.js] [--ci] [--debug] < file1.svg

  Options:
      --help        Display this help text
      --version     Show the current SVGLint version
      --config, -c  Specify the config file. Defaults to '.svglintrc.js'
      --debug,  -d  Show debug logs
      --ci, -C      Only output to stdout once, when linting is finished
      --stdin       Read an SVG from stdin
```

The tool can also be used through the JS API.

```javascript
import SVGLint from "svglint";

const linting = await SVGLint.lintSource("<svg>...</svg>", {
    // ... config object goes here
});

linting.on("done", () => {
    if (!linting.valid) {
        console.log("You've been a naughty boy!");
    }
});

linting.lint();
```

## Config

SVGLint can run without a configuration file. In that case, it uses an empty object as the default configuration, which means that no rules are enabled. This default configuration may be changed such that previously valid SVGs become invalid in minor releases and patches.

In order to specify what should be linted SVGLint must be given a configuration object.

If you are using the CLI, this configuration object is read from the file specified by `--config`. This defaults to:

- *.svglintrc.js*
- If the *package.json* `type` field is set to `"module"`, then *.svglintrc.cjs* is also checked, else *.svglintrc.mjs* is checked.

These files will be searched for up through the directory tree, or in the user's home directory (e.g. `~/` on Unix-like systems).

This configuration file should export a single object, of the format:

```javascript
export default {
    rules: {
        // Built-in rules
        elm: {
            // config for the `elm` rule
        },
        attr: [{
            // config 1 for the `attr` rule
        }, {
            // config 2 for the `attr` rule
        }],
        valid: true,

        // Custom rules
        custom: [
            (reporter, $, ast) => {
                // config for a custom rule named `my-first-rule`
                reporter.name = 'my-first-rule';

                reporter.error('An error message');
                // ... additional code for the rule
            },
            (reporter, $, ast) => {
                // config for a custom rule named `my-second-rule`
                reporter.name = 'my-second-rule';

                reporter.warn('A warning message');
                // ... additional code for the rule
            }
        ],

        // External rules
        'simple-icons-svglint-rules/icon-precision': {
            // config for the rule `icon-precision` of the external
            // hypotetical npm package `simple-icons-svglint-rules`
        }
    },
    ignore: [
        'glob/to/files/to/ignores/**',
    ]
}
```

Additional configuration may be added in the future. For now, `rules` is the only useful key.

### Rules (`rules`)

All rules are optional.

#### `elm`

Rules at `elm` specify what elements are allowed in the SVG. It should be an object or an array of objects where:

- The keys are the element CSS selectors. See [*Selecting elements* on cheerio's documentation][selecting-elements-cheerio].
- The values are either:
  - `true` if at least one of the element is present.
  - `false` if the element must not be present.
  - A number to specify the number of times the element must be present.
  - An array of two numbers to specify the minimum and maximum number of times the element must be present.

##### Example

Only one `<svg>` element with one `<title>` element and one `<path>` element inside.

```javascript
export default {
    rules: {
        elm: {
            'svg': 1,
            'svg > title': 1,
            'svg > path': 1,
            '*': false
        }
    }
}
```

#### `attr`

Rules at `attr` specify the attributes that are allowed on elements. It should be an object or an array of objects where the keys must be either:

- `"rule::selector"`: The value must be the CSS selector of the element to which the rule applies. See [*Selecting elements* on cheerio's documentation][selecting-elements-cheerio].
- `"rule::whitelist"`: If enabled, extra attributes beyond of the ones defined in additional keys are not allowed on the element. The value must be a boolean.
- `"rule::order"`: The value must be either:
  - `true`: the attributes must be defined in alphabetical order.
  - An array of strings: the attributes must be defined in the order specified by the array.
- Other strings to refer to the attributes that are allowed for the element. The values can be either:
  - `false`: the attribute must not be present.
  - An string: the attribute must be present and have the value specified.
  - An array of strings: the attribute must be present and have one of the values specified.
  - A regular expression: the attribute must be present and match the regular expression.

##### Example

```javascript
export default {
    rules: {
        attr: [
            {
                // Ensure that the SVG element has the appropriate attributes
                // and alphabetically ordered
                role: 'img',
                viewBox: `0 0 24 24`,
                xmlns: 'http://www.w3.org/2000/svg',
                'rule::selector': 'svg',
                'rule::whitelist': true,
                'rule::order': true,
            },
            {
                // Ensure that the title element has not attributes
                'rule::selector': 'svg > title',
                'rule::whitelist': true,
            },
            {
                // Ensure that the path element only has the 'd' attribute
                d: /^m[-mzlhvcsqtae\d,. ]+$/i,
                'rule::selector': 'svg > path',
                'rule::whitelist': true,
            },
        ],
    }
}
```

#### `valid`

The `valid` rule is used to check that the SVG is valid using [`XMLValidator` of fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser/blob/HEAD/docs/v4/4.XMLValidator.md). It should be a boolean to enable or disable the rule.

#### Custom rules (`custom`)

Custom rules can be specified by an array of functions. Each function should have the signature `(reporter, $, ast, { filename }) => void`, where:

- `reporter` is the object that will be used to report the errors.
- `$` is the [cheerio object](https://cheerio.js.org/docs/api/classes/Cheerio) of the SVG.
- `ast` is the abstract syntax tree of the SVG generated by [htmlparser2](https://feedic.com/htmlparser2/).
- `filepath` is the absolute path of the file being linted.

You can use the setter of `reporter.name` to define the name of the rule shown by the output when errors are found. You can call `repoter.error(message)` to report an error.

##### Example

```javascript
export default {
    rules: {
        custom: [
            (reporter, $, ast, { filename }) => {
                // Don't allow explicit '</path>' closing tag
                reporter.name = 'no-self-closing-path';

                if (!ast.source.includes('</path>')) {
                    return;
                }

                const index = ast.source.indexOf('</path>');
                const reason =
                    `found a closing "path" tag at index ${index}.` +
                    ` The path should be self-closing,` +
                    ' use "/>" instead of "></path>".';
                reporter.error(`Invalid SVG content format: ${reason}`);
            },
        ]
    }
}
```

#### External rules

External rules can be specified by their package name and rule name, separated by a slash. The package must be installed as a dependency and will be imported by the import machinery using:

```javascript
import("package-of-the-rule/rule-name.js");
```

The rule function must be exported from the file `rule-name.js` in the package `package-of-the-rule` as the default export to expose it.

##### Example

```javascript
export default {
    rules: {
        'package-of-the-rule/rule-name': {
            // config for the rule `rule-name` of the external
            // hypotetical npm package `package-of-the-rule`
        }
    }
}
```

### `ignore`

It's an optional array of strings containing glob for files to ignore.

[selecting-elements-cheerio]: https://cheerio.js.org/docs/basics/selecting
