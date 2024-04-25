import process from 'node:process';
import util from 'node:util';
import {chalk} from '../src/cli/util.js';
import SVGLint from '../src/svglint.js';

process.on('unhandledRejection', (error) => {
    console.error(error);
});

/**
 * ### `custom`

Specifies a custom rule.
Used as a quick-and-dirty way of adding rules when you don't want to write an
entire NPM package.

```javascript
[function(reporter, $, ast) {
    reporter.error(
        "This will fail at <svg>",
        $.find("svg")[0],
        ast
    );
}, function(reporter, $, ast) {
    reporter.warn(
        "This will warn at <svg>",
        $.find("svg")[0],
        ast
    );
}, function(reporter, $, ast) {
    // this will succeed
}, function(reporter, $, ast) {
    // this does async work, then succeeds
    return new Promise(res => {
        setTimeout(() => res(), 1000);
    });
}]
```
 */

const testSVG = `<svg role="img" viewBox="0 0 24 24">
    <g id="foo">
        <path d="bar"></path>
    </g>
    <g></g>
    <circle></circle>
</svg>`;

function inspect(object) {
    return chalk.reset(util.inspect(object, false, 3, true));
}

/**
 * Tests that a config succeeds when ran
 * @param {Config} config The config to test
 * @param {String} [svg=testSVG] The SVG to lint
 * @returns {Promise<void>} Throws if linting fails
 */
async function testSucceeds(config, svg = testSVG) {
    const _config = {
        rules: {custom: config},
    };
    const linting = await SVGLint.lintSource(svg, _config);
    linting.on('done', () => {
        if (linting.state !== linting.STATES.success) {
            throw new Error(
                `Linting failed (${linting.state}): ${inspect(config)}`,
            );
        }
    });
}

/**
 * Tests that a config fails when ran
 * @param {Config} config The config to test
 * @param {String} svg The SVG to lint
 * @returns {Promise<void>} Throws if the linting doesn't fail
 */
async function testFails(config, svg = testSVG) {
    const _config = {
        rules: {custom: config},
    };
    const linting = await SVGLint.lintSource(svg, _config);
    linting.on('done', () => {
        if (linting.state !== linting.STATES.error) {
            throw new Error(
                `Linting did not fail (${linting.state}): ${inspect(_config)}`,
            );
        }
    });
}

describe('Rule: custom', function () {
    it('should succeed without config', function () {
        return testSucceeds([]);
    });

    it('should provide file information', function () {
        return testSucceeds([
            (_reporter, _$, _ast, info) => {
                if (!info) {
                    throw new Error('no info provided');
                }

                if (!Object.hasOwn(info, 'filepath')) {
                    throw new Error('no filepath provided on info');
                }
            },
        ]);
    });

    it('should succeed with a void function', function () {
        return testSucceeds([() => {}]);
    });
    it('should succeed with an async void function', function () {
        return testSucceeds([
            () =>
                new Promise((resolve) => {
                    setTimeout(() => resolve(), 250);
                }),
        ]);
    });
    it('should fail with an exception inside function', function () {
        return testFails([
            () => {
                throw new Error('Foo');
            },
        ]);
    });
    it('should fail with an erroring function', function () {
        return testFails([
            (reporter, $, ast) => {
                reporter.error('Fails', $.find('svg')[0], ast);
            },
        ]);
    });
    it('should fail with an async erroring function', function () {
        return testFails([
            (reporter, $, ast) =>
                new Promise((resolve) => {
                    setTimeout(() => {
                        reporter.error('Fails', $.find('svg')[0], ast);
                        resolve();
                    }, 250);
                }),
        ]);
    });
});
