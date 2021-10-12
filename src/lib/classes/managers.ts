import { loopVolume, concreteVolume } from "../constants";
import { getBoolChoice, getBufferMapData, getNumericChoice, getPanPositions, getSinglePanPosition } from "../helpers";
import * as Tone from "tone";
import shuffle from "lodash.shuffle";
import without from "lodash.without";
import { ToneAudioBuffersUrlMap } from "tone/build/esm/core/context/ToneAudioBuffers";
import * as Effects from "./effects";
import { LoopPlayer, DronePlayer, OneShotPlayer } from "./players";

class SoundManager {
    stopPressed = false;
    buffers: Tone.ToneAudioBuffers;
    buffersMap: ToneAudioBuffersUrlMap;
    currentlyPlayingKeys: string[] = [];

    getNextBufferToPlay(): Tone.ToneAudioBuffer {
        // We want to work out which buffer to play next, excluding any buffers that are currently
        // playing or about to be replaced, to avoid repetition
        // First get file paths of all buffers, using them as unique keys
        const allKeys = Object.keys(this.buffersMap);

        // Filter out currently playing keys
        let keysToShuffle = allKeys;

        if (this.currentlyPlayingKeys.length > 0) {
            keysToShuffle = without(allKeys, ...this.currentlyPlayingKeys);

            // Remove the oldest currently playing key
            this.currentlyPlayingKeys.shift();
        }

        // Select a new key to play
        const keyToPlay = shuffle(keysToShuffle)[0];

        // Top up this.currentlyPlayingKeys
        this.currentlyPlayingKeys.push(keyToPlay);
        return this.buffers.get(keyToPlay);
    }
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

    getEffect(): Effects.Effect {
        const choice = getNumericChoice(4);

        switch (choice) {
            case 0:
                return new Effects.PingPongDelay();
            case 1:
                return new Effects.FilterDelay();
            case 2:
                return new Effects.DoubleDelay();
            case 3:
                return new Effects.RandDelay();
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

            // Make it happen
            loop.playNew(this.getNextBufferToPlay(), this.getEffect());

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
            player.playNew(this.getNextBufferToPlay(), this.getEffect(), getSinglePanPosition());
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

    getEffect(): Effects.Effect {
        const choice = getNumericChoice(5);

        switch (choice) {
            case 0:
                return new Effects.PingPongDelay();
            case 1:
                return new Effects.FilterDelay();
            case 2:
                return new Effects.PitchShift();
            case 3:
                return new Effects.DoubleDelay();
            case 4:
                return new Effects.RandDelay();
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

        // Dronemanager still a bit experimental, so commented out for now
        // this.droneManager = new DroneManager(bfm.droneBuffers, bfm.droneMap);
    }

    start(): void {
        // Initialise the managers (works whether they're being stood up for the first time or reinitialised for a start -> stop -> start)
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
