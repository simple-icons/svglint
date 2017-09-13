# SVGLint (WiP)

Lints SVG files. Can be run as a commandline utility, or as a NodeJS library.

```
$ svglint file.svg

                                     FILES                                     
✖ test/svgs/attr-root-1.svg
    attr/root: Failed on "role"; expected one of [ 'img', 'progressbar' ]
    attr/root: Failed on "foo"; unexpected attributes not allowed
    attr/root: Failed on "xmlns": must be set
    attr/root: Failed on "rule::whitelist": must be set
```
