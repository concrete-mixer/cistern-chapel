import { loopVolume, concreteVolume } from "../constants";
import { getBoolChoice, getBufferMapData, getNumericChoice, getPanPositions, getSinglePanPosition } from "../helpers";
import * as Tone from "tone";
import shuffle from "lodash.shuffle";
import { ToneAudioBuffersUrlMap } from "tone/build/esm/core/context/ToneAudioBuffers";
import { Effect, PingPongDelay, FilterDelay, PitchShift } from "./effects";
import { LoopPlayer, DronePlayer, OneShotPlayer } from "./players";

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
        const choice = getNumericChoice(3);

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
