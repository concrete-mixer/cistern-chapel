import * as React from "react";
import { start, stop } from "./lib/control";
import styles from "./App.module.css";
import { PageProps } from "./App";
import * as Tone from "tone";

const MainPage = ({ setPageState }: PageProps): React.ReactElement => {
    const [playerState, setPlayerState] = React.useState(Tone.Transport.state === "started" ? "playing" : "stopped");

    return (
        <div>
            <h1>Welcome to the Cistern Chapel</h1>
            <p>You can join us in aural communion by clicking the &quot;Play audio&quot; button below.</p>
            {playerState === "stopped" && (
                <button
                    onClick={() => {
                        setPlayerState("loading");
                        start(() => setPlayerState("playing"));
                    }}
                    autoFocus
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
                    autoFocus
                >
                    Stop audio
                </button>
            )}
            <div className={styles.explanation}>
                <h2>Explanation</h2>
                <p>
                    This is a <a href="https://github.com/concrete-mixer/cistern-chapel">web implementation</a> of{" "}
                    <a href="https://github.com/concrete-mixer/flush-tones">Flush Tones</a>, a sound art installation
                    for public toilets.
                </p>
                <p>
                    <a href="mailto:concretemixer.audio@gmail.com">Sales and contact</a>
                </p>
                <p className={styles.nav} onClick={() => setPageState("credits")}>
                    Credits
                </p>
            </div>
        </div>
    );
};

export default MainPage;
