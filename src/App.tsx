import * as React from 'react';
import { SplitScreen } from './SplitScreen';

class App extends React.Component {
    render() {
        return (
            <div className="App">
                <SplitScreen>
                    <div>asdf</div>
                    <div>asdf</div>
                </SplitScreen>
            </div>
        );
    }
}

export default App;
