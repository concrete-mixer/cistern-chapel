import * as Tone from 'tone'
import { getChoice, compileFiles } from './helpers'
import { Loops, OneShot, FileList } from './types'

export const controlFlow = async () => {
    const {loops, oneShot} = await compileFiles()

    // TODO: for now, make this a single iteration
    // - Create looper
    // - Set up interface for generating one-shot sounds arbitrarily
    Tone.start()
    const pingPong = new Tone.PingPongDelay({delayTime: "4n", wet: 0.2, feedback: 0.2}).toDestination(); 
    const loopFile = loops[getChoice(loops.length - 1)]
    const player = new Tone.Player({ 
        url: loopFile, autostart: true, loop: true, reverse: true, volume: 0.2, fadeIn: 4, fadeOut: 4 
    }).connect(pingPong) 
}

export const controlStop = () => {
    Tone.Transport.stop()
}