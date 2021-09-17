import { defaultFade } from "./constants";
import { getBoolChoice, getLoops, getNumericChoice, getPanPositions } from "./helpers";
import * as Tone from "tone";
import { PlayerOptions, ToneAudioNode } from "tone/build/esm";

const effectsChoices = [Tone.PingPongDelay];

export class EffectsChain {
    connectNode: ToneAudioNode;

    constructor(node: ToneAudioNode) {
        const choice = effectsChoices[getNumericChoice(effectsChoices.length)];
        this.connectNode = new choice({ delayTime: "4n", wet: 0.2, feedback: 0.2 }).toDestination();
        node.connect(this.connectNode);
    }
}

export class Loop {
    config: Partial<PlayerOptions> = {
        autostart: true,
        loop: true,
        fadeIn: defaultFade,
        fadeOut: defaultFade,
        playbackRate: 1,
        reverse: getBoolChoice(0.25),
        volume: -6, // Keep it fairly quiet
    };
    player: Tone.Player;
    chain: EffectsChain;

    constructor(url: string, panPosition: number) {
        console.log(`Playing ${url}`);
        this.setConfig({ url });

        this.player = new Tone.Player(this.config);
        this.player.sync();
        console.log("panPos", panPosition);
        this.connect(new Tone.Panner(panPosition).toDestination());
    }

    setConfig(config: Partial<PlayerOptions>): void {
        this.config = { ...this.config, ...config };
    }

    connect(node: ToneAudioNode): void {
        this.player.connect(node);
    }

    dispose(): void {
        this.player.dispose();
    }
}

export class LoopManager {
    loopsCount = 2;
    loops: Loop[] = [];
    panPositions = getPanPositions(this.loopsCount);

    constructor() {
        this.compileLoops();
    }

    compileLoops(): void {
        // Get list of loop files. These are shuffled so we can use i below to choose the file to use
        // for each loop knowing the choices are random
        const loopFiles = getLoops();

        // Need to assign different files
        for (let i = 0; i < this.loopsCount; i++) {
            this.loops.push(new Loop(loopFiles[i], this.panPositions[i]));
        }
    }

    dispose(): void {
        this.loops.forEach((loop) => loop.dispose());
        this.loops = [];
    }

    respawn(): void {
        // We've played, then we've stopped, now we're playing again. First dispose of pre-existing loops then recompile loops
        this.dispose();
        this.compileLoops();
    }
}
