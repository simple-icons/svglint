const logger = require("../lib/logger")("rule:async");

/**
 * @typedef AsyncConfig
 * @property {"error"|"warn"|null} method The method to call on reporter
 * @property {String} message The message to warn/error with
 * @property {Number} wait The number of seconds to wait
 */

module.exports = {
    /**
     * Generates a linting function from a config
     * @param {AsyncConfig} config 
     */
    generate(config) {
        return function AsyncRule(reporter) {
            logger.debug("Called", config);
            logger.log("Waiting", config.wait, "seconds");
            let wait = config.wait;
            return new Promise(res => {
                const intervalID = setInterval(() => {
                    if (--wait <= 0) {
                        clearInterval(intervalID);
                        // Report the message if type !== succeed
                        if (config.method) {
                            reporter[config.method](config.message);
                        }
                        res();
                    } else {
                        reporter.log([wait, "seconds to go"]);
                    }
                }, 1000);
            });
        };
    }
};
