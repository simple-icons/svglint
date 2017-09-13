# Rules

Rules are specified in the configuration under the `rules` key, as a map:

```javascript
{
    rules: {
        "attr/root": { viewBox: "0 0 16 16" },
        title: true
    }
}
```

## Available rules

### `attr/root`

Specifies the attributes on the root `<svg>` object. Specified as a map with keys mapping to the wanted values. Supported value types are `Array<String>|String|Boolean`.

Default functionality acts as a blacklist. If the key `rule::whitelist` is set to `true`, it will instead act as a whitelist.

```javascript
{
    role: ["img", "progressbar"], // role must be one of ["img","progressbar"]
    viewBox: "0 0 24 24",         // viewBox must be "0 0 24 24"
    xmlns: true,                  // xmlns must be set
    width: false,                 // width must not be set
    "rule::whitelist": true       // no other attributes can be set
}
```