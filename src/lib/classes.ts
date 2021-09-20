import { defaultFade } from "./constants";
import {
    getBoolChoice,
    getLoops,
    getNumericChoice,
    getOneShots,
    getPanPositions,
    getSinglePanPosition,
} from "./helpers";
import * as Tone from "tone";
import { PlayerOptions, ToneAudioNode } from "tone/build/esm";
import * as _ from "lodash";

const effectsChoices = [Tone.PingPongDelay];

export class EffectsChain {
    connectNode: ToneAudioNode;

    constructor(node: ToneAudioNode) {
        const choice = effectsChoices[getNumericChoice(effectsChoices.length)];
        this.connectNode = new choice({ delayTime: "4n", wet: 0.2, feedback: 0.2 }).toDestination();
        node.connect(this.connectNode);
    }
}

export class CCPlayer {
    config: Partial<PlayerOptions> = {
        autostart: true,
        loop: false,
        playbackRate: 1,
        reverse: false,
        volume: -6, // Keep it fairly quiet
    };
    player: Tone.Player;
    chain: EffectsChain;
    panPosition: number;

    constructor(config: Partial<PlayerOptions>, panPosition: number) {
        this.setConfig(config);

        console.log(`Playing ${config.url}`, this.config);
        this.player = new Tone.Player(this.config);
        this.player.sync();
        console.log("panPos", panPosition);
        this.panPosition = panPosition;
        this.connect(new Tone.Panner(panPosition).toDestination());
    }

    setConfig(newConfig: Partial<PlayerOptions>): void {
        this.config = { ...this.config, ...newConfig };
    }

    connect(node: ToneAudioNode): void {
        this.player.connect(node);
    }

    start(): void {
        this.player.start();
    }

    stop(): void {
        this.player.stop();
    }

    dispose(): void {
        console.log("CALLED");
        this.player.dispose();
    }
}

export class Loop extends CCPlayer {
    constructor(url: string, panPosition: number) {
        super(
            {
                url,
                loop: true,
                reverse: getBoolChoice(0.25),
                fadeIn: defaultFade,
                fadeOut: defaultFade,
                volume: -9,
            },
            panPosition,
        );
    }
}

export class OneShot extends CCPlayer {
    constructor(url: string) {
        super({ url }, getSinglePanPosition());
    }
}

interface OneShotPlayers {
    [key: string]: OneShot;
}

export class CCManager {
    loopsCount = 2;
    loops: Loop[] = [];
    panPositions = getPanPositions(this.loopsCount);
    oneShotPaths = getOneShots();
    loopPaths = getLoops();
    oneShotsConcrete: OneShotPlayers = {};
    oneShotsInstrumental: OneShotPlayers = {};
    stopPressed = false;

    constructor() {
        this.initialiseLoops();
        Tone.Transport.scheduleRepeat((time) => this.loopChoice(), 20, 20);
        // Tone.Transport.scheduleRepeat((time) => {
        //     this.oneShotChoice(this.oneShotsConcrete, this.oneShotPaths.concrete);
        // }, "1n");
        // Tone.Transport.scheduleRepeat((time) => {
        //     this.oneShotChoice(this.oneShotsInstrumental, this.oneShotPaths.instrumental);
        // }, 4); // Offset instrumentals from concrete samples
    }

    initialiseLoops(): void {
        this.loopPaths = _.shuffle(getLoops());
        // Get list of loop files. These are shuffled so we can use i below to choose the file to use
        // for each loop knowing the choices are random

        // Need to assign different files
        for (let i = 0; i < this.loopsCount; i++) {
            this.loops.push(new Loop(this.loopPaths[i], this.panPositions[i]));
        }
    }

    loopChoice(): void {
        const changeLoop = getBoolChoice(0.5);
        console.log("loopChoice() called, changeLoop is:", changeLoop, this.loops.length);
        if (!this.stopPressed && changeLoop) {
            // Play a new loop file
            const loopToRemove = this.loops.shift();
            loopToRemove.stop();

            // Dispose after fadeout time
            Tone.Transport.scheduleOnce(() => loopToRemove.dispose(), defaultFade);
            const path = _.shuffle(this.loopPaths)[0];

            console.log("Changing loop", path);
            this.loops.push(new Loop(path, loopToRemove.panPosition));
        }
    }

    oneShotChoice(collection: OneShotPlayers, paths: string[]): void {
        if (!this.stopPressed && getBoolChoice(0.25)) {
            const path = _.shuffle(paths)[0];

            if (!(path in collection)) {
                collection[path] = new OneShot(path);
                // Will autoplay once initiated
            } else {
                // Play again
                collection[path].start();
            }
        }
    }

    dispose(): void {
        console.log("Disposing");
        this.stopPressed = true;
        this.loops.forEach((loop) => loop.dispose());

        // Tidy up all the oneShots we've got happening
        [this.oneShotsConcrete, this.oneShotsInstrumental].forEach((collection: OneShotPlayers) => {
            Object.keys(collection).forEach((path) => collection[path].dispose());
        });
        this.reset();
    }

    reset(): void {
        this.loops = [];
        this.oneShotsConcrete = {};
        this.oneShotsInstrumental = {};
        this.stopPressed = false;
        console.log("Reset", this.loops, this.oneShotsConcrete, this.oneShotsInstrumental, this.stopPressed);
    }

    respawn(): void {
        // We've played, then we've stopped, now we're playing again. First dispose of pre-existing loops then recompile loops
        this.dispose();
        this.initialiseLoops();
    }
}
