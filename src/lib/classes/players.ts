import { PlayerOptions } from "tone/build/esm";
import { Effect } from "./effects";
import * as Tone from "tone";
import { getBoolChoice } from "../helpers";
import { loopFade, reverseProbability, loopVolume } from "../constants";

export class CCPlayer {
    config: Partial<PlayerOptions> = {
        autostart: false,
        loop: false,
        playbackRate: 1,
        reverse: false,
        volume: -6, // Keep it fairly quiet
        fadeIn: 0.25,
        fadeOut: 0.25,
        onstop: () => {
            this.player.stop();
        },
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
        this.player.set({ ...this.config, reverse: getBoolChoice(reverseProbability) });
        this.player.start();
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

        this.player.set({ ...this.config, reverse: getBoolChoice(reverseProbability) });
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
