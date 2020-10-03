import chalk from "chalk";
import { inspect as utilInspect } from "util";

export function inspect(obj: any) {
    return chalk.reset(utilInspect(obj, false, 3, true));
}
