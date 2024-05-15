/**
 * @fileoverview Tests for the `elm` rules.
 */

import {testFailsFactory, testSucceedsFactory} from './helpers.js';

const testSVG = `<svg>
    <title></title>
    <g>
        <path></path>
        <path></path>
    </g>
    <g></g>
</svg>`;

const testFails = testFailsFactory(testSVG, 'elm');
const testSucceeds = testSucceedsFactory(testSVG, 'elm');

describe('Rule: elm', function () {
    it('should succeed without config', function () {
        return testSucceeds({});
    });

    it('should succeed with a required element', function () {
        return testSucceeds({
            'svg > title': true,
        });
    });
    it('should fail without a required element', function () {
        return testFails({
            'svg > foobar': true,
        });
    });

    it('should succeed without a disallowed element', function () {
        return testSucceeds({
            'g > foobar': false,
        });
    });
    it('should fail with a disallowed element', function () {
        return testFails({
            'g > path': false,
        });
    });

    it('should succeed with a found number of elements', function () {
        return testSucceeds({
            g: 2,
        });
    });
    it('should fail with an exceeded number of elements', function () {
        return testFails({
            g: 1,
        });
    });
    it('should fail with a too low number of elements', function () {
        return testFails({
            g: 3,
        });
    });

    it('should succeed with a found range of elements', function () {
        return Promise.all([
            testSucceeds({
                'g > path': [1, 2],
            }),
            testSucceeds(
                {
                    'g > path': [1, 2],
                },
                '<svg><g><path></path></g></svg>',
            ),
        ]);
    });
    it('should fail with an exceeded range of elements', function () {
        return testFails({
            'g > path': [0, 1],
        });
    });
    it('should fail with a too low range of elements', function () {
        return testFails({
            'g > path': [3, 5],
        });
    });

    it('should succeed when a disallowed element is allowed by another rule', function () {
        return Promise.all([
            testSucceeds({
                path: false,
                'g > path': true,
            }),
            testSucceeds({
                path: false,
                'g > path': 2,
            }),
            testSucceeds({
                path: false,
                'g > path': [1, 2],
            }),
        ]);
    });
});
