import { loopFade, reverseProbability, loopVolume, concreteVolume, instrumentalVolume } from "./constants";
import { getBoolChoice, getBufferMapData, getNumericChoice, getPanPositions, getSinglePanPosition } from "./helpers";
import * as Tone from "tone";
import { PlayerOptions, ToneAudioNode } from "tone/build/esm";
import shuffle from "lodash.shuffle";
import random from "lodash.random";
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
        const filterFreq = random(400, 800, true);
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
    player: Tone.Player | Tone.GrainPlayer;
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

export class LoopPlayer extends CCPlayer {
    panPosition: number;

    constructor(panPosition: number) {
        super({
            loop: true,
            fadeIn: loopFade,
            fadeOut: loopFade,
            volume: loopVolume,
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

export class OneShotPlayer extends CCPlayer {
    constructor(volume: number) {
        super({ volume });
    }
}

export class DronePlayer extends LoopPlayer {
    constructor(panPosition: number) {
        super(panPosition);
        this.player = new Tone.GrainPlayer();
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

        // Define grainplayer values separately for debugging
        const data = {
            playbackRate: random(0.125, 0.3, true),
            // playbackRate: 1,
            grainSize: random(0.1, 0.2, true),
            overlap: random(0.2, 0.8, true),
            detune: shuffle([-1200, -700, -500, 0])[0],
            // detune: 2400,
            loop: true,
            volume: loopVolume,
            loopStart: 0,
            reverse: getBoolChoice(reverseProbability),
        };

        this.player.set(data);
        this.player.start();
    }
}

class SoundManager {
    stopPressed = false;
    buffers: Tone.ToneAudioBuffers;
    buffersMap: ToneAudioBuffersUrlMap;
}

export class LoopManager extends SoundManager {
    loopsCount = 2;
    panPositions = getPanPositions(this.loopsCount);
    players: LoopPlayer[] | DronePlayer[];

    constructor(loopBuffers: Tone.ToneAudioBuffers, loopMap: ToneAudioBuffersUrlMap) {
        super();
        this.buffers = loopBuffers;
        this.buffersMap = loopMap;
        this.initialise();
    }

    initialise(): void {
        const keys = shuffle(Object.keys(this.buffersMap));
        this.players = [new LoopPlayer(this.panPositions[0]), new LoopPlayer(this.panPositions[1])];

        // Need to assign different files
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].play(this.buffers.get(keys[i]), this.getEffect());
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
                console.log("Hmm, shouldn't get here.");
        }
    }

    makeChoice(): void {
        const changeLoop = getBoolChoice(0.5);

        if (!this.stopPressed && changeLoop) {
            // Play a new loop file

            // Get some things
            // Pop off oldest playing loop
            const loop = this.players.shift();
            const keyToPlay = shuffle(Object.keys(this.buffersMap))[0];

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

export class OneShotManager extends SoundManager {
    players: OneShotPlayer[];

    constructor(buffers: Tone.ToneAudioBuffers, buffersMap: ToneAudioBuffersUrlMap, volume: number) {
        super();
        this.buffers = buffers;
        this.buffersMap = buffersMap;
        this.players = [new OneShotPlayer(volume), new OneShotPlayer(volume)];
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
            const keyToPlay = shuffle(Object.keys(this.buffersMap))[0];
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
                console.log("Hmm, shouldn't get here.");
        }
    }

    dispose(): void {
        this.stopPressed = true;

        // Tidy up all the oneShots we've got happening
        this.reset();
    }

    reset(): void {
        this.stopPressed = false;
    }
}

export class DroneManager extends LoopManager {
    constructor(buffers: Tone.ToneAudioBuffers, buffersMap: ToneAudioBuffersUrlMap) {
        super(buffers, buffersMap);
    }

    initialise(): void {
        const keys = shuffle(Object.keys(this.buffersMap));
        this.players = [new DronePlayer(this.panPositions[0]), new DronePlayer(this.panPositions[1])];

        // Need to assign different files
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].play(this.buffers.get(keys[i]), this.getEffect());
        }
        Tone.Transport.scheduleRepeat((time) => this.makeChoice(), 20, 20);
    }
}

export class CCManager {
    loopManager: LoopManager;
    concreteManager: OneShotManager;
    instrumentalManager: OneShotManager;
    droneManager: DroneManager;

    constructor() {
        // Initialise our children. Fly, my pretties!
        const bfm = getBufferMapData();

        this.loopManager = new LoopManager(bfm.loopBuffers, bfm.loopMap);
        this.concreteManager = new OneShotManager(bfm.concreteBuffers, bfm.concreteMap, concreteVolume);
        this.instrumentalManager = new OneShotManager(bfm.instrumentalBuffers, bfm.instrumentalMap, loopVolume);
        // this.droneManager = new DroneManager(bfm.droneBuffers, bfm.droneMap);
    }

    start(): void {
        // We've played, then we've stopped, now we're playing again. First dispose of pre-existing loops then recompile loops
        this.loopManager.initialise();
        this.concreteManager.initialise();
        this.instrumentalManager.initialise();
        // this.droneManager.initialise();
    }

    stop(): void {
        this.loopManager.dispose();
        this.concreteManager.dispose();
        this.instrumentalManager.dispose();
        // this.droneManager.dispose();
    }
}
