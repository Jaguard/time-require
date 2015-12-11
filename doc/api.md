## Programmatic API for time-require

1. Embedded usage, generally as first `require()` call in your main module.
```js
var timeRequire = require("time-require");
```

2. Toggle sorted output:
```js
timeRequire.sorted = true;
```

3. Adjust the timing threshold (by default, 0.01):
```js
timeRequire.threshold = 0; // equivalent to the CLI arg --verbose
```

4. Manually trigger logging the results to stdout (this is automatically called on `process.once('exit')`):
```js
timeRequire.logResults();
```
