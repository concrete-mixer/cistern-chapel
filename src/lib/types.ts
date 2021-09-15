export interface OneShot {
    instrumental: string[],
    concrete: string[]
}

export type Loops = string[]

export interface FileList {
    loops: Loops
    oneShot: OneShot
}