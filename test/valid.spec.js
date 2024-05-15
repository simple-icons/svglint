/**
 * @fileoverview Tests for the `valid` rule.
 */

import {testFailsFactory, testSucceedsFactory} from './helpers.js';

const testFails = async (svg, config) => testFailsFactory(svg, config)();
const testSucceeds = async (svg, config) => testSucceedsFactory(svg, config)();

describe('Rule: valid', function () {
    it('should succeed by default for a valid SVG', function () {
        return testSucceeds(
            `<svg role="img" viewBox="0 0 24 24">
            <g id="foo">
                <path d="bar"></path>
            </g>
            <g></g>
            <circle></circle>
        </svg>`,
            {rules: {}},
        );
    });
    it('should fail by default for an invalid SVG', function () {
        return testFails(
            `<svg viewBox="0 0 24 24" role="img">
          <title>BadOne icon</title>
          <path "M20.013 10.726l.001-.028A6.346"/>
        </svg>`,
            {rules: {}},
        );
    });

    it('should succeed when enabled for a valid SVG', function () {
        return testSucceeds(
            `<svg role="img" viewBox="0 0 24 24">
            <g id="foo">
                <path d="bar"></path>
            </g>
            <g></g>
            <circle></circle>
        </svg>`,
            {rules: {valid: true}},
        );
    });
    it('should fail when enabled for an invalid SVG', function () {
        return testFails(
            `<svg viewBox="0 0 24 24" role="img">
          <title>BadOne icon</title>
          <path "M20.013 10.726l.001-.028A6.346"/>
        </svg>`,
            {rules: {valid: true}},
        );
    });

    it('should succeed when disabled for a valid SVG', function () {
        return testSucceeds('<svg></svg>', {rules: {valid: false}});
    });
    it('should succeed when disabled for an invalid SVG', function () {
        return testSucceeds(
            `<svg><path "M20.013 10.726l.001-.028A6.346"/></svg>`,
            {rules: {valid: false}},
        );
    });
});
