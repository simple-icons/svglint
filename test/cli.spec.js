import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {execa} from 'execa';
import expect from 'expect';

const VALID_SVG = path.resolve('./test/svgs/attr.test.svg');
const INVALID_SVG = path.resolve('./test/svgs/elm.test.svg');

/**
 * Run the CLI with a given list of arguments
 * @param {String[]} args The list of args
 * @param {String} cwd The working directory
 * @returns {Promise<{failed: boolean, stdout: string, exitCode: number}>} The CLI output
 */
async function execCli(arguments_, cwd = process.cwd(), input = null) {
    try {
        return await execa(path.resolve('./bin/cli.js'), arguments_, {
            cwd: path.resolve(cwd),
            input,
        });
    } catch (error) {
        return error;
    }
}

describe('CLI', function () {
    it('should succeed with --version', async function () {
        const {failed, stdout} = await execCli(['--version']);
        expect(failed).toBeFalsy();
        expect(stdout).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should succeed with --help', async function () {
        const {failed, stdout} = await execCli(['--help']);
        expect(failed).toBeFalsy();
        expect(stdout).not.toEqual('');
    });

    it('should succeed with a valid SVG', async function () {
        const {failed} = await execCli([VALID_SVG]);
        expect(failed).toBeFalsy();
    });

    it('should fail with a SVG that does not matches config', async function () {
        const {failed, exitCode} = await execCli(
            [INVALID_SVG],
            'test/projects/with-config',
        );
        expect(failed).toBeTruthy();
        expect(exitCode).toBe(1);
    });

    it('should succeed with a valid SVG on stdin', async function () {
        const {failed} = await execCli(
            ['--stdin'],
            process.cwd(),
            fs.readFileSync(VALID_SVG),
        );
        expect(failed).toBeFalsy();
    });

    it('should fail with a SVG that does not matches config on stdin', async function () {
        const {failed, exitCode} = await execCli(
            ['--stdin'],
            'test/projects/with-config',
            fs.readFileSync(INVALID_SVG),
        );
        expect(failed).toBeTruthy();
        expect(exitCode).toBe(1);
    });
});

describe('Configuration files', function () {
    it('should fail with an non-existent configuration file', async function () {
        const {failed, exitCode} = await execCli([
            '--config',
            './this/file/does/not-exist.js',
        ]);
        expect(failed).toBeTruthy();
        expect(exitCode).toBe(4);
    });

    it('should fail with a broken configuration file', async function () {
        const {failed, exitCode} = await execCli([
            '--config',
            './test/projects/broken/broken-svglint-config.js',
        ]);
        expect(failed).toBeTruthy();
        expect(exitCode).toBe(4);
    });

    it('should fail with a configuration file without default export', async function () {
        const {failed, exitCode} = await execCli([
            '--config',
            './test/projects/with-config-no-default-export/.svglintrc.js',
        ]);
        expect(failed).toBeTruthy();
        expect(exitCode).toBe(4);
    });

    it('should succeed passing an existent file path to --config', async function () {
        const {failed} = await execCli([
            VALID_SVG,
            '--config',
            'test/projects/esm/foo/custom-svglint-config.js',
        ]);
        expect(failed).toBeFalsy();
    });

    it('should succeed with an ESM .js config in a ESM project with type=module', async function () {
        const {failed} = await execCli([VALID_SVG], 'test/projects/esm/foo');
        expect(failed).toBeFalsy();
    });

    it('should succeed with an CJS .js config in a CJS project with type=commonjs', async function () {
        const {failed} = await execCli([VALID_SVG], 'test/projects/cjs/bar');
        expect(failed).toBeFalsy();
    });

    it('should succeed with a ESM .mjs config in a CJS project with type=commonjs', async function () {
        const {failed} = await execCli([VALID_SVG], 'test/projects/cjs/foo');
        expect(failed).toBeFalsy();
    });

    it('should succeed with a CJS .cjs config in a ESM project with type=module', async function () {
        const {failed} = await execCli([VALID_SVG], 'test/projects/esm/bar');
        expect(failed).toBeFalsy();
    });

    it('should succeed in a nested folder inside a project with a root config file', async function () {
        const {failed} = await execCli(
            [VALID_SVG],
            'test/projects/cjs/bar/a/b/c',
        );
        expect(failed).toBeFalsy();
    });

    it('should succeed in a project without a config file', async function () {
        const {stdout} = await execCli(
            [VALID_SVG],
            'test/projects/without-config',
        );
        expect(stdout).not.toMatch('Failed to lint');
    });
});

describe('--no-summary', function () {
    it('should not print summary with valid SVG', async function () {
        const {stdout} = await execCli([VALID_SVG, '--no-summary']);
        expect(stdout).not.toMatch('Summary');
    });

    it('should print the summary not passing --no-summary', async function () {
        const {stdout} = await execCli([VALID_SVG]);
        expect(stdout).toMatch('Summary');
    });

    it('should print errors with invalid SVG', async function () {
        const {stdout} = await execCli([INVALID_SVG, '--no-summary']);
        expect(stdout).toMatch('Files');
        expect(stdout).not.toMatch('Summary');
    });
});
