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
                        postPoned
                    >
                        <SplitScreen
                            primaryPaneInitSize="70%"
                            group="splitter"
                        >
                            <div className="shadow">ksjflajsdflkj</div>
                            <div className="shadow">ksjflajsdflkj</div>
                        </SplitScreen>
                        <SplitScreen
                            primaryPaneInitSize="50px"
                            group="splitter"
                            postPoned
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
            </div>
        );
    }
}

export default App;
