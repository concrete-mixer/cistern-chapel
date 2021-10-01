import { ToneAudioNode } from "tone/build/esm";
import random from "lodash.random";
import * as Tone from "tone";
import { getBoolChoice } from "../helpers";

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
            const config = {
                baseFrequency: random(400, 800, true),
                octaves: random(1, 3),
                wet: 1,
                frequency: random(0.025, 0.1, true),
            };
            console.log("autofilter", config);
            const autoFilter = new Tone.AutoFilter(config).connect(delay).start();
            autoFilter.filter.set({
                type: "lowpass", // This is default; TODO try out HPF and BPF (need to alter baseFrequency in tandom; maybe class this)
                Q: random(6, 12), // This seems interesting without being OTT
            });
            super(autoFilter);
        } else {
            // Fixed filter
            const config = {
                Q: 0, // Since we might randomly define frequency at a resonant point in sample, let's not risk distortion
                frequency: random(400, 800, true),
                gain: 0.8, // be careful about resonance at filter point, don't frighten the horses
            };
            const filter = new Tone.Filter(config);
            super(filter);
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
