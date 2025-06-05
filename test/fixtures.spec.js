/**
 * @fileoverview Tests for fixtures.
 */

import {describe, it} from 'mocha';
import {testFailsFactory, testSucceedsFactory} from './helpers.js';

const testSVGTitle = 'Foo';
const testSVG = `<svg>
    <title>${testSVGTitle}</title>
    <g>
        <path></path>
        <path></path>
    </g>
    <g></g>
</svg>`;

const testFails = async (config) => testFailsFactory(testSVG, config)();
const testSucceeds = async (config) => testSucceedsFactory(testSVG, config)();

describe('Fixtures', () => {
	it('should inject a fixture to a custom rule', () =>
		testSucceeds({
			fixtures: () => ({foo: 'foo'}),
			rules: {
				custom: [
					(reporter, $, ast, {fixtures}) => {
						if (fixtures.foo !== 'foo') {
							reporter.error('Fixture not injected correctly');
						}
					},
				],
			},
		}));
	it('can access to cheerio', () =>
		testSucceeds({
			fixtures: (_, $) => ({foo: $.find('title').text()}),
			rules: {
				custom: [
					(reporter, _$, _ast, {fixtures}) => {
						if (fixtures.foo !== testSVGTitle) {
							reporter.error('Fixture cannot access to cheerio');
						}
					},
				],
			},
		}));
	it('can access to the AST', () =>
		testSucceeds({
			fixtures: (_, _$, ast) => ({foo: ast[0].children[1].children[0].data}),
			rules: {
				custom: [
					(reporter, $, ast, {fixtures}) => {
						if (fixtures.foo !== testSVGTitle) {
							reporter.error('Fixture cannot access to the AST');
						}
					},
				],
			},
		}));
	it('can access to filepath', () =>
		testSucceeds({
			fixtures: (_, _$, _ast, {filepath}) => ({foo: filepath}),
			rules: {
				custom: [
					(reporter, $, _ast, {fixtures}) => {
						if (fixtures.foo !== null) {
							reporter.error('Fixture cannot access to the filepath');
						}
					},
				],
			},
		}));
	it('can not modify cheerio', () =>
		testSucceeds({
			fixtures(_, $, _ast) {
				$.foo = 'bar';
			},
			rules: {
				custom: [
					(reporter, $, _ast) => {
						if ($.foo !== undefined) {
							reporter.error('Fixture edited cheerio');
						}
					},
				],
			},
		}));
	it('can not modify AST', () =>
		testSucceeds({
			fixtures(_, _$, ast) {
				ast.foo = 'bar';
			},
			rules: {
				custom: [
					(reporter, _$, ast) => {
						if (ast.foo !== undefined) {
							reporter.error('Fixture edited AST');
						}
					},
				],
			},
		}));
	it('uses their own reporter', () =>
		testSucceeds({
			fixtures(reporter) {
				reporter.foo = 'bar';
			},
			rules: {
				custom: [
					(reporter, _$) => {
						if (reporter.foo !== undefined) {
							reporter.error('Fixture uses the same reporter');
						}
					},
				],
			},
		}));
	it('reporting error fail', () =>
		testFails({
			fixtures(reporter) {
				reporter.error('Im a fixture reporting without a rule');
			},
		}));
	it('throwing Error fail', () =>
		testFails({
			fixtures() {
				throw new Error('Im a fixture throwing an error without a rule');
			},
		}));
});
