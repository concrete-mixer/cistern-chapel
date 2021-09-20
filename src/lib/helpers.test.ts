import * as helpers from "./helpers";

describe("helpers.testNumericChoice", () => {
    // This function returns random integers within a range, so the main thing to
    // test is that returned numbers aren't out of bounds
    test("within bounds for max up to 100", () => {
        for (let i = 1; i < 100; i++) {
            const result = helpers.getNumericChoice(i);
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThanOrEqual(i);
        }
    });
});

describe("helpers.getBoolChoice", () => {
    test("returns true on 1", () => {
        expect(helpers.getBoolChoice(1)).toBe(true);
    });

    test("returns false on 0", () => {
        expect(helpers.getBoolChoice(0)).toBe(false);
    });
    test("throws errors on > 1", () => {
        expect(() => helpers.getBoolChoice(1.1)).toThrowError();
    });
});

describe("helpers.getPanPostions", () => {
    test("1 loop", () => {
        expect(helpers.getPanPositions(1)).toStrictEqual([0]);
    });
    test("2 loops", () => {
        expect(helpers.getPanPositions(2)).toStrictEqual([-1, 1]);
    });
    test("3 loops", () => {
        expect(helpers.getPanPositions(3)).toStrictEqual([-1, 0, 1]);
    });
    test("4 loops", () => {
        expect(helpers.getPanPositions(4)).toStrictEqual([-1, -0.3333, 0.3334, 1]);
    });
    test("5 loops", () => {
        expect(helpers.getPanPositions(5)).toStrictEqual([-1, -0.5, 0, 0.5, 1]);
    });
    test("6 loops", () => {
        expect(helpers.getPanPositions(6)).toStrictEqual([-1, -0.6, -0.2, 0.2, 0.6, 1]);
    });
});
