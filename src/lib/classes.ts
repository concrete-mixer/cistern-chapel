import { defaultFade } from "./constants";
import {
    getBoolChoice,
    getLoopData,
    getOneShotData,
    getNumericChoice,
    getPanPositions,
    getSinglePanPosition,
} from "./helpers";
import * as Tone from "tone";
import { PlayerOptions, ToneAudioNode } from "tone/build/esm";
import * as _ from "lodash";
import { ToneAudioBuffersUrlMap } from "tone/build/esm/core/context/ToneAudioBuffers";

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
        const delayTime = _.random(0.01, 1);
        const pingPongDelay = new Tone.PingPongDelay({ delayTime, wet: 0.2, feedback: 0.2 });
        super(pingPongDelay);
    }
}

export class FilterDelay extends Effect {
    delay: Tone.FeedbackDelay;
    constructor() {
        // We add 1 because numeric choice can be 0
        const delayTime = _.random(0.01, 1);
        const delay = new Tone.FeedbackDelay({ delayTime, feedback: _.random(0.2, 0.6) });
        const filterFreq = _.random(100, 400, true);
        const autoFilter = new Tone.AutoWah(filterFreq, 3).connect(delay);
        super(autoFilter);
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

export class Reverb extends Effect {
    constructor(node: ToneAudioNode) {
        const reverb = new Tone.Freeverb(
            _.random(0.001, 1, true), // Room size 0 - 1
            _.random(200, 4000, true), // Dampening frequency, 0hz - 99khz
        );
        super(reverb);
    }
}

export class CCPlayer {
    config: Partial<PlayerOptions> = {
        autostart: false,
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

    constructor(config?: Partial<PlayerOptions>) {
        this.setConfig(config);

        this.player = new Tone.Player(this.config);
        this.player.sync();
    }

    setConfig(newConfig: Partial<PlayerOptions>): void {
        this.config = { ...this.config, ...newConfig };
    }

    playNew(buffer: Tone.ToneAudioBuffer, effect: Effect, panPosition: number): void {
        console.log("hunk");
        this.player.buffer = buffer;
        this.effect.dispose();
        this.panner.dispose();
        this.effect = effect;

        this.panner = new Tone.Panner(panPosition);
        this.effect.connect();
        this.panner.connect(this.effect.connectNode);
        this.player.connect(this.panner);
        this.player.start();
    }

    dispose(): void {
        this.effect.dispose();
        this.panner.dispose();
        this.player.dispose();
    }
}

export class Loop extends CCPlayer {
    panPosition: number;

    constructor(panPosition: number) {
        super({
            loop: true,
            fadeIn: defaultFade,
            fadeOut: defaultFade,
            volume: -12,
        });
        this.panner = new Tone.Panner(panPosition);
    }

    play(buffer: Tone.ToneAudioBuffer, effect: Effect): void {
        this.player.buffer = buffer;

        if (this.effect) {
            this.effect.dispose();
        }
        this.effect = effect;
        console.log("connecting");
        // Connect components together
        this.player.connect(this.panner);
        this.panner.connect(this.effect.connectNode);
        this.effect.connect();

        this.player.start();
    }

    playNew(buffer: Tone.ToneAudioBuffer, effect: Effect): void {
        this.player.stop();
        // Tone.Transport.scheduleOnce((time) => {
        //     console.log("yoohoo");
        //     this.play(buffer, effect, panPosition);
        // }, defaultFade);

        // TODO: Tone.Transport.scheduleOnce() isn't getting called (may be an issue with defaultFade value?)
        // Using setTimeout() for now
        setTimeout(() => this.play(buffer, effect), defaultFade * 1001);
    }
}

export class OneShot extends CCPlayer {
    constructor() {
        super();
    }
}

class Manager {
    stopPressed = false;
}

export class LoopManager extends Manager {
    loopsCount = 2;
    loopBuffers: Tone.ToneAudioBuffers;
    loopMap: ToneAudioBuffersUrlMap;
    panPositions = getPanPositions(this.loopsCount);
    loops: Loop[] = [new Loop(this.panPositions[0]), new Loop(this.panPositions[1])];

    constructor() {
        super();
        const { loopBuffers, loopMap } = getLoopData();
        this.loopBuffers = loopBuffers;
        this.loopMap = loopMap;
        this.initialise();
    }

    initialise(): void {
        const { loopBuffers, loopMap } = getLoopData();
        this.loopBuffers = loopBuffers;
        this.loopMap = loopMap;
        const keys = _.shuffle(Object.keys(this.loopMap));

        // Need to assign different files
        for (let i = 0; i < this.loops.length; i++) {
            console.log("Playing", keys[i]);
            this.loops[i].play(loopBuffers.get(keys[i]), this.getEffect());
        }
        Tone.Transport.scheduleRepeat((time) => this.loopChoice(), 20, 20);
    }

    getEffect(): Effect {
        const choice = getNumericChoice(2);

        switch (choice) {
            case 0:
                return new PingPongDelay();
            case 1:
                return new FilterDelay();
            default:
                console.log("Hmm, shouldn't get here?");
        }
    }

    loopChoice(): void {
        const changeLoop = getBoolChoice(0.5);
        if (!this.stopPressed && changeLoop) {
            // Play a new loop file
            console.log("before", this.loops);
            const loop = this.loops.shift();
            const keyToPlay = _.shuffle(Object.keys(this.loopMap))[0];

            loop.playNew(this.loopBuffers.get(keyToPlay), this.getEffect());
            this.loops.push(loop);
            // Dispose after fadeout time
            console.log("Changing loop", keyToPlay);
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

export class OneShotManager extends Manager {
    instrumentalBuffers: Tone.ToneAudioBuffers;
    instrumentalMap: ToneAudioBuffersUrlMap;
    concreteBuffers: Tone.ToneAudioBuffers;
    concreteMap: ToneAudioBuffersUrlMap;
    freePlayers: OneShot[];
    activePlayers: OneShot[];

    constructor() {
        super();
        const { concreteBuffers, concreteMap, instrumentalBuffers, instrumentalMap } = getOneShotData();
        this.concreteBuffers = concreteBuffers;
        this.concreteMap = concreteMap;
        this.instrumentalBuffers = instrumentalBuffers;
        this.instrumentalMap = instrumentalMap;
        this.initialise();
    }

    initialise(): void {
        this.freePlayers = [new OneShot(), new OneShot()];
        Tone.Transport.scheduleOnce(() => {
            Tone.Transport.scheduleRepeat(() => {
                this.oneShotChoice(this.concreteBuffers, this.concreteMap);
            }, "1n");
            Tone.Transport.scheduleRepeat(() => {
                this.oneShotChoice(this.instrumentalBuffers, this.instrumentalMap);
            }, 2); // Offset instrumentals from concrete samples
        }, 10);
    }

    oneShotChoice(buffers: Tone.ToneAudioBuffers, map: ToneAudioBuffersUrlMap): void {
        if (!this.stopPressed && getBoolChoice(0.25) && this.freePlayers.length > 0) {
            const key = _.shuffle(Object.keys(map))[0];
            const oneShot = this.freePlayers.pop();
            this.activePlayers.push(oneShot);
            oneShot.playNew(buffers.get(key), this.getEffect(), getSinglePanPosition());
        }
    }

    getEffect(): Effect {
        const choice = getNumericChoice(2);

        switch (choice) {
            case 0:
                return new PingPongDelay();
            case 1:
                return new FilterDelay();
            // case 2:
            //     return new = new Reverb(this.panner);
            default:
                console.log("Hmm, shouldn't get here?");
        }
    }

    dispose(): void {
        console.log("Disposing");
        this.stopPressed = true;

        // Tidy up all the oneShots we've got happening
        this.reset();
    }

    reset(): void {
        this.stopPressed = false;
    }
}

export class CCManager {
    loopManager: LoopManager;
    // oneShotManager: OneShotManager;

    constructor() {
        this.loopManager = new LoopManager();
        // this.oneShotManager = new OneShotManager();
    }

    start(): void {
        // We've played, then we've stopped, now we're playing again. First dispose of pre-existing loops then recompile loops
        this.loopManager.initialise();
        // this.oneShotManager.initialise();
    }

    stop(): void {
        this.loopManager.dispose();
        // this.oneShotManager.dispose();
    }
}
