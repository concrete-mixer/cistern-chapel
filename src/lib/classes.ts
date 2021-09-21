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

export class Effect {
    connectNode: ToneAudioNode;

    constructor(effect: ToneAudioNode, node: ToneAudioNode) {
        this.connectNode = effect;
        node.connect(this.connectNode);
    }

    dispose(): void {
        this.connectNode.dispose();
    }
}

export class PingPongDelay extends Effect {
    constructor(node: ToneAudioNode) {
        // We add 1 because numeric choice can be 0
        const delayLength = getNumericChoice(5) + 1;
        const delayString = `0:0:${delayLength}`;
        console.log(delayString);
        super(new Tone.PingPongDelay({ delayTime: delayString, wet: 0.2, feedback: 0.2 }).toDestination(), node);
    }
}

export class FilterDelay extends Effect {
    constructor(node: ToneAudioNode) {
        // We add 1 because numeric choice can be 0
        const delayLength = getNumericChoice(5) + 1;
        const delay = new Tone.Delay(delayLength, 0.5).toDestination();
        const filterFreq = _.random(200, 600, true);
        const autoFilter = new Tone.AutoWah(filterFreq, 3, -20).connect(delay);
        super(autoFilter, node);
    }
}

export class Reverb extends Effect {
    constructor(node: ToneAudioNode) {
        const reverb = new Tone.Freeverb(
            _.random(0.001, 1, true), // Room size 0 - 1
            _.random(200, 4000, true), // Dampening frequency, 0hz - 99khz
        ).toDestination();
        super(reverb, node);
    }
}

export class CCPlayer {
    config: Partial<PlayerOptions> = {
        autostart: true,
        loop: false,
        playbackRate: 1,
        reverse: false,
        volume: -6, // Keep it fairly quiet
        fadeIn: 0.25,
        fadeOut: 0.5,
    };
    player: Tone.Player;
    panPosition: number;
    panner: Tone.Panner;
    effect: Effect;

    constructor(config: Partial<PlayerOptions>, panPosition: number) {
        this.setConfig(config);

        this.player = new Tone.Player(this.config);
        this.player.sync();
        this.panPosition = panPosition;
        this.panner = new Tone.Panner(panPosition);
        this.connect(this.panner);
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
        this.effect.dispose();
        this.panner.dispose();
        this.player.dispose();
    }
}

export class Loop extends CCPlayer {
    constructor(url: string, panPosition: number) {
        super(
            {
                url,
                loop: true,
                reverse: getBoolChoice(0.125),
                fadeIn: defaultFade,
                fadeOut: defaultFade,
                volume: -12,
            },
            panPosition,
        );
        const choice = getNumericChoice(2);

        switch (choice) {
            case 0:
                this.effect = new PingPongDelay(this.panner);
                break;
            case 1:
                this.effect = new FilterDelay(this.panner);
                break;
            default:
                console.log("Hmm, shouldn't get here?");
        }
    }
}

export class OneShot extends CCPlayer {
    constructor(url: string) {
        super({ url }, getSinglePanPosition());
        const choice = getNumericChoice(3);

        switch (choice) {
            case 0:
                this.effect = new PingPongDelay(this.panner);
                break;
            case 1:
                this.effect = new FilterDelay(this.panner);
                break;
            case 2:
                this.effect = new Reverb(this.panner);
                break;
            default:
                console.log("Hmm, shouldn't get here?");
        }
    }
}

class Manager {
    stopPressed = false;
}

export class LoopManager extends Manager {
    loopsCount = 2;
    loops: Loop[] = [];
    loopPaths = getLoops();
    panPositions = getPanPositions(this.loopsCount);

    constructor() {
        super();
        this.initialise();
    }

    initialise(): void {
        this.loopPaths = _.shuffle(getLoops());
        // Get list of loop files. These are shuffled so we can use i below to choose the file to use
        // for each loop knowing the choices are random

        // Need to assign different files
        for (let i = 0; i < this.loopsCount; i++) {
            this.loops.push(new Loop(this.loopPaths[i], this.panPositions[i]));
        }
        Tone.Transport.scheduleRepeat((time) => this.loopChoice(), 20, 20);
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

    dispose(): void {
        this.stopPressed = true;
        this.loops = [];
        this.reset();
    }

    reset(): void {
        this.loops.forEach((loop) => loop.dispose());
        this.stopPressed = false;
    }
}

interface OneShotPlayers {
    [key: string]: OneShot;
}

export class OneShotManager extends Manager {
    oneShotPaths = getOneShots();
    oneShotsConcrete: OneShotPlayers = {};
    oneShotsInstrumental: OneShotPlayers = {};

    constructor() {
        super();
        this.initialise();
    }

    initialise(): void {
        Tone.Transport.scheduleOnce(() => {
            Tone.Transport.scheduleRepeat(() => {
                this.oneShotChoice(this.oneShotsConcrete, this.oneShotPaths.concrete);
            }, "1n");
            Tone.Transport.scheduleRepeat(() => {
                this.oneShotChoice(this.oneShotsInstrumental, this.oneShotPaths.instrumental);
            }, 2); // Offset instrumentals from concrete samples
        }, 10);
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

        // Tidy up all the oneShots we've got happening
        [this.oneShotsConcrete, this.oneShotsInstrumental].forEach((collection: OneShotPlayers) => {
            Object.keys(collection).forEach((path) => collection[path].dispose());
        });
        this.reset();
    }

    reset(): void {
        this.oneShotsConcrete = {};
        this.oneShotsInstrumental = {};
        this.stopPressed = false;
        console.log("Reset", this.oneShotsConcrete, this.oneShotsInstrumental, this.stopPressed);
    }
}

export class CCManager {
    loopManager: LoopManager;
    oneShotManager: OneShotManager;

    constructor() {
        this.loopManager = new LoopManager();
        this.oneShotManager = new OneShotManager();
    }

    start(): void {
        // We've played, then we've stopped, now we're playing again. First dispose of pre-existing loops then recompile loops
        this.loopManager.initialise();
        this.oneShotManager.initialise();
    }

    stop(): void {
        this.loopManager.dispose();
        this.oneShotManager.dispose();
    }
}
