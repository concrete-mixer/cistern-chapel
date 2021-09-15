import {IPackageJson} from 'package-json-type'
import {OneShot, Loops} from './types'

export const getChoice = (max: number) => {
    return Math.floor(Math.random() * max) 
}

interface CompileFilesReturn {
    loops: Loops
    oneShot: OneShot
}

export const compileFiles = async (): Promise<CompileFilesReturn> => {
    // Build a list of audio files structured for random selection
    var manifest: IPackageJson

    await fetch('./manifest.json').then( 
        response => response.json() 
    ).then(obj => manifest = obj) 

    const files = Object.keys(manifest)
    const loops: Loops = []
    const oneShot: OneShot = {
        instrumental: [],
        concrete: []
    }

    for (const f of files) {
        if (f.match(/^audio\/*/)) {
            if (f.match(/^audio\/loops/)) {
                loops.push(f)
            }
            else if (f.match(/^audio\/oneshot\/instrumental/)) {
                oneShot.instrumental.push(f)
            }
            else if (f.match(/^audio\/oneshot\/concrete/)) {
                oneShot.concrete.push(f)
            }
            else {
                console.log(`Unexpected file ${f}`)
            }
        }
    }

    return {loops, oneShot}
}