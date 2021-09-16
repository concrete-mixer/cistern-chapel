import * as React from 'react';
import { start, stop } from './lib/control';

const App: React.FC = (): React.ReactElement => {
    const [playing, setPlaying] = React.useState(false);
    return (
        <div>
            <button
                disabled={playing === true}
                onClick={() => {
                    setPlaying(true);
                    start();
                }}
            >
                Play
            </button>
            <button
                disabled={playing === false}
                onClick={() => {
                    setPlaying(false);
                    stop();
                }}
            >
                Stop
            </button>
        </div>
    );
};

export default App;
