import { chunkString } from "./util";
import chalk from "chalk";

describe("chunkString", () => {
    it("should return empty array for empty string", () => {
        expect(chunkString("", 8)).toEqual([]);
    });

    it("should return the string for small strings", () => {
        expect(chunkString("abcd", 8)).toEqual(["abcd"]);
    });

    it("should split long strings at the given length", () => {
        expect(chunkString("abcdefghijklmn", 8)).toEqual([
            "abcdefgh",
            "ijklmn",
        ]);
    });

    it("shouldn't count ANSI color codes towards the length", () => {
        const str = "\u001b[31mabcd\u001b[42mefgh\u001b[32mijkl\u001b[41mmn";
        const expected = [
            "\u001b[31mabcd\u001b[42mefgh",
            "\u001b[32mijkl\u001b[41mmn",
        ];
        expect(chunkString(str, 8).map(encodeURIComponent)).toEqual(
            expected.map(encodeURIComponent)
        );
    });

    it("should include the final ANSI color code if one exists", () => {
        const str = "\u001b[31mabcd\u001b[42mefgh\u001b[0m";
        const expected = ["\u001b[31mabcd\u001b[42mefgh", "\u001b[0m"];

        expect(chunkString(str, 8).map(encodeURIComponent)).toEqual(
            expected.map(encodeURIComponent)
        );
    });
});
