# Writing rules

## Rule naming

Rules are generally named after the format `[<groupName>/]<ruleName>`.  
Meta-rules (rules that change how the rule functions) are named after the format
`rule::<groupName>/<ruleName>`. The rule name should never contain `:`.

For instance, a rule that checks for the presence of a11y attributes 
could be called `a11y/attr`, while a generic rule that checks for attributes 
could be called `attr`.

## File naming

Rules should be defined in their own file, named the same as the rule name
with `"/"` replaced by `"_"`. For instance, `a11y/attr` should be defined in
`a11y_attr.js`.

## Rule behavior

The rule should consist of a generator function that receives the rule value from the config.  
The generator function should then return a new function, which receives [a cheerio document](https://www.npmjs.com/package/cheerio) and returns a [rule result](#rule-results).

### Rule results

Rules can result in either success, warnings or errors.  
Success is represented by the value `true`, and does not have an accompanying message.  
A warning is represented by a `LintWarning` object from `src/rule-results.js`.  
An error is represented by an `LintError` object from `src/rule-results.js`.  

See `src/rule-results.js` for instructions on formatting messages.
