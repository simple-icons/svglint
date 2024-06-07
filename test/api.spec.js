import path from 'node:path';
import {fileURLToPath} from 'node:url';
import expect from 'expect';
import SVGLint from '../src/svglint.js';

const currentFilePath = fileURLToPath(import.meta.url);
const __dirname = path.dirname(currentFilePath);

const svg = '<svg></svg>';

describe('.lintSource()', function () {
    it('should succeed without config', function (done) {
        SVGLint.lintSource(svg).then((linting) => {
            linting.on('done', () => {
                expect(linting.state).toBe(linting.STATES.success);
                done();
            });
            linting.lint();
        });
    });

    it('should succeed with empty config', function (done) {
        SVGLint.lintSource(svg, {}).then((linting) => {
            linting.on('done', () => {
                expect(linting.state).toBe(linting.STATES.success);
                done();
            });
            linting.lint();
        });
    });

    it('should succeed with empty SVG', function (done) {
        SVGLint.lintSource(svg, {}).then((linting) => {
            linting.on('done', () => {
                expect(linting.state).toBe(linting.STATES.success);
                done();
            });
            linting.lint();
        });
    });

    it('should succeed with empty first line', function (done) {
        SVGLint.lintSource('\n' + svg, {}).then((linting) => {
            linting.on('done', () => {
                expect(linting.state).toBe(linting.STATES.success);
                done();
            });
            linting.lint();
        });
    });

    /*
    TODO:
    it('should throw with malformed SVG', function (done) {
        SVGLint.lintSource('<svg<path', {}).catch(() => done());
    });
    */
});

describe('.lintFile()', function () {
    it('should resolve with empty SVG', function () {
        return SVGLint.lintFile(
            path.join(__dirname, './svgs/empty.svg'),
            {},
        ).then((linting) => {
            linting.on('done', () => {
                expect(linting.state).toBe(linting.STATES.success);
            });
            linting.lint();
        });
    });

    it('should resolve with relative path', function () {
        SVGLint.lintFile('./test/svgs/empty.svg', {}).then((linting) => {
            linting.on('done', () => {
                expect(linting.state).toBe(linting.STATES.success);
            });
            linting.lint();
        });
    });

    it('should resolve with absolute path', function () {
        return SVGLint.lintFile(
            path.join(__dirname, './svgs/empty.svg'),
            {},
        ).then((linting) => {
            linting.on('done', () => {
                expect(linting.state).toBe(linting.STATES.success);
            });
            linting.lint();
        });
    });

    it('should succeed without config', function () {
        return SVGLint.lintFile(path.join(__dirname, './svgs/empty.svg')).then(
            (linting) => {
                linting.on('done', () => {
                    expect(linting.state).toBe(linting.STATES.success);
                });
                linting.lint();
            },
        );
    });
});
