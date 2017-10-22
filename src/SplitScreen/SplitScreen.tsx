import * as React from 'react';
import * as ReactDOM from 'react-dom';
import SplitPane from './SplitPane';
import Resizer from './Resizer';
import { unselect } from './';
import './index.css';

// [ ] funkční resize
// [x] window resize event listener
// [x] vyřešit zobrazení pouze jednoho potomka
// [x] vypočítání šířky primaryPane z primaryPaneInitSize
// [x] vypočítání poměru stran z primaryPaneInitSize - doladit
// [ ] post poned resize
// [ ] vytvořit funkci v helpers, která bude sloužit na zavolání maximalizace / minimalizace panelu (custom event nebo flux??)
// [ ] vypočítání max width
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

    /**
     * @param {string} group Name of the splitter group. Used when resizing
     */
    group?: string;
    allowResize?: boolean;
    postPoned?: boolean;

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
    postPonedPosition?: number;
    dragging?: boolean;
    pristine?: boolean;
    ratio?: {
        paneOne: number | null
    };
}

export default class SplitScreen extends React.Component<SplitScreenProps, SplitScreenState> {
    static defaultProps = {
        vertical: true,
        allowResize: true,
        postPoned: false,
        primaryPaneInitSize: '50%'
    };

    layout: HTMLDivElement;
    resizer: Resizer;

    constructor() {
        super();

        this.state = {
            mouseInResizer: 0,
            primaryPaneSize: 0,
            secondaryPaneSize: 0,
            postPonedPosition: 0,
            dragging: false,
            pristine: true,
            ratio: {
                paneOne: null
            }
        };

        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.getPanesRatio = this.getPanesRatio.bind(this);
        this.getInitPaneSize = this.getInitPaneSize.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.getChildrenCount = this.getChildrenCount.bind(this);
        this.handleResizeEvent = this.handleResizeEvent.bind(this);
        this.handleDraggingEvent = this.handleDraggingEvent.bind(this);
        this.getCalculatedInitSize = this.getCalculatedInitSize.bind(this);
        this.getLayoutBoundingClientRect = this.getLayoutBoundingClientRect.bind(this);
        this.getResizerBoundingClientRect = this.getResizerBoundingClientRect.bind(this);
    }

    componentDidMount() {
        // set width of panes
        this.getInitPaneSize();

        // add calculation on resize
        window.addEventListener('resize', this.handleResizeEvent);
        window.addEventListener('RSSStartDragging', this.getPanesRatio);
        window.addEventListener('RSSDragging', (evt: CustomEvent) => this.handleDraggingEvent(evt));
        window.addEventListener('RSSEndDragging', () => console.log('RSSplitter - End dragging'));
    }

    handleMouseDown(evt: React.MouseEvent<HTMLDivElement> | any) {
        if (evt.button === 2 || !this.props.allowResize) {
            return;
        }

        const event: CustomEvent = new CustomEvent('RSSStartDragging', {
            detail: {
                group: this.props.group
            }
        });
        window.dispatchEvent(event);

        // when div is pressed => add event listeners
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);

        let mouseInResizer = 0;
        const resizerOffset = this.getResizerBoundingClientRect();

        if (this.props.vertical) {
            mouseInResizer = evt.clientX - resizerOffset.left;
        } else {
            mouseInResizer = evt.clientY - resizerOffset.top;
        }

