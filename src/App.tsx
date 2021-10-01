import * as React from "react";
import { start, stop } from "./lib/control";
import styles from "./App.module.css";

const App: React.FC = (): React.ReactElement => {
    const [playerState, setPlayerState] = React.useState("stopped");
    return (
        <div>
            <div className={styles.backgroundWrapper}>
                <div className={styles.backgroundShade}></div>
            </div>
            <div className={styles.boxWrapper}>
                <div className={styles.box}>
                    <h1>Welcome to the Cistern Chapel</h1>
                    <p>You can join us in aural communion by clicking the &quot;Play audio&quot; button below.</p>
                    {playerState === "stopped" && (
                        <button
                            onClick={() => {
                                setPlayerState("loading");
                                start(() => setPlayerState("playing"));
                            }}
                        >
                            Play audio
                        </button>
                    )}
                    {playerState === "loading" && <button>Loading files...</button>}
                    {playerState === "playing" && (
                        <button
                            onClick={() => {
                                setPlayerState("stopped");
                                stop();
                            }}
                        >
                            Stop audio
                        </button>
                    )}
                    <div className={styles.explanation}>
                        <h2>Explanation</h2>
                        <p>
                            This is a <a href="https://github.com/concrete-mixer/cistern-chapel">web implementation</a>{" "}
                            of <a href="https://github.com/concrete-mixer/flush-tones">Flush Tones</a>, an as-yet
                            unrealised sound art installation I&apos;ve had in my head for nearly 25 years.
                        </p>
                        <p>
                            The idea is to make public toilets less intimidating by distracting anxious users with
                            strange sounds to mask the real ones.
                        </p>
                        <p>I may also be taking the piss. I don&apos;t really know any more.</p>
                        <p>
                            So far I&apos;ve had trouble finding a bathroom with power sockets to install speakers in.
                            Or finding an organisation willing to have their bathrooms haunted. One day, maybe.
                        </p>
                        <p>
                            <a href="mailto:concretemixer.audio@gmail.com">Sales and contact</a>
                        </p>
                        <div className={styles.backgroundAttribution}>
                            <a href="https://commons.wikimedia.org/wiki/File:Basilica_Cistern_Istanbul.JPG">
                                Background photo
                            </a>{" "}
                            of <a href="https://en.wikipedia.org/wiki/Basilica_Cistern">Basilica Cistern, Istanbul</a>{" "}
                            by Moise Nicu, CC BY 3.0 &lt;https://creativecommons.org/licenses/by/3.0&gt;, via Wikimedia
                            Commons
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
