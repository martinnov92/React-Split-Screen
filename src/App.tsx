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
                        vertical={false}
                    >
                        <SplitScreen
                            primaryPaneInitSize="70%"
                        >
                            <div>
                                <div>
                                    asdf
                                </div>
                            </div>
                            <div></div>
                        </SplitScreen>
                        <SplitScreen
                            primaryPaneInitSize="150px"
                        >
                            <div>
                                <div>
                                    asdf
                                </div>
                            </div>
                            <SplitScreen
                                primaryPaneInitSize="150px"
                                vertical={false}
                            >
                                <div>
                                    <div>
                                        asdf
                                    </div>
                                </div>
                                <div></div>
                            </SplitScreen>
                        </SplitScreen>
                    </SplitScreen>
                </SplitScreen>
            </div>
        );
    }
}

export default App;
