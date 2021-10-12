import { AutoFilterOptions, FilterOptions, ToneAudioNode } from "tone/build/esm";
import random from "lodash.random";
import * as Tone from "tone";
import { getBoolChoice, getNumericChoice, getPanPositions } from "../helpers";

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

const getAutoFilterOptions = (): Partial<AutoFilterOptions> => {
    const filterType = getFilterType();

    // Generate config for the Tone.Autofilter effect
    return {
        baseFrequency: getBaseFrequency(filterType),
        octaves: getOctaves(filterType),
        wet: 1,
        frequency: random(0.02, 0.07, true),
        filter: {
            type: filterType,
            Q: random(6, 12), // This seems interesting without being OTT
            rolloff: -12,
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
        const useLFO = getBoolChoice(0.5);

        if (useLFO) {
            const autoFilterOptions = getAutoFilterOptions();
            // TODO: remove debug
            console.log("autofilter", autoFilterOptions);
            const autoFilter = new Tone.AutoFilter(autoFilterOptions).connect(delay);
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

export class DoubleDelay extends Effect {
    delay1: Tone.FeedbackDelay;
    delay2: Tone.FeedbackDelay;
    pan1: Tone.Panner;
    pan2: Tone.Panner;

    constructor() {
        const gain = new Tone.Gain();

        // Pass super a gain, meaning we have control over delays and their pan positions
        super(gain);

        // Create delay1
        const delay1Conf = {
            delayTime: random(0.06, 0.2, true),
            feedback: 0,
            wet: random(0.3, 0.6, true),
        };
        this.delay1 = new Tone.FeedbackDelay(delay1Conf);
        gain.connect(this.delay1);

        const delay2Conf = {
            delayTime: random(0.2, 0.6, true),
            feedback: random(0.2, 0.6, true),
            wet: random(0.2, 0.4, true),
        };
        this.delay2 = new Tone.FeedbackDelay(delay2Conf);

        this.pan1 = new Tone.Panner();
        this.pan2 = new Tone.Panner();
        const panPositions = getPanPositions(2);

        // This bit varies pan positions
        if (getBoolChoice(0.5)) {
            this.pan1.set({ pan: panPositions[0] });
            this.pan2.set({ pan: panPositions[1] });
        } else {
            this.pan1.set({ pan: panPositions[1] });
            this.pan2.set({ pan: panPositions[0] });
        }

        // Create delay2
        console.log(
            "Double delay",
            { ...delay1Conf, pan: this.pan1.pan.value },
            { ...delay2Conf, pan: this.pan2.pan.value },
        );
        this.delay1.connect(this.delay2);
    }

    dispose(): void {
        this.connectNode.dispose();
        this.delay1.dispose();
        this.delay2.dispose();
        this.pan1.dispose();
        this.pan2.dispose();
    }

    connect(): void {
        this.delay1.connect(this.pan1);
        this.delay2.connect(this.pan2);
        this.pan1.toDestination();
        this.pan2.toDestination();
    }
}

export class RandDelay extends Effect {
    constructor() {
        const maxDelay = random(0.1, 1);
        // We add 1 because numeric choice can be 0
        const delay = new Tone.PingPongDelay({
            delayTime: random(0.1, 1, true),
            wet: random(0.2, 0.4, true),
            feedback: random(0.2, 0.4, true),
            maxDelay: maxDelay,
        });
        super(delay);

        // Randomly change the delayTime. Ideally we'd do this with a Tone.LFO connected to delay time, but delay
        Tone.Transport.scheduleRepeat((time) => {
            delay.set({ delayTime: random(0.1, maxDelay) });
        }, maxDelay);
    }
}
