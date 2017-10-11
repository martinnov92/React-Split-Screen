import * as React from 'react';
import { SplitScreen } from './SplitScreen';

class App extends React.Component {
    render() {
        return (
            <div className="App">
                <SplitScreen
                    primaryPaneInitSize="50%"
                    group="splitter"
                >
                    <div>
                        <div>
                            asdf
                        </div>
                    </div>
                    <SplitScreen
                        primaryPaneInitSize="300px"
                        vertical={false}
                        group="splitterVertical"
                    >
                        <SplitScreen
                            primaryPaneInitSize="70%"
                            group="splitter"
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
                            group="splitter"
                        >
                            <div>
                                <div>
                                    asdf
                                </div>
                            </div>
                            <SplitScreen
                                primaryPaneInitSize="150px"
                                vertical={false}
                                group="splitterVertical"
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
