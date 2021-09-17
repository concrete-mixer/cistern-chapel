import * as Tone from "tone";
import { compileFiles } from "./helpers";
import { LoopManager } from "./classes";

let lm: LoopManager;

export const start = async (): Promise<void> => {
    // Need this to determine what audio files we can use
    await compileFiles();

    // TODO: for now, make this a single iteration
    // - Create looper
    // - Set up interface for generating one-shot sounds arbitrarily
    Tone.start();

    // Create loop
    if (!lm) {
        lm = new LoopManager();
    } else {
        lm.respawn();
    }

    Tone.Transport.start();
};

export const stop = (): void => {
    Tone.Transport.stop();
};
