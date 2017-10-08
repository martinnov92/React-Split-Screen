import * as React from 'react';
import { SplitScreen } from './SplitScreen';

class App extends React.Component {
    render() {
        return (
            <div className="App">
                <SplitScreen
                    primaryPaneInitSize="50%"
                >
                    <div>
                        <div>
                            asdf
                        </div>
                    </div>
                    <SplitScreen
                        primaryPaneInitSize="300px"
                        vertical
                    >
                        <div>
                            <div>
                                asdf
                            </div>
                        </div>
                        <div>
                            <div>3. panel</div>
                        </div>
                    </SplitScreen>
                </SplitScreen>
            </div>
        );
    }
}

export default App;
