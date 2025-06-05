/**
 * @fileoverview Integration tests for svglint API.
 */

import path from 'node:path';
import expect from 'expect';
import {describe, it} from 'mocha';
import SVGLint from '../src/svglint.js';

const svg = '<svg></svg>';

describe('.lintSource()', () => {
	it('should succeed without config', (done) => {
		SVGLint.lintSource(svg).then((linting) => {
			linting.on('done', () => {
				expect(linting.state).toBe(linting.STATES.success);
				done();
			});
			linting.lint();
		});
	});

	it('should succeed with empty config', (done) => {
		SVGLint.lintSource(svg, {}).then((linting) => {
			linting.on('done', () => {
				expect(linting.state).toBe(linting.STATES.success);
				done();
			});
			linting.lint();
		});
	});

	it('should succeed with empty SVG', (done) => {
		SVGLint.lintSource(svg, {}).then((linting) => {
			linting.on('done', () => {
				expect(linting.state).toBe(linting.STATES.success);
				done();
			});
			linting.lint();
		});
	});

	it('should succeed with empty first line', (done) => {
		SVGLint.lintSource('\n' + svg, {}).then((linting) => {
			linting.on('done', () => {
				expect(linting.state).toBe(linting.STATES.success);
				done();
			});
			linting.lint();
		});
	});

	it('should throw with malformed SVG', (done) => {
		SVGLint.lintSource('<svg<path', {})
			.then((linting) => {
				linting.lint();
			})
			.catch(() => done());
	});
});

describe('.lintFile()', () => {
	it('should resolve with empty SVG', () =>
		SVGLint.lintFile(
			path.join(import.meta.dirname, './svgs/empty.svg'),
			{},
		).then((linting) => {
			linting.on('done', () => {
				expect(linting.state).toBe(linting.STATES.success);
			});
			linting.lint();
		}));

	it('should resolve with relative path', () => {
		SVGLint.lintFile('./test/svgs/empty.svg', {}).then((linting) => {
			linting.on('done', () => {
				expect(linting.state).toBe(linting.STATES.success);
			});
			linting.lint();
		});
	});

	it('should resolve with absolute path', () =>
		SVGLint.lintFile(
			path.join(import.meta.dirname, './svgs/empty.svg'),
			{},
		).then((linting) => {
			linting.on('done', () => {
				expect(linting.state).toBe(linting.STATES.success);
			});
			linting.lint();
		}));

	it('should succeed without config', () =>
		SVGLint.lintFile(path.join(import.meta.dirname, './svgs/empty.svg')).then(
			(linting) => {
				linting.on('done', () => {
					expect(linting.state).toBe(linting.STATES.success);
				});
				linting.lint();
			},
		));
});
