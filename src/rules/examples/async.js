import logging from '../../lib/logger.js';

const logger = logging('rule:async');

/**
 * @typedef AsyncConfig
 * @property {"error"|"warn"|"log"|null} method The method to call on reporter
 * @property {String} message The message to warn/error with
 * @property {Number} wait The number of seconds to wait
 */

const asyncExample = {
    /**
     * Generates a linting function from a config
     * @param {AsyncConfig} config
     */
    generate(config) {
        return function (reporter) {
            logger.debug('Called', config);
            let {wait} = config;
            return new Promise((resolve) => {
                const intervalID = setInterval(() => {
                    if (--wait <= 0) {
                        clearInterval(intervalID);
                        // Report the message if type !== succeed
                        if (config.method) {
                            reporter[config.method](config.message);
                        }

                        resolve();
                    } else {
                        logger.log(wait, 'seconds to go');
                    }
                }, 1000);
            });
        };
    },
};

export default asyncExample;
