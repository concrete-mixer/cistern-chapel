import * as React from "react";
import styles from "./App.module.css";
import { PageProps } from "./App";

const Credits = ({ setPageState }: PageProps): React.ReactElement => {
    return (
        <div>
            <h1>Credits</h1>
            <h2>Samples</h2>
            <p>
                In addition to my own bathroom recordings, I nabbed recordings from the following{" "}
                <a href="https://freesound.org">Freesounders</a>:
            </p>
            <ul>
                <li>
                    <a href="https://freesound.org/people/adegenerate/sounds/71218/">adegenerate</a>
                </li>
                <li>
                    <a href="https://freesound.org/people/THE_bizniss/sounds/58201/">THE_bizness</a>
                </li>
                <li>
                    <a href="https://freesound.org/people/hybu/sounds/139749/">hybu</a>
                </li>
                <li>
                    <a href="https://freesound.org/people/yuval/sounds/184453/">yuval</a>
                </li>
            </ul>
            <p>
                I also obtained brass and woodwind instrument samples from the{" "}
                <a href="https://philharmonia.co.uk/resources/sound-samples/">Philharmonia Orchestra</a>.
            </p>
            <p>Many thanks!</p>

            <h2>Background photo</h2>
            <p>
                The <a href="https://commons.wikimedia.org/wiki/File:Basilica_Cistern_Istanbul.JPG">background photo</a>{" "}
                of <a href="https://en.wikipedia.org/wiki/Basilica_Cistern">Basilica Cistern, Istanbul</a> by Moise
                Nicu, CC BY 3.0 &lt;https://creativecommons.org/licenses/by/3.0&gt;, via Wikimedia Commons
            </p>
            <p className={styles.nav} onClick={() => setPageState("main")}>
                Back to main
            </p>
        </div>
    );
};

export default Credits;
