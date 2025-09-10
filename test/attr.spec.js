/**
 * @fileoverview Tests for the `attr` rules.
 */

import {describe, it} from 'mocha';
import {testFailsFactory, testSucceedsFactory} from './helpers.js';

const testSVG = `<svg role="img" viewBox="0 0 24 24">
    <g id="foo">
        <path d="bar"></path>
    </g>
    <g></g>
    <circle></circle>
    <rect height="100" width="300" style="fill:black;" />
</svg>`;

const testFails = testFailsFactory(testSVG, 'attr');
const testSucceeds = testSucceedsFactory(testSVG, 'attr');

describe('Rule: attr', () => {
	it('should succeed without config', () => testSucceeds({}));

	it('should succeed with a required attribute', () =>
		testSucceeds({
			role: true,
			'rule::selector': 'svg',
		}));
	it('should fail without a required attribute', () =>
		testFails({
			id: true,
			'rule::selector': 'g',
		}));

	it('should succeed without a disallowed attribute', () =>
		testSucceeds({
			foo: false,
			'rule::selector': 'svg',
		}));
	it('should fail with a disallowed attribute', () =>
		testFails({
			role: false,
			'rule::selector': 'svg',
		}));

	it('should succeed with a valid value when given array', () =>
		testSucceeds({
			role: ['img', 'progressbar'],
			'rule::selector': 'svg',
		}));
	it('should fail with an invalid value when given array', () =>
		testFails({
			role: ['foo', 'bar'],
			'rule::selector': 'svg',
		}));

	it('should succeed with a valid value when given regex', () =>
		testSucceeds({
			role: /^im.$/,
			'rule::selector': 'svg',
		}));
	it('should fail with an invalid value when given regex', () =>
		testFails({
			role: /^.im$/,
			'rule::selector': 'svg',
		}));
	it('should fail with a non-existent attribute when given regex', () =>
		testFails({
			foo: /^img$/,
			'rule::selector': 'svg',
		}));

	it('should default to wildcard selector', () =>
		testFails({
			id: false,
		}));
	it('should succeed with non-found banned attribute on all elements', () =>
		testSucceeds({
			foobar: false,
		}));
	it('should fail with found banned attribute on all elements', () =>
		testFails({
			viewBox: false,
		}));

	it('should succeed in whitelist-mode when all attributes are allowed', () =>
		testSucceeds({
			role: ['img', 'progressbar'],
			viewBox: true,
			'rule::selector': 'svg',
			'rule::whitelist': true,
		}));

	it('should succeed in whitelist-mode when all required attributes match', () =>
		testSucceeds({
			width: true,
			height: true,
			style: true,
			'x?': true,
			'rule::selector': 'rect',
			'rule::whitelist': true,
		}));

	it('should succeed in whitelist-mode when all required and optional attributes match', () =>
		testSucceeds({
			width: true,
			height: true,
			'style?': true,
			'rule::selector': 'rect',
			'rule::whitelist': true,
		}));

	it('should fail in whitelist-mode when not all attributes are allowed', () =>
		testFails({
			role: ['img', 'progressbar'],
			viewBox: true,
			id: 'foo',
			'rule::selector': 'svg',
			'rule::whitelist': true,
		}));

	it('should fail in whitelist-mode with an invalid value for an optional attribute', () =>
		testFails({
			role: ['img', 'progressbar'],
			'viewBox?': '0 0 25 25',
			'rule::selector': 'svg',
			'rule::whitelist': true,
		}));

	it('should succeed in whitelist-mode without attributes', () =>
		testSucceeds({
			'rule::selector': 'circle',
			'rule::whitelist': true,
		}));
	it('should fail in whitelist-mode with attributes', () =>
		testFails({
			'rule::selector': 'svg',
			'rule::whitelist': true,
		}));
	it('should succeed enforcing right attributes ordering', () =>
		testSucceeds({
			'rule::selector': 'rect',
			'rule::order': ['height', 'width', 'style'],
		}));
	it('should fail enforcing wrong attributes ordering', () =>
		testFails({
			'rule::selector': 'rect',
			'rule::order': ['width', 'style', 'height'],
		}));
	it('should succeed enforcing ordering of first attributes', () =>
		testSucceeds({
			'rule::selector': 'rect',
			'rule::order': ['height', 'width'],
		}));
	it('should succeed enforcing soft ordering of some attributes', () =>
		testSucceeds({
			'rule::selector': 'rect',
			'rule::order': ['height', 'style'],
		}));
	it('should succeed enforcing alphabetical ordering with true', () =>
		testSucceeds({
			'rule::selector': 'svg',
			'rule::order': true,
		}));
	it('should fail enforcing alphabetical ordering', () =>
		testFails({
			'rule::selector': 'rect',
			'rule::order': true,
		}));
	it('should succeed enforcing hard ordering with whitelist', () =>
		testSucceeds({
			role: true,
			viewBox: true,
			'rule::selector': 'svg',
			'rule::whitelist': true,
			'rule::order': true,
		}));
	it.only('should fail customizing ordering with whitelist', () =>
		testFailsFactory(
			testSVG.replace('viewBox="0 0 24 24"', 'viewBox="0 0 24 24" foo="bar"'),
			'attr',
		)({
			role: true,
			viewBox: true,
			'rule::selector': 'svg',
			'rule::whitelist': true,
			'rule::order': ['role', 'viewBox'],
		}));
});