        // clear selection
        unselect();
        this.setState({
            dragging: true,
            mouseInResizer
        });
    }

    handleMouseMove(evt: MouseEvent) {
        // clear selection
        unselect();

        const { vertical } = this.props;
        // const { mouseInResizer } = this.state;
        const layoutRect = this.getLayoutBoundingClientRect();
        const resizerRect = this.getResizerBoundingClientRect();
        const mouseInResizer = this.state.mouseInResizer || 0;
        let primaryPaneSize = 0;
        let secondaryPaneSize = 0;

        if (vertical) {
            primaryPaneSize = evt.clientX - layoutRect.left - mouseInResizer;

            if (evt.clientX < layoutRect.left || evt.clientX > layoutRect.right) {
                return;
            }
        } else {
            primaryPaneSize = evt.clientY - layoutRect.top - mouseInResizer;

            if (evt.clientY < layoutRect.top || evt.clientY > layoutRect.bottom) {
                return;
            }
        }

        secondaryPaneSize = vertical
        ? layoutRect.width - resizerRect.width - primaryPaneSize
        : layoutRect.height - resizerRect.height - primaryPaneSize;

        const event = new CustomEvent('RSSDragging', {
            detail: {
                vertical,
                group: this.props.group
            }
        });
        window.dispatchEvent(event);

        this.setState({
            primaryPaneSize: primaryPaneSize,
            secondaryPaneSize,
            pristine: false
        });
    }

    handleMouseUp(evt: MouseEvent) {
        // when button on mouse is released => remove event listeners
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);

        const event = new CustomEvent('RSSEndDragging', {
            detail: {
                group: this.props.group
            }
        });
        window.dispatchEvent(event);

        // clear selection
        unselect();
        this.setState({
            dragging: false
        });
    }

    render() {
        const {
            vertical,
            children,
            postPoned
        } = this.props;

        const {
            dragging,
            primaryPaneSize,
            secondaryPaneSize
        } = this.state;

        let postPonedResizer = {};
        const childrenCount = this.getChildrenCount();
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

        if (postPoned) {
            postPonedResizer = {
                position: 'absolute',
                opacity: .5,
                [vertical ? 'left' : 'top']: `${primaryPaneSize}px`,
                backgroundColor: 'red'
            };
        }

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

                        <Resizer
                            key={'rss-resizer'}
                            ref={(div: Resizer) => this.resizer = div}
                            onMouseDown={this.handleMouseDown}
                        />,

                        <SplitPane
                            key={'pane-2'}
                            style={secondaryPaneStyle}
                        >
                            {children[1]}
                        </SplitPane>
                    ]
                    : <SplitPane
                        key={'rss-pane-single'}
                        style={primaryPaneStyle}
                    >
                        {children && children[0]}
                    </SplitPane>
                }

                {
                    postPoned && dragging
                    ? <Resizer style={postPonedResizer} />
                    : null
                }
            </div>
        );
    }

    // get init width of pane (componentDidMount), or call on custom resize event
    getInitPaneSize(size?: number, ext?: string) {
        const { primaryPaneInitSize, vertical } = this.props;
        const childrenCount = this.getChildrenCount();
        const testPX = new RegExp('%', 'gi');
        let initSize = 100;
        let sizeExt = '%';

        if (childrenCount > 1) {
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
        }

        // get calculated width of primary pane
        const primaryPaneSize = this.getCalculatedInitSize(size || initSize, ext || sizeExt);
        let secondaryPaneSize = 0;

        if (childrenCount > 1) {
            secondaryPaneSize =
                vertical
                ? this.getLayoutBoundingClientRect().width - this.getResizerBoundingClientRect().width - primaryPaneSize
                : this.getLayoutBoundingClientRect().height - this.getResizerBoundingClientRect().height - primaryPaneSize;
        }

        this.setState({
            primaryPaneSize,
            secondaryPaneSize
        });
    }

    getCalculatedInitSize(size: number = 0, type: string = 'px'): number {
        const { vertical } = this.props;
        const childrenCount = this.getChildrenCount();
        const getSplitterSize = this.getLayoutBoundingClientRect();
        let calculatedSize = 0;
        let resizerSize = 0;

        if (childrenCount > 1) {
            if (vertical) {
                resizerSize = this.getResizerBoundingClientRect().width / 2;
            } else {
                resizerSize = this.getResizerBoundingClientRect().height / 2;
            }
        }

        if (type === '%') {
            // get calculated primary pane width from percentage
            calculatedSize = vertical
            ? (getSplitterSize.width * (size / 100)) - resizerSize
            : (getSplitterSize.height * (size / 100)) - resizerSize;
        }

        if (type === 'px') {
            // check if size in px is not bigger then size of splitter div
            if (vertical) {
                if (size > getSplitterSize.width) {
                    // if size is bigger, retrun only 90% of available space
                    return this.getCalculatedInitSize(90, '%');
                } else {
                    calculatedSize = size;
                }
            } else {
                if (size > getSplitterSize.height) {
                    // if size is bigger, retrun only 90% of available space
                    return this.getCalculatedInitSize(90, '%');
                } else {
                    calculatedSize = size;
                }
            }
        }

        return calculatedSize;
    }

    // event handlers
    handleDraggingEvent(evt?: CustomEvent) {
        const { dragging, ratio, pristine } = this.state;
        const { vertical } = this.props;

        if (pristine || !evt) {
            // if splitter is untouched use default init proportion
            return this.getInitPaneSize();
        }

        if (!dragging && (this.props.group === evt.detail.group)) {
            if (vertical === evt.detail.vertical) {
                this.getInitPaneSize(ratio && (ratio.paneOne || 0), '%');
            }
        }
    }

    handleResizeEvent() {
        const { pristine } = this.state;
        const ratio = this.getPanesRatio().paneOne;

        if (pristine) {
            return this.getInitPaneSize();
        }

        return this.getInitPaneSize((ratio || 0), '%');
    }

    getPanesRatio() {
        // get calculated ratio for later use when resize event is fired
        let resizerSize = 0;
        const { vertical } = this.props;
        const { primaryPaneSize } = this.state;
        const childrenCount = this.getChildrenCount();
        const layoutSize = vertical ? this.getLayoutBoundingClientRect().width : this.getLayoutBoundingClientRect().height;

        if (childrenCount > 1) {
            resizerSize = vertical ? this.getResizerBoundingClientRect().width : this.getResizerBoundingClientRect().height;
        }

        const ratio = {
            paneOne: (((primaryPaneSize || 0) + (resizerSize / 2)) * 100) / layoutSize
        };

        this.setState({
            ratio
        });

        return ratio;
    }

    // getters
    getLayoutBoundingClientRect() {
        return ReactDOM.findDOMNode(this.layout).getBoundingClientRect();
    }

    getResizerBoundingClientRect() {
        return ReactDOM.findDOMNode(this.resizer).getBoundingClientRect();
    }

    getChildrenCount() {
        return this.props.children ? React.Children.count(this.props.children) : 0;
    }
}
