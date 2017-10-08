import * as React from 'react';

interface SplitPaneProps {
    style?: object;
}

export default class SplitPane extends React.Component<SplitPaneProps, {}> {
    render() {
        return (
            <div
                className={`rss-pane`}
                style={this.props.style}
            >
                {this.props.children}
            </div>
        );
    }
}
