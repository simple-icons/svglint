import path from "path";
import fs from "fs";

/**
 * Check if a file exists
 * @param {String} filepath The file to check for existence
 * @returns {Promise<String,Boolean>} true if the file exists, false otherwise
 */
function fileExists(filepath) {
    return new Promise((res)=>{
        fs.access(filepath, fs.constants.F_OK, err => {
            if (!err) {
                return res(true);
            }
            res(false);
        });
    });
}

/**
 * Check if a package.json file is defining the property "type" to "module".
 * @param {String} filepath The package.json file to check
 * @returns {Boolean} true if `"type": "module"` is defined, false otherwise
 **/
function isEsmPackageJson(filename) {
    try {
        let pkg = JSON.parse(fs.readFileSync(filename, "utf8"));
        return pkg.type && pkg.type === "module";
    } catch (err) {
        return false;
    }
}

/**
 * Check if the default configuration file for SVGLint exists in a folder
 * @param {String} folder The folder to check
 * @returns {Promise<String,Boolean>} The path to the file if it exists, false otherwise
 */
async function getDefaultConfigurationFile(folder) {
    let filepath = path.resolve(folder, ".svglintrc.js");
    if (await fileExists(filepath)) {
        return filepath;
    }

    const packageJsonPath = path.resolve(folder, "package.json");
    if (await fileExists(packageJsonPath)) {
        filepath = path.resolve(
            folder,
            isEsmPackageJson(packageJsonPath) ? ".svglintrc.cjs" : ".svglintrc.mjs",
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
    let filepath = await getDefaultConfigurationFile(folder);
    if (filepath) {
        return filepath;
    } else {
        const parent = path.resolve(folder, "..");
        if (parent === folder) {
            return false;
        }
        return await getDefaultConfigurationFileTraversingParents(parent);
    }
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
        } else {
            return false;
        }
    }

    filepath = await getDefaultConfigurationFile(folder);
    if (filepath) {
        return filepath;
    }

    return await getDefaultConfigurationFileTraversingParents(folder);
}

/**
 * Load the configuration object discovered by `getConfigurationFile`
 * @param {String} folder The folder to start looking in
 * @returns {Promise<Object,null>} The configuration object, or null if no SVGLint configuration files found
 */
async function loadConfigurationFile(filename, folder=process.cwd()) {
    const filepath = await getConfigurationFile(filename, folder);
    if (filepath) {
        const module = await import(`file://${filepath}`);
        return module.default;
    } else {
        return null;
    }
}

export {
    getConfigurationFile,
    loadConfigurationFile,
};
