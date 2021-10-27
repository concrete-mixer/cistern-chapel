import shuffle from "lodash.shuffle";
import { IPackageJson } from "package-json-type";
import { Decimal } from "decimal.js-light";
import * as Tone from "tone";
import { ToneAudioBuffersUrlMap } from "tone/build/esm/core/context/ToneAudioBuffers";

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
    if (frequency > 1) {
        throw new Error("frequency must be value between 0 and 1");
    }

    const choice = Math.floor(Math.random() * (1 / frequency));
    return choice === 0 ? true : false;
};

export const getPanPositions = (positionsCount: number): number[] => {
    // The idea is to return appropriate pan positions for the number of loops we're using
    // The range is between -1 (hard left) and 1 (hard right).
    // We're not going to want more than 4 loops concurrently without overloading the mix so return
    // up to four
    if (positionsCount === 1) {
        // If only one loop, make its pan position center (0)
        return [0];
    }

    const increment = new Decimal(1.5 / (positionsCount - 1));
    const panPositions: number[] = [];
    let cursor = new Decimal(-0.75);

    for (let i = 0; i < positionsCount; i++) {
        panPositions.push(cursor.toDecimalPlaces(4).toNumber());
        cursor = cursor.plus(increment);
    }

    return panPositions;
};

export const getSinglePanPosition = (): number => {
    return shuffle([-1, 0.5, 0, 0.5, 1])[0];
};

let loopBuffers: Tone.ToneAudioBuffers;
let concreteBuffers: Tone.ToneAudioBuffers;
let instrumentalBuffers: Tone.ToneAudioBuffers;

const loopMap: ToneAudioBuffersUrlMap = {};
const concreteMap: ToneAudioBuffersUrlMap = {};
const instrumentalMap: ToneAudioBuffersUrlMap = {};

let loopBuffersReady = false;
let concreteBuffersReady = false;
let instrumentalBuffersReady = false;

export const areWeReady = (): boolean => {
    return loopBuffersReady && concreteBuffersReady && instrumentalBuffersReady;
};

interface BuffersAndMaps {
    loopBuffers: Tone.ToneAudioBuffers;
    loopMap: ToneAudioBuffersUrlMap;
    concreteBuffers: Tone.ToneAudioBuffers;
    concreteMap: ToneAudioBuffersUrlMap;
    instrumentalBuffers: Tone.ToneAudioBuffers;
    instrumentalMap: ToneAudioBuffersUrlMap;
}

export const getBufferMapData = (): BuffersAndMaps => {
    return {
        loopBuffers,
        loopMap,
        concreteBuffers,
        concreteMap,
        instrumentalBuffers,
        instrumentalMap,
    };
};

export const compileBuffers = async (): Promise<void> => {
    // Build a list of audio files structured for random selection
    let manifest: IPackageJson;

    await fetch("./manifest.json")
        .then((response) => response.json())
        .then((obj) => (manifest = obj));

    const files = Object.keys(manifest);

    for (const f of files) {
        if (f.match(/^audio\/*/)) {
            if (f.match(/^audio\/loops/)) {
                loopMap[f] = f;
            } else if (f.match(/^audio\/oneshot\/instrumental/)) {
                instrumentalMap[f] = f;
            } else if (f.match(/^audio\/oneshot\/concrete/)) {
                concreteMap[f] = f;
            } else {
                console.log(`Unexpected file ${f}`);
            }
        }
    }

    loopBuffers = new Tone.ToneAudioBuffers({
        urls: loopMap,
        onload: () => {
            console.log("loaded loop buffers");
            loopBuffersReady = true;
        },
    });
    instrumentalBuffers = new Tone.ToneAudioBuffers({
        urls: instrumentalMap,
        onload: () => {
            console.log("loaded instrumental buffers");
            instrumentalBuffersReady = true;
        },
    });
    concreteBuffers = new Tone.ToneAudioBuffers({
        urls: concreteMap,
        onload: () => {
            console.log("loaded concrete buffers");
            concreteBuffersReady = true;
        },
    });
};
