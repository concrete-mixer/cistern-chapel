import * as Tone from "tone";
import { compileFiles } from "./helpers";
import { CCManager } from "./classes";

let ccm: CCManager;

export const start = async (): Promise<void> => {
    // Need this to determine what audio files we can use
    await compileFiles();

    // TODO: for now, make this a single iteration
    // - Create looper
    // - Set up interface for generating one-shot sounds arbitrarily
    Tone.start();

    // Create loop
    if (!ccm) {
        ccm = new CCManager();
    } else {
        ccm.respawn();
    }
    Tone.Transport.bpm.value = 90;
    Tone.Transport.start();
};

export const stop = (): void => {
    Tone.Transport.stop();
};
