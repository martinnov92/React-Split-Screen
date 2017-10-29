import * as React from 'react';

interface ResizerProps {
    onMouseDown?: (e?: any) => void;
    style?: any;
    className?: string;
}

export default class Resizer extends React.PureComponent<ResizerProps, {}> {
    resizer: HTMLDivElement;

    render() {
        const { className } = this.props;

        return (
            <div
                className={`rss-resizer ${className}`}
                ref={(div: HTMLDivElement) => this.resizer = div}
                onMouseDown={this.props.onMouseDown}
                style={this.props.style}
            >
                <div className="rss-resizer--drag" />
            </div>
        );
    }
}