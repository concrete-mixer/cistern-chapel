// export class Loop {
//     constructor(config) {
//        this.setDefaultConfig()
//        this.setConfig(config)

//        this.player = new Tone.Player({
//             url: `../audio/${config.file}`,
//             autostart: true,
//             loop: true,
//             reverse: this.config.reverse,
//             volume: this.config.volume,
//             fadeIn: 4,
//             fadeOut: 4,
//         }).toDestination()
//     }

//     setDefaultConfig() {
//         this.config = {
//             autostart: true,
//             loop: true,
//             fadeIn: defaultFadeIn,
//             fadeOut: defaultFadeOut,
//             playbackRate: 1,
//             volume: -6
//         }
//     }
// }
