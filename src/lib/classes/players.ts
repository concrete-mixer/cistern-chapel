import { PlayerOptions } from "tone/build/esm";
import { Effect } from "./effects";
import * as Tone from "tone";
import { getBoolChoice } from "../helpers";
import { loopFade, reverseProbability, loopVolume } from "../constants";
import shuffle from "lodash.shuffle";
import random from "lodash.random";

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
