import * as React from 'react';

interface ResizerProps {
    onMouseDown?: (e?: any) => void;
    style?: any;
}

export default class Resizer extends React.PureComponent<ResizerProps, {}> {
    resizer: HTMLDivElement;

    render() {
        return (
            <div
                className={`rss-resizer`}
                ref={(div: HTMLDivElement) => this.resizer = div}
                onMouseDown={this.props.onMouseDown}
                style={this.props.style}
            >
                <div className="rss-resizer--drag" />
            </div>
        );
    }
}