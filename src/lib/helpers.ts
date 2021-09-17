import { IPackageJson } from "package-json-type";
import { OneShot, Loops } from "./types";
import * as _ from "lodash";
import { Decimal } from "decimal.js-light";

Decimal.set({ rounding: 2 });

export const getNumericChoice = (max: number): number => {
    return Math.floor(Math.random() * max);
};

export const getBoolChoice = (frequency: number): boolean => {
    // Frequency is how often we want the function to return true. For example if we want
    // the function to return true a quarter of the time we'd specify frequency 0.25
    // To get the required probablity the frequency gets inverted and multiplied by the random value
    // After flooring, a zero is considered true and any other integer value is false.
    if (frequency === 0) {
        // There's no sensible use case for always returning false, but the logic below supports always true, so to be consistent...
        return false;
    }

    const choice = Math.floor(Math.random() * (1 / frequency));
    return choice === 0 ? true : false;
};

export const getPanPositions = (loopsCount: number): number[] => {
    // The idea is to return appropriate pan positions for the number of loops we're using
    // The range is between -1 (hard left) and 1 (hard right).
    // We're not going to want more than 4 loops concurrently without overloading the mix so return
    // up to four
    if (loopsCount === 1) {
        // If only one loop, make its pan position center (0)
        return [0];
    }

    const increment = new Decimal(2 / (loopsCount - 1));
    const panPositions: number[] = [];
    let cursor = new Decimal(-1);

    for (let i = 0; i < loopsCount; i++) {
        panPositions.push(cursor.toDecimalPlaces(4).toNumber());
        cursor = cursor.plus(increment);
    }

    return panPositions;
};

// Declare our loops and oneShot structures here so we can return if we can cache them
const loops: Loops = [];
const oneShot: OneShot = {
    instrumental: [],
    concrete: [],
};

export const getLoops = (): Loops => {
    if (loops.length === 0) {
        throw Error("No loop files available");
    }

    // Return shuffled list of files to make selecting files to use easier
    return _.shuffle(loops);
};

export const compileFiles = async (): Promise<void> => {
    // Build a list of audio files structured for random selection
    let manifest: IPackageJson;

    await fetch("./manifest.json")
        .then((response) => response.json())
        .then((obj) => (manifest = obj));

    const files = Object.keys(manifest);

    for (const f of files) {
        if (f.match(/^audio\/*/)) {
            if (f.match(/^audio\/loops/)) {
                loops.push(f);
            } else if (f.match(/^audio\/oneshot\/instrumental/)) {
                oneShot.instrumental.push(f);
            } else if (f.match(/^audio\/oneshot\/concrete/)) {
                oneShot.concrete.push(f);
            } else {
                console.log(`Unexpected file ${f}`);
            }
        }
    }
};