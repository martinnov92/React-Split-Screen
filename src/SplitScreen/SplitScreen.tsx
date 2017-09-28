import * as React from 'react';
import * as ReactDOM from 'react-dom';
import SplitPane from './SplitPane';
import { unselect } from './';
import './index.css';

// [ ] funkční resize
// [ ] vypočítání šířky primaryPane z primaryPaneInitSize
// [ ] vypočítání max width
// [ ] zavolání resizu po dokončení resizování
// [ ] vytvoření custom eventy, na kterou budou moci reagovat ostatní komponenty v aplikaci
// [ ] možnost zaklapnutí splitteru (přes custom eventu?, nebo přes metodu a ref?)

interface SplitScreenProps {
    /**
     * @param {boolean} vertical True - vertical | False - horizontal
     */
    vertical?: boolean;
    /**
     * @param {string} primaryPaneInitSize Value of width/height in px or %
     */
    primaryPaneInitSize?: string;
    /**
     * @param {string} primaryPaneInitSize Value of width/height in % (will be calculated)
     */
    primaryPaneMaxSize?: Number;

    // class names for layout
    layoutClassName?: string;
    primaryPaneClassName?: string;
    secondaryPaneClassName?: string;
    handlebarClassName?: string;
}

interface SplitScreenState {
    dragging?: boolean;
}

export default class SplitScreen extends React.Component<SplitScreenProps, SplitScreenState> {
    static defaultProps = {
        vertical: true,
        primaryPaneInitSize: '50%'
    };

    layout: HTMLDivElement;
    resizer: HTMLDivElement;

    constructor() {
        super();

        this.state = {
            dragging: false
        };

        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
    }

    componentDidMount() {
        // add calculation on resize
        window.addEventListener('resize', () => false);
    }

    handleMouseDown(evt?: React.MouseEvent<HTMLDivElement>) {
        // when div is pressed => add event listeners
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);

        // clear selection
        unselect();
        this.setState({
            dragging: true
        });
    }

    handleMouseUp(evt: MouseEvent) {
        // when button on mouse is released => remove event listeners
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);

        // clear selection
        unselect();
        this.setState({
            dragging: false
        });
    }

    handleMouseMove(evt: MouseEvent) {
        if (!this.state.dragging) {
            return;
        }

        // clear selection
        unselect();

        // get mouse position
        const layoutRect = ReactDOM.findDOMNode(this.layout).getBoundingClientRect();
        const resizerRect = ReactDOM.findDOMNode(this.resizer).getBoundingClientRect();

        console.log(evt.clientX, evt.clientY, layoutRect, resizerRect);
    }

    render() {
        const {
            children,
            vertical
        } = this.props;

        const childrenCount = React.Children.count(children);
        const layoutClassName = [
            'rss-layout',
            !vertical && 'rss-horizontal'
        ].filter((className) => className !== null).join(' ');

        console.log(this.state);
        return (
            <div
                className={layoutClassName}
                ref={(div: HTMLDivElement) => this.layout = div}
            >
                {
                    children && childrenCount > 1
                    ? [
                        <SplitPane
                            key={'pane-1'}
                        >
                            {children[0]}
                        </SplitPane>,

                        <div
                            key={'rss-resizer'}
                            className={`rss-resizer`}
                            ref={(div: HTMLDivElement) => this.resizer = div}
                            onMouseDown={this.handleMouseDown}
                        >
                            <div className="rss-resizer--drag" />
                        </div>,

                        <SplitPane
                            key={'pane-2'}
                        >
                            {children[1]}
                        </SplitPane>
                    ]
                    : <SplitPane>{children && children[0]}</SplitPane>
                }
            </div>
        );
    }
}
