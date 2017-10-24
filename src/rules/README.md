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

### `attr`

Specifies the attributes on the elements that match the selector. 
Specified as a map with keys mapping to the wanted values. Supported value types are `Array<String>|String|Boolean`.  
The selector is given in key `rule::selector`. It defaults to `"*"`.

Default functionality acts as a blacklist. If the key `rule::whitelist` is set to `true`, it will instead act as a whitelist.

```javascript
[{
    role: ["img", "progressbar"], // role must be one of ["img","progressbar"]
    viewBox: "0 0 24 24",         // viewBox must be "0 0 24 24"
    xmlns: true,                  // xmlns must be set
    width: false,                 // width must not be set
    "rule::whitelist": true,      // no other attributes can be set
    "rule::selector": "svg",      // check attributes on the root svg object
}, {
    "rule::whitelist": true,      // ban all attributes
    "rule::selector": "title",    // on all title elements
}, {
    stroke: false,                // ban strokes on all elements
}]
```

### `elm`

Specifies the elements that must/must not exist.  
Specified as a map with keys mapping to a value. Supported value types are `Array<Number>|Number|Boolean`.
The key is used as a selector.  
If the value is a boolean, it indicates whether the selector must be matched (`true`) or must not be matched (`false`).  
If the value is a number, it indicates that exactly that number of matches must be found.  
If the number is an array, it must have a length of 2, and indicates the range between which the number of matches must be.

If an element is permitted by one rule and rejected by another, it is overall permitted.

```javascript
{
    "svg": true,         // the root svg element must exist
    "svg > title": true, // the title element must exist inside the root element
    "g": 2,              // exactly 2 groups must exist
    "g > path": [0,2],   // up to and including two paths can be in each group
    "*": false,          // nothing else can exist
}
```

### `custom`

A custom function.  
Is given the cheerio object representing the SVG, and must return either `true` for success, or `false` for error.  
If a string is returned it is interpretted as an error, and the string used as error message.  
If an array of strings is returned it is interpretted as an array of errors, and the strings used as error messages.
