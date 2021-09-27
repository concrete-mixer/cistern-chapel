import * as React from "react";
import { start, stop } from "./lib/control";
import styles from "./App.module.css";

const App: React.FC = (): React.ReactElement => {
    const [playerState, setPlayerState] = React.useState("stopped");
    return (
        <div className={styles.backgroundWrapper}>
            <div className={styles.backgroundShade}>
                <div className={styles.boxWrapper}>
                    <div className={styles.box}>
                        <h1>Welcome to the Cistern Chapel</h1>
                        <p>You can join us in aural communion by click the &quot;Play audio&quot; button below.</p>
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
                        {playerState === "loading" && <p>Loading files...</p>}
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
                                This is a web-based implementation of Flush Tones, an as-yet unrealised art installation
                                concept.
                            </p>
                            <p>
                                The idea is to make public toilets less intimidating by filling them up with strange
                                sounds to mask the real ones.{" "}
                                <a href="https://en.wikipedia.org/wiki/Paruresis">Paruresis</a> and{" "}
                                <a href="https://en.wikipedia.org/wiki/Parcopresis">Parcopresis</a> are real conditions,
                                people!
                            </p>
                            <p>
                                So far I&apos;ve had trouble finding a bathroom with power sockets to install speakers
                                in. One day, maybe. For now, punters can commune with the Cistern Chapel using their
                                smart phones.
                            </p>
                            <p>Plop.</p>
                        </div>
                    </div>
                </div>
                <div className={styles.backgroundAttribution}>
                    Photo of <a href="https://en.wikipedia.org/wiki/Basilica_Cistern">Basilica Cistern, Istanbul</a> by
                    Moise Nicu, CC BY 3.0 &lt;https://creativecommons.org/licenses/by/3.0&gt;, via Wikimedia Commons
                </div>
            </div>
        </div>
    );
};

export default App;
