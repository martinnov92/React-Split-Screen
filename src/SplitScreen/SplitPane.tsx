import * as React from 'react';

export default class SplitPane extends React.Component<{}, {}> {
    render() {
        return (
            <div>
                { this.props.children }
            </div>
        );
    }
}
