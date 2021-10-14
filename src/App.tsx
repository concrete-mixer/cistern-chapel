import * as React from "react";
import styles from "./App.module.css";
import MainPage from "./MainPage";
import Credits from "./Credits";

// This is used by child components
export interface PageProps {
    setPageState: (state: string) => void;
}

const App: React.FC = (): React.ReactElement => {
    const [pageState, setPageState] = React.useState("main");
    return (
        <div>
            <div className={styles.backgroundWrapper}>
                <div className={styles.backgroundShade}></div>
            </div>
            <div className={styles.boxWrapper}>
                <div className={styles.box}>
                    {pageState === "main" && <MainPage setPageState={setPageState} />}
                    {pageState === "credits" && <Credits setPageState={setPageState} />}
                </div>
            </div>
        </div>
    );
};

export default App;
