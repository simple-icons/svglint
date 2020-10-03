import Reporter from "../../lib/reporter";
import Logger from "../../lib/logger";
const logger = Logger("rule:async");

export type Config = {
    // The method to call on the reporter
    method: "error" | "warn" | null;
    // The message to warn/error with
    message: string;
    // The number of seconds to wait
    wait: number;
};

export default function generate(config: Config) {
    return function AsyncRule(reporter: Reporter) {
        logger.debug("Called", config);
        let wait = config.wait;
        // return a promise so caller knows when we're done
        return new Promise((res) => {
            const intervalID = setInterval(() => {
                if (--wait <= 0) {
                    clearInterval(intervalID);
                    // call the reporter method we were told to, to reporter an error/warning
                    if (config.method) {
                        reporter[config.method](config.message);
                    }
                    res();
                } else {
                    logger.log(wait, "seconds to go");
                }
            }, 1000);
        });
    };
}
