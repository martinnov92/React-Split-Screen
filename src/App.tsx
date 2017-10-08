import * as React from 'react';
import { SplitScreen } from './SplitScreen';

class App extends React.Component {
    render() {
        return (
            <div className="App">
                <SplitScreen
                    primaryPaneInitSize="50%"
                >
                    <div>asdf</div>
                    <SplitScreen
                        primaryPaneInitSize="50%"
                    >
                        <div>asdf</div>
                        <div>asdf</div>
                    </SplitScreen>
                </SplitScreen>
            </div>
        );
    }
}

export default App;
