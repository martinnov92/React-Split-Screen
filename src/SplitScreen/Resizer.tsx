import * as React from 'react';

interface ResizerProps {
    onMouseDown?: (e?: React.SyntheticEvent<HTMLDivElement>) => void;
    style?: object;
    className?: string;
}

export default class Resizer extends React.PureComponent<ResizerProps, {}> {
    resizer: HTMLDivElement;

    render() {
        const { className } = this.props;
        const classNames = [
            'rss-resizer',
            className
        ].filter((cls) => cls).join(' ');

        return (
            <div
                className={classNames}
                ref={(div: HTMLDivElement) => this.resizer = div}
                onMouseDown={this.props.onMouseDown}
                style={this.props.style}
            >
                <div className="rss-resizer--drag" />
            </div>
        );
    }
}