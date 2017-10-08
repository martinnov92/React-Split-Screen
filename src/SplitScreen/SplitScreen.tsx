import * as React from 'react';
import * as ReactDOM from 'react-dom';
import SplitPane from './SplitPane';
import { unselect } from './';
import './index.css';

// [ ] funkční resize
// [x] vypočítání šířky primaryPane z primaryPaneInitSize
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

    allowResize?: boolean;
    // class names for layout
    layoutClassName?: string;
    primaryPaneClassName?: string;
    secondaryPaneClassName?: string;
    handlebarClassName?: string;
}

interface SplitScreenState {
    primaryPaneSize?: number;
    secondaryPaneSize?: number;
    mouseInResizer?: number;
    dragging?: boolean;
}

export default class SplitScreen extends React.Component<SplitScreenProps, SplitScreenState> {
    static defaultProps = {
        vertical: true,
        allowResize: true,
        primaryPaneInitSize: '50%'
    };

    layout: HTMLDivElement;
    resizer: HTMLDivElement;

    constructor() {
        super();

        this.state = {
            mouseInResizer: 0,
            primaryPaneSize: 0,
            secondaryPaneSize: 0,
            dragging: false
        };

        this.getInitPaneSize = this.getInitPaneSize.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.getCalculatedInitSize = this.getCalculatedInitSize.bind(this);
        this.getLayoutBoundingClientRect = this.getLayoutBoundingClientRect.bind(this);
        this.getResizerBoundingClientRect = this.getResizerBoundingClientRect.bind(this);
    }

    componentDidMount() {
        // set width of panes
        this.getInitPaneSize();

        // add calculation on resize
        window.addEventListener('resize', () => false);
    }

    handleMouseDown(evt: React.MouseEvent<HTMLDivElement> | any) {
        if (evt.button === 2 || !this.props.allowResize) {
            return;
        }

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
        // clear selection
        unselect();

        const { vertical } = this.props;
        const { mouseInResizer } = this.state;
        const layoutRect = this.getLayoutBoundingClientRect();

        if (vertical) {
            if (evt.clientX < layoutRect.left || evt.clientX > layoutRect.right) {
                return;
            }
        } else {
            if (evt.clientY < layoutRect.top || evt.clientY > layoutRect.bottom) {
                return;
            }
        }

        const offsetLeft = evt.clientX - layoutRect.left;

        this.setState({
            primaryPaneSize: offsetLeft,
            secondaryPaneSize: layoutRect.width - offsetLeft
        })

        console.log(offsetLeft, mouseInResizer);
    }

    render() {
        const {
            children,
            vertical
        } = this.props;

        const {
            dragging,
            primaryPaneSize,
            secondaryPaneSize
        } = this.state;

        const childrenCount = React.Children.count(children);
        const layoutClassName = [
            'rss-layout',
            !vertical ? 'rss-horizontal' : null,
            dragging ? 'rss-layout-dragging' : null
        ].filter((className) => className !== null).join(' ');

        const primaryPaneStyle = {
            flexBasis: `${primaryPaneSize}px`
        };

        const secondaryPaneStyle = {
            flexBasis: `${secondaryPaneSize}px`
        };

        console.log(primaryPaneSize, secondaryPaneSize);
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
                            style={primaryPaneStyle}
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
                            style={secondaryPaneStyle}
                        >
                            {children[1]}
                        </SplitPane>
                    ]
                    : <SplitPane>{children && children[0]}</SplitPane>
                }
            </div>
        );
    }

    // get init width of pane (componentDidMount)
    getInitPaneSize() {
        const { primaryPaneInitSize } = this.props;
        const testPX = new RegExp('%', 'gi');
        let initSize = 0;
        let sizeExt = '';

        if (typeof primaryPaneInitSize === 'string') {
            // get size in %
            if (testPX.test(primaryPaneInitSize)) {
                sizeExt = '%';
            } else {
                sizeExt = 'px';
            }

            // get number from string
            initSize = parseFloat(primaryPaneInitSize);
        } else {
            return console.warn('Please provide string for primaryPaneInitSize prop.');
        }

        // get calculated width of primary pane
        const primaryPaneCalculatedWidth = this.getCalculatedInitSize(initSize, sizeExt);
        const secondaryPaneCalculatedWidth =
            this.getLayoutBoundingClientRect().width - this.getResizerBoundingClientRect().width - primaryPaneCalculatedWidth;

        this.setState({
            primaryPaneSize: primaryPaneCalculatedWidth,
            secondaryPaneSize: secondaryPaneCalculatedWidth
        });
    }

    getCalculatedInitSize(size: number = 0, type: string = 'px'): number {
        const getSplitterSize = this.getLayoutBoundingClientRect();
        let calculatedWidth = 0;

        if (type === '%') {
            // get calculated primary pane width from percentage
            calculatedWidth = (getSplitterSize.width * (size / 100)) - (this.getResizerBoundingClientRect().width / 2);
        }

        if (type === 'px') {
            // check if size in px is not bigger then size of splitter div
            if (size > getSplitterSize.width) {
                // if size is bigger, retrun only 90% of available space
                return this.getCalculatedInitSize(90, '%');
            } else {
                calculatedWidth = size;
            }
        }

        return calculatedWidth;
    }

    // get sizes
    getPaneSize() {
        const getSplitterSize = this.getLayoutBoundingClientRect();
        const getResizerSize = this.getResizerBoundingClientRect();

        console.log(getSplitterSize, getResizerSize);
        return getSplitterSize;
    }

    // getters
    getLayoutBoundingClientRect() {
        return ReactDOM.findDOMNode(this.layout).getBoundingClientRect();
    }

    getResizerBoundingClientRect() {
        return ReactDOM.findDOMNode(this.resizer).getBoundingClientRect();
    }
}
