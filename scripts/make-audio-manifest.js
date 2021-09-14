'use strict'

// This script gets a file list from the public/audio directory following conventions used by the Cistern Chapel app.
// The file list is written to a json file, and this manifest is used by Cistern Chapel to load and use mp3 files

const path = require('path')
const fs = require('fs')

const basePath = path.join(__dirname, '../src/audio')
const manifestpath = path.join(__dirname, '../src/audio/audio-manifest.json')

function getFileListFromDir(dirPath) {
    const list = []
    for (const filename of fs.readdirSync(path.join(basePath, dirPath))) {
        list.push(path.join(dirPath, filename))
    }

    return list
}

function getFileListFromSubDirectories(dirPath) {
    let list = []
    const subdirs = fs.readdirSync(path.join(basePath, dirPath))

    for (const subdir of subdirs) {
        const files = getFileListFromDir(path.join(dirPath, subdir))
        for (const file of files) {
            list.push(file)
        }
    }

    return list
}

// This is the what we'll be writing to the manifest file. The directory structure of public/audio is expected to be
// as outlined. If it's not then errors will ensue.
const manifest = {
    loops: getFileListFromDir('loops'), // single dir of audio files
    oneshot: {
        concrete: getFileListFromDir('oneshot/concrete'), // contains arbitrary sub directories of audio files
        instrumental: getFileListFromSubDirectories('oneshot/instrumental'), // single dir of audio files
    }
}

// Write manifest
fs.writeFileSync(manifestpath, JSON.stringify(manifest, null, 2))

console.log(`${manifestpath} generated`)