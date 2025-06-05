import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import logging from '../lib/logger.js';

const logger = logging('');

/**
 * Check if a file exists
 * @param {String} filepath The file to check for existence
 * @returns {Promise<Boolean>} true if the file exists, false otherwise
 */
function fileExists(filepath) {
	return new Promise((resolve) => {
		// eslint-disable-next-line n/prefer-promises/fs
		fs.access(filepath, fs.constants.F_OK, (error) => {
			if (!error) {
				return resolve(true);
			}

			resolve(false);
		});
	});
}

/**
 * Check if the package is an ESM project
 * @param {String} filepath The package.json file path
 * @returns {Boolean} true if the package is ESM based, false otherwise
 **/
function isEsmPackageJson(filename) {
	try {
		const package_ = JSON.parse(fs.readFileSync(filename, 'utf8'));
		return package_.type && package_.type === 'module';
	} catch {
		return false;
	}
}

/**
 * Check if the default configuration file for SVGLint exists in a folder
 * @param {String} folder The folder to check
 * @returns {Promise<String,Boolean>} The path to the file if it exists, false otherwise
 */
async function getDefaultConfigurationFile(folder) {
	let filepath = path.resolve(folder, '.svglintrc.js');
	if (await fileExists(filepath)) {
		return filepath;
	}

	const packageJsonPath = path.resolve(folder, 'package.json');
	if (await fileExists(packageJsonPath)) {
		filepath = path.resolve(
			folder,
			(await isEsmPackageJson(packageJsonPath))
				? '.svglintrc.cjs'
				: '.svglintrc.mjs',
		);
		if (await fileExists(filepath)) {
			return filepath;
		}
	}

	return false;
}

/**
 * Gets the configuration file to use, traversing the parent folders
 * @param {String} folder The folder to look in
 * @returns {Promise<String,Boolean>} The path to the configuration file, or false
 */
async function getDefaultConfigurationFileTraversingParents(folder) {
	const filepath = await getDefaultConfigurationFile(folder);
	if (filepath) {
		return filepath;
	}

	const parent = path.resolve(folder, '..');
	if (parent === folder) {
		return false;
	}

	return getDefaultConfigurationFileTraversingParents(parent);
}

/**
 * Get the configuration file to use from the home directory.
 * @returns {Promise<String,Boolean>} The path to the configuration file, or false
 */
async function getConfigurationInHomedir() {
	let filepath;

	const homedirFile = path.join(os.homedir(), '.svglintrc.js');
	if (await fileExists(homedirFile)) {
		filepath = homedirFile;
	}

	return filepath;
}

/**
 * Get the configuration file to use
 * @param {String} filename The filename to look for
 * @param {String} folder The folder to look in
 * @returns {Promise<String,Boolean>} The path to the configuration file, or false
 */
async function getConfigurationFile(filename, folder) {
	let filepath;
	if (filename) {
		filepath = path.isAbsolute(filename)
			? filename
			: path.resolve(folder, filename);
		if (await fileExists(filepath)) {
			return filepath;
		}

		return false;
	}

	filepath = await getDefaultConfigurationFileTraversingParents(folder);
	if (filepath) {
		return filepath;
	}

	return getConfigurationInHomedir();
}

/**
 * Load the configuration object from the SVGLint configuration file
 * @param {String} folder The folder to start looking in
 * @returns {Promise<Object,null>} The configuration object, or null if no SVGLint configuration file is found
 */
async function loadConfigurationFile(filename, folder = process.cwd()) {
	const filepath = await getConfigurationFile(filename, folder);
	logger.debug('Using configuration file: ' + filepath);
	if (filepath) {
		const module = await import(`file://${filepath}`);
		return module.default;
	}

	return null;
}

export {loadConfigurationFile};
