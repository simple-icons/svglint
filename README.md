# SVGLint (WiP)

Lints SVG files. Can be run as a commandline utility, or as a NodeJS library.

```
$ svglint test/svgs/*

------------------------------------ Files ------------------------------------
✓ test/svgs/attr.test.svg
x test/svgs/elm.test.svg
   x attr 3:8 Expected attribute 'd', didn't find it
                At node <path> (3:8)
   x attr 4:8 Expected attribute 'd', didn't find it
                At node <path> (4:8)
x test/svgs/empty.svg
   x elm Expected 'g', none found

----------------------------------- Summary -----------------------------------
✓ 1 valid files.
x 2 invalid files.
```

![Example of a commandline execution](/example.png)
