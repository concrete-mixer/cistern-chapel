import * as Tone from "tone";
import { compileBuffers, areWeReady } from "./helpers";
import { CCManager } from "./classes";

let ccm: CCManager;

export const start = async (): Promise<void> => {
    // Need this to determine what audio files we can use
    if (!areWeReady()) {
        compileBuffers();
    }

    const refreshId = setInterval(() => {
        if (areWeReady()) {
            clearInterval(refreshId);

            console.log("Starting Tone");

            Tone.start();

            // Create loop
            if (!ccm) {
                ccm = new CCManager();
            } else {
                ccm.start();
            }
            Tone.Transport.bpm.value = 90;
            Tone.Transport.start();
        }
    }, 50);
};

export const stop = (): void => {
    ccm.stop();
    Tone.Transport.stop();
};
