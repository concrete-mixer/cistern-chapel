import { loopFade, reverseProbability } from "./constants";
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
        const delayTime = _.random(0.4, 1, true);
        const pingPongDelay = new Tone.PingPongDelay({
            delayTime,
            wet: _.random(0.2, 0.4, true),
            feedback: _.random(0.2, 0.4, true),
        });
        super(pingPongDelay);
    }
}

export class FilterDelay extends Effect {
    delay: Tone.FeedbackDelay;
    constructor() {
        // We add 1 because numeric choice can be 0
        const delayTime = _.random(0.01, 1, true);
        const delay = new Tone.FeedbackDelay({ delayTime, feedback: _.random(0.2, 0.6, true) });
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

export class PitchShift extends Effect {
    constructor() {
        const shiftAmount = _.random(-12, 12);
        super(new Tone.PitchShift(shiftAmount));
    }
}

export class Reverb extends Effect {
    constructor() {
        const reverb = new Tone.Freeverb(
            _.random(0.01, 1, true), // Room size 0 - 1
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
        fadeOut: 0.25,
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
        this.player.buffer = buffer;

        if (this.effect) {
            this.effect.dispose();
        }

        this.effect = effect;

        if (this.panner) {
            this.panner.dispose();
        }

        this.panner = new Tone.Panner(panPosition);

        this.effect.connect();
        this.panner.connect(this.effect.connectNode);
        this.player.connect(this.panner);
        this.player.set({ reverse: getBoolChoice(reverseProbability) });
        this.player.start();

        // Set time to mark player stopped, adding a 3 second buffer for effect tails
        const transportTimeToRun = Tone.Transport.now() + this.player.buffer.duration + 3;

        Tone.Transport.scheduleOnce(() => {
            this.player.stop();
        }, transportTimeToRun);
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
            fadeIn: loopFade,
            fadeOut: loopFade,
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

        // Connect components together
        this.player.connect(this.panner);
        this.panner.connect(this.effect.connectNode);
        this.effect.connect();

        this.player.set({ reverse: getBoolChoice(reverseProbability) });
        this.player.start();
    }

    playNew(buffer: Tone.ToneAudioBuffer, effect: Effect): void {
        this.player.stop();

        // Set time to mark player stopped, adding a 3 second buffer for effect tails
        const transportTimeToRun = Tone.Transport.now() + loopFade + 3;

        Tone.Transport.scheduleOnce((time) => {
            this.play(buffer, effect);
        }, transportTimeToRun);
    }
}

export class OneShot extends CCPlayer {
    constructor() {
        super();
    }
}

class Manager {
    stopPressed = false;
    buffers: Tone.ToneAudioBuffers;
    buffersMap: ToneAudioBuffersUrlMap;
}

export class LoopManager extends Manager {
    loopsCount = 2;
    panPositions = getPanPositions(this.loopsCount);
    players: Loop[];

    constructor() {
        super();
        const { loopBuffers, loopMap } = getLoopData();
        this.buffers = loopBuffers;
        this.buffersMap = loopMap;
        this.initialise();
    }

    initialise(): void {
        const { loopBuffers, loopMap } = getLoopData();
        this.buffers = loopBuffers;
        this.buffersMap = loopMap;
        const keys = _.shuffle(Object.keys(this.buffersMap));
        this.players = [new Loop(this.panPositions[0]), new Loop(this.panPositions[1])];

        // Need to assign different files
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].play(loopBuffers.get(keys[i]), this.getEffect());
        }
        Tone.Transport.scheduleRepeat((time) => this.makeChoice(), 20, 20);
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

    makeChoice(): void {
        const changeLoop = getBoolChoice(0.5);

        if (!this.stopPressed && changeLoop) {
            // Play a new loop file

            // Get some things
            // Pop off oldest playing loop
            const loop = this.players.shift();
            const keyToPlay = _.shuffle(Object.keys(this.buffersMap))[0];

            // Make it happen
            loop.playNew(this.buffers.get(keyToPlay), this.getEffect());

            // Push to the bottom of pile
            this.players.push(loop);
        }
    }

    dispose(): void {
        this.stopPressed = true;
        this.players = [];
        this.reset();
    }

    reset(): void {
        this.players.forEach((player) => player.dispose());
        this.stopPressed = false;
    }
}

export class OneShotManager extends Manager {
    players: OneShot[] = [new OneShot(), new OneShot()];

    constructor(buffers: Tone.ToneAudioBuffers, buffersMap: ToneAudioBuffersUrlMap) {
        super();
        this.buffers = buffers;
        this.buffersMap = buffersMap;
        this.initialise();
    }

    initialise(): void {
        Tone.Transport.scheduleRepeat(
            () => {
                this.makeChoice();
            },
            2,
            10,
        ); // Offset instrumentals from concrete samples
    }

    makeChoice(): void {
        // Jump through some hoops
        if (this.stopPressed) {
            return;
        }

        const playerIndex = this.getAvailablePlayerIndex();

        if (playerIndex === -1) {
            return;
        }

        if (getBoolChoice(0.25)) {
            const player = this.players[playerIndex];
            const keyToPlay = _.shuffle(Object.keys(this.buffersMap))[0];
            player.playNew(this.buffers.get(keyToPlay), this.getEffect(), getSinglePanPosition());
        }
    }

    getAvailablePlayerIndex(): number {
        // Find the index of the first player found that is not currently playing anything
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].player.state === "stopped") {
                return i;
            }
        }
        return -1; // As per Array.indexOf() an index of -1 will be interpreted as not found
    }

    getEffect(): Effect {
        const choice = getNumericChoice(2);

        switch (choice) {
            case 0:
                return new PingPongDelay();
            case 1:
                return new FilterDelay();
            // case 2:
            //     return new Reverb();
            case 2:
                return new PitchShift();
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
    concreteManager: OneShotManager;
    instrumentalManager: OneShotManager;

    constructor() {
        // Initialise our children. Fly, my pretties!
        this.loopManager = new LoopManager();
        const { concreteBuffers, concreteMap, instrumentalBuffers, instrumentalMap } = getOneShotData();

        this.concreteManager = new OneShotManager(concreteBuffers, concreteMap);
        this.instrumentalManager = new OneShotManager(instrumentalBuffers, instrumentalMap);

        const grain = new Tone.GrainPlayer({
            url: "/audio/oneshot/instrumental/trumpet/1094_trumpet_079_2_5_1.mp3.mp3",
            playbackRate: 0.1,
            grainSize: 0.02,
            overlap: 0.7,
            loop: true,
            volume: -18,
            loopStart: 0,
            mute: false,
            reverse: true,
            detune: -700,
        })
            .toDestination()
            .start(5);
    }

    start(): void {
        // We've played, then we've stopped, now we're playing again. First dispose of pre-existing loops then recompile loops
        this.loopManager.initialise();
        this.concreteManager.initialise();
        this.instrumentalManager.initialise();
    }

    stop(): void {
        this.loopManager.dispose();
        this.concreteManager.dispose();
        this.instrumentalManager.dispose();
    }
}
