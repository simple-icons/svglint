import path = require("path");
import fs = require("fs");

/**
 * Gets the configuration file to use
 * Throws if file isn't found
 * @param filename The filename to look for
 * @param folder The folder to look in
 * @returns The path to the configuration file, or false
 */
export function getConfigurationFile(
    filename = ".svglintrc.js",
    folder = process.cwd()
): Promise<string | boolean> {
    const resolved = path.isAbsolute(filename)
        ? filename
        : path.resolve(folder, filename);

    return new Promise((res, rej) => {
        fs.exists(resolved, exists => {
            if (exists) {
                // if file exists, finalize
                res(resolved);
            } else {
                const parent = path.resolve(folder, "..");
                if (parent === folder) {
                    return rej(
                        new Error(`Config file not found at '${resolved}'`)
                    );
                }
                // if not, get next folder
                getConfigurationFile(filename, path.resolve(folder, ".."))
                    .then(res)
                    .catch(rej);
            }
        });
    });
}
