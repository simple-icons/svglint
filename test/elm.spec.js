/**
 * @fileoverview Tests for the `elm` rules.
 */

import {describe, it} from 'mocha';
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

describe('Rule: elm', () => {
	it('should succeed without config', () => testSucceeds({}));

	it('should succeed with a required element', () =>
		testSucceeds({
			'svg > title': true,
		}));
	it('should fail without a required element', () =>
		testFails({
			'svg > foobar': true,
		}));

	it('should succeed without a disallowed element', () =>
		testSucceeds({
			'g > foobar': false,
		}));
	it('should fail with a disallowed element', () =>
		testFails({
			'g > path': false,
		}));

	it('should succeed with a found number of elements', () =>
		testSucceeds({
			g: 2,
		}));
	it('should fail with an exceeded number of elements', () =>
		testFails({
			g: 1,
		}));
	it('should fail with a too low number of elements', () =>
		testFails({
			g: 3,
		}));

	it('should succeed with a found range of elements', () =>
		Promise.all([
			testSucceeds({
				'g > path': [1, 2],
			}),
			testSucceeds(
				{
					'g > path': [1, 2],
				},
				'<svg><g><path></path></g></svg>',
			),
		]));
	it('should fail with an exceeded range of elements', () =>
		testFails({
			'g > path': [0, 1],
		}));
	it('should fail with a too low range of elements', () =>
		testFails({
			'g > path': [3, 5],
		}));

	it('should succeed when a disallowed element is allowed by another rule', () =>
		Promise.all([
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
		]));
});
