import { MSG_META } from "./util";

export interface GuiComponent {
    toString(): string;
}

export type LintingMessage = {
    message: string;
    type: keyof typeof MSG_META;
    prefix: string;
    args: any[];
    _node: { lineNum: number; columnNum: number };
};
