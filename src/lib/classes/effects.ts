import { AutoFilterOptions, FilterOptions, ToneAudioNode } from "tone/build/esm";
import random from "lodash.random";
import * as Tone from "tone";
import { getBoolChoice, getNumericChoice } from "../helpers";

export class Effect {
    connectNode: ToneAudioNode;

    constructor(effect: ToneAudioNode) {
        this.connectNode = effect;
    }

    dispose(): void {
        this.connectNode.dispose();
    }

    connect(): void {
        this.connectNode.toDestination();
    }
}

export class PingPongDelay extends Effect {
    constructor() {
        // We add 1 because numeric choice can be 0
        const delayTime = random(0.4, 1, true);
        const pingPongDelay = new Tone.PingPongDelay({
            delayTime,
            wet: random(0.2, 0.4, true),
            feedback: random(0.2, 0.4, true),
        });
        super(pingPongDelay);
    }
}

// This is convoluted because we need to randomly generate options for AutoFilter and options for the AutoFilter's Filter
interface GetAutoFilterConfig {
    autoFilterOptions: Partial<AutoFilterOptions>;
    filterOptions: Partial<FilterOptions>;
}

const getFilterType = (): FilterOptions["type"] => {
    const choice = getNumericChoice(3);

    switch (choice) {
        case 0:
            return "lowpass";
        case 1:
            return "bandpass";
        case 2:
            return "highpass";
        default:
            throw new Error("Invalid choice");
    }
};

const getBaseFrequency = (filterType: FilterOptions["type"]): number => {
    // Used by AutoFilter
    switch (filterType) {
        case "lowpass":
            return random(400, 1600, true);
        case "bandpass":
            return random(200, 4000, true);
        case "highpass":
            return random(200, 2000, true);
        default:
            throw new Error("Invalid choice");
    }
};

const getFrequency = (filterType: FilterOptions["type"]): number => {
    // Used by Filter
    switch (filterType) {
        case "lowpass":
            return random(400, 1600, true);
        case "bandpass":
            return random(800, 2000, true);
        case "highpass":
            return random(200, 2000, true);
        default:
            throw new Error("Invalid choice");
    }
};

const getOctaves = (filterType: FilterOptions["type"]): number => {
    switch (filterType) {
        case "lowpass":
            return random(1, 4);
        case "bandpass":
            return random(2, 4);
        case "highpass":
            return random(1, 4);
        default:
            throw new Error("Invalid choice");
    }
};

const getAutoFilterOptions = (): GetAutoFilterConfig => {
    const filterType = getFilterType();

    // Generate config for the Tone.Autofilter effect
    return {
        autoFilterOptions: {
            baseFrequency: getBaseFrequency(filterType),
            octaves: getOctaves(filterType),
            wet: 1,
            frequency: random(0.02, 0.07, true),
        },
        filterOptions: {
            type: filterType,
            Q: random(6, 12), // This seems interesting without being OTT
        },
    };
};

const getFilterOptions = (): Partial<FilterOptions> => {
    // Generate config for the Tone.Filter effect
    const filterType = getFilterType();
    return {
        type: filterType,
        Q: 0, // Since we might randomly define frequency at a resonant point in sample, let's not risk distortion
        frequency: getFrequency(filterType),
        gain: 0.8, // be careful about resonance at filter point, don't frighten the horses
    };
};

export class FilterDelay extends Effect {
    delay: Tone.FeedbackDelay;

    constructor() {
        // We add 1 because numeric choice can be 0
        const delayTime = random(0.01, 1, true);
        const delay = new Tone.FeedbackDelay({ delayTime, feedback: random(0.2, 0.6, true) });

        // Determine filter type: fixed vs LFO variable
        // 50/50 chance
        let useLFO = getBoolChoice(0.5);
        useLFO = true;

        if (useLFO) {
            const { autoFilterOptions, filterOptions } = getAutoFilterOptions();
            // TODO: remove debug
            console.log("autofilter", autoFilterOptions);
            const autoFilter = new Tone.AutoFilter(autoFilterOptions).connect(delay);
            autoFilter.filter.set(filterOptions);
            autoFilter.start();
            super(autoFilter);
        } else {
            // Fixed filter
            const config = getFilterOptions();
            const filter = new Tone.Filter(config).connect(delay);
            super(filter);
            // TODO: remove debug
            console.log("filter", config);
        }
        this.delay = delay;
    }

    dispose(): void {
        this.connectNode.dispose();
        this.delay.dispose();
    }

    connect(): void {
        this.delay.toDestination();
    }
}

export class PitchShift extends Effect {
    constructor() {
        const shiftAmount = random(-12, 12);
        super(new Tone.PitchShift(shiftAmount));
    }
}

export class Reverb extends Effect {
    constructor() {
        const reverb = new Tone.Freeverb(
            random(0.01, 1, true), // Room size 0 - 1
            random(200, 4000, true), // Dampening frequency, 0hz - 99khz
        );
        super(reverb);
    }
}
