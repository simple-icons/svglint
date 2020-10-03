import Logger from "../../lib/logger";
import Reporter from "../../lib/reporter";
const logger = Logger("rule:throws");

export type Config = {
    message: string;
};

export default function generate(config: Config) {
    return function ThrowsRule(reporter: Reporter) {
        logger.debug("Called", config);
        reporter.warn("This will throw now");
        throw new Error(config.message);
    };
}
