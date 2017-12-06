import * as React from 'react';
import * as ReactDOM from 'react-dom';

import SplitPane from './SplitPane';
import Resizer from './Resizer';
import { unselect } from './helpers';

import './index.css';

// [ ] funkční resize
// [x] window resize event listener
// [x] vyřešit zobrazení pouze jednoho potomka
// [x] vypočítání šířky primaryPane z primaryPaneInitSize
// [x] vypočítání poměru stran z primaryPaneInitSize - doladit
// [x] post poned resize
// [x] zkontrolovat, jak se splitter chová pouze s jedním panelem
// [ ] vytvořit funkci v helpers, která bude sloužit na zavolání maximalizace / minimalizace panelu (custom event)
// [x] vypočítání max width
// [ ] opravit uskakování při MaxWidth + zaokrouhlit vypočítané hodnoty
// [ ] při puštění myši mimo splitter nastavit správnou velikost místo uskočení splitteru na poslední správnou pozici
// [ ] vytvoření custom eventy, na kterou budou moci reagovat ostatní komponenty v aplikaci
// [ ] možnost zaklapnutí splitteru (přes custom eventu, nebo přes metodu a ref)
// [ ] uložit resizer clientBoundingRect do statu, aby jsme se pořád nedotazoval na velikost, vyvolává layout re-render

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
    primaryPaneMaxSize?: string;

    /**
     * @param {string} group Name of the splitter group. Used when resizing
     */
    group?: string;
    allowResize?: boolean;
    postPoned?: boolean;

    /**
     * @param {function} onDragStart
     */
    onDragStart?: () => void;
    /**
     * @param {function} onDrag
     */
    onDrag?: () => void;
    /**
     * @param {function} onDragEnd
     */
    onDragEnd?: () => void;

    // class names for layout
    layoutClassName?: string;
    primaryPaneClassName?: string;
    secondaryPaneClassName?: string;
    handlebarClassName?: string;
}

interface SplitScreenState {
    primaryPaneSize?: number;
    secondaryPaneSize?: number;
    maxPrimaryPaneSize?: number;
    mouseInResizer?: number;
    postPonedPosition?: number;
    dragging?: boolean;
    pristine?: boolean;
    allowed?: boolean;
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

    constructor(props: SplitScreenProps) {
        super(props);

        this.state = {
            mouseInResizer: 0,
            primaryPaneSize: 0,
            secondaryPaneSize: 0,
            postPonedPosition: 0,
            maxPrimaryPaneSize: 0,
            dragging: false,
            pristine: true,
            allowed: true,
            ratio: {
                paneOne: null
            }
        };
    }

    componentDidMount() {
        // set width of panes
        this.getInitPaneSize();
        this.setMaxWidthOfPrimaryPane();

        // add calculation on resize
        window.addEventListener('resize', this.handleResizeEvent);
        window.addEventListener('RSSStartDragging', this.getPanesRatio);
        window.addEventListener('RSSDragging', (evt: CustomEvent) => this.handleDraggingEvent(evt));
        window.addEventListener('RSSEndDragging', () => console.log('RSSplitter - End dragging'));
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResizeEvent);
        window.removeEventListener('RSSStartDragging', this.getPanesRatio);
        window.removeEventListener('RSSDragging', (evt: CustomEvent) => this.handleDraggingEvent(evt));
        window.removeEventListener('RSSEndDragging', () => console.log('RSSplitter - End dragging'));
    }

    handleMouseDown = (evt: React.MouseEvent<HTMLDivElement>) => {
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
        const { vertical } = this.props;
        const resizerOffset = this.getResizerBoundingClientRect();
        
        if (this.props.vertical) {
            mouseInResizer = evt.clientX - resizerOffset.left;
        } else {
            mouseInResizer = evt.clientY - resizerOffset.top;
        }

        const res = this.getPaneSizesWhileDragging(evt, vertical || false, mouseInResizer);
        // clear selection
        unselect();
        this.setState({
            dragging: true,
            mouseInResizer,
            postPonedPosition: res && res.primaryPaneSize || 0
        });
    }

    handleMouseMove = (evt: MouseEvent) => {
        // clear selection
        unselect();

        const { mouseInResizer } = this.state;
        const { vertical, postPoned } = this.props;
        const res = this.getPaneSizesWhileDragging(evt, vertical || false, mouseInResizer);
        console.log(res);
        if (!res) {
            return;
        }

        if (this.props.primaryPaneMaxSize) {
            if (res.primaryPaneSize > (this.state.maxPrimaryPaneSize || 0)) {
                this.setState({
                    allowed: false
                });
                return;
            }
        }

        const event = new CustomEvent('RSSDragging', {
            detail: {
                vertical,
                group: this.props.group
            }
        });
        window.dispatchEvent(event);

        if (postPoned) {
            this.setState({
                postPonedPosition: res.primaryPaneSize,
                pristine: false,
                allowed: true
            });
        } else {
            this.setState({
                primaryPaneSize: res.primaryPaneSize,
                secondaryPaneSize: res.secondaryPaneSize,
                pristine: false,
                allowed: true
            });
        }
    }

    handleMouseUp = (evt: MouseEvent) => {
        // when button on mouse is released => remove event listeners
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);

        const { vertical, group } = this.props;
        const { mouseInResizer, allowed } = this.state;
        const res = this.getPaneSizesWhileDragging(evt, vertical || false, mouseInResizer);
        const event = new CustomEvent('RSSEndDragging', {
            detail: {
                group: group
            }
        });
        window.dispatchEvent(event);

        // clear selection
        unselect();

        if (!allowed) {
            this.setState({
                dragging: false
            });

            return;
        }

        this.setState({
            dragging: false,
            primaryPaneSize: res && res.primaryPaneSize,
            secondaryPaneSize: res && res.secondaryPaneSize
        });
    }

    togglePrimaryPane = () => {
        this.getInitPaneSize(0, 'px');
    }

    toggleSecondaryPane = () => {
        this.getInitPaneSize(100, '%');
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
            secondaryPaneSize,
            postPonedPosition
        } = this.state;

        let postPonedResizer = {};
        const childrenCount = this.getChildrenCount();
        const layoutClassName = [
            'rss-layout',
            !vertical ? 'rss-horizontal' : null,
            dragging ? 'rss-layout-dragging' : null,
            postPoned && dragging ? 'rss-layout--postponed' : null
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
                [vertical ? 'left' : 'top']: `${postPonedPosition}px`
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
                        {children && children}
                    </SplitPane>
                }

                {
                    postPoned && dragging
                    ? <Resizer
                        style={postPonedResizer}
                        className={`rss-resizer--postponed`}
                    />
                    : null
                }
            </div>
        );
    }

    // get init width of pane (componentDidMount), or call on custom resize event
    getInitPaneSize = (size?: number, ext?: string) => {
        const { primaryPaneInitSize, vertical } = this.props;
        const childrenCount = this.getChildrenCount();
        let initSize = 100;
        let sizeExt = '%';

        if (childrenCount > 1) {
            if (typeof primaryPaneInitSize === 'string') {
                const getSizeAndExt = this.getPropsExt(primaryPaneInitSize);

                // get size in %
                sizeExt = getSizeAndExt.ext;
                // get number from string
                initSize = getSizeAndExt.size;
            } else {
                return console.warn('Please provide string for primaryPaneInitSize prop.');
            }
        }

        // get calculated width of primary pane
        const primaryPaneSize = this.getCalculatedInitSize(typeof size === 'number' ? size : initSize, ext || sizeExt);
        let secondaryPaneSize = 0;

        if (childrenCount > 1) {
            const layoutRect = this.getLayoutBoundingClientRect();
            const resizerRect = this.getResizerBoundingClientRect();

            secondaryPaneSize =
                vertical
                ? layoutRect.width - resizerRect.width - primaryPaneSize
                : layoutRect.height - resizerRect.height - primaryPaneSize;
        }

        this.setState({
            primaryPaneSize,
            secondaryPaneSize
        });
    }

    getCalculatedInitSize = (size: number = 0, type: string = 'px'): number => {
        const { vertical } = this.props;
        const childrenCount = this.getChildrenCount();
        const getSplitterSize = this.getLayoutBoundingClientRect();

        let calculatedSize = 0;
        let resizerSize = 0;

        if (childrenCount > 1) {
            const resizerClientRect = this.getResizerBoundingClientRect();

            if (vertical) {
                resizerSize = resizerClientRect.width;
            } else {
                resizerSize = resizerClientRect.height;
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
    handleDraggingEvent = (evt?: CustomEvent) => {
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

    handleResizeEvent = () => {
        const { pristine } = this.state;
        const ratio = this.getPanesRatio().paneOne;

        if (pristine) {
            return this.getInitPaneSize();
        }

        this.setMaxWidthOfPrimaryPane();
        return this.getInitPaneSize((ratio || 0), '%');
    }

    getPanesRatio = () => {
        // get calculated ratio for later use when resize event is fired
        let resizerSize = 0;
        const { vertical } = this.props;
        const { primaryPaneSize } = this.state;
        const childrenCount = this.getChildrenCount();
        const layoutSize =
            vertical ? this.getLayoutBoundingClientRect().width : this.getLayoutBoundingClientRect().height;

        if (childrenCount > 1) {
            resizerSize =
                vertical ? this.getResizerBoundingClientRect().width : this.getResizerBoundingClientRect().height;
        }

        const ratio = {
            paneOne: (((primaryPaneSize || 0) + (resizerSize / 2)) * 100) / layoutSize
        };

        this.setState({
            ratio
        });

        return ratio;
    }

    getPaneSizesWhileDragging = (evt: any, vertical: boolean, mouseInResizer: number = 0):
    { primaryPaneSize: number, secondaryPaneSize: number } | undefined => {
        let primaryPaneSize = 0;
        let secondaryPaneSize = 0;
        const layoutRect = this.getLayoutBoundingClientRect();
        const resizerRect = this.getResizerBoundingClientRect();

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

        return {
            primaryPaneSize,
            secondaryPaneSize
        };
    }

    setMaxWidthOfPrimaryPane = () => {
        if (!this.props.primaryPaneMaxSize) {
            return;
        }

        const splitMaxWidth = this.getPropsExt(this.props.primaryPaneMaxSize || '');
        const maxPrimaryPaneSize = this.getCalculatedInitSize(splitMaxWidth.size, splitMaxWidth.ext);

        this.setState({
            maxPrimaryPaneSize
        });
    }

    // getters
    getLayoutBoundingClientRect = () => {
        return ReactDOM.findDOMNode(this.layout).getBoundingClientRect();
    }

    getResizerBoundingClientRect = () => {
        return ReactDOM.findDOMNode(this.resizer).getBoundingClientRect();
    }

    getChildrenCount = () => {
        return this.props.children ? React.Children.count(this.props.children) : 0;
    }

    getPropsExt = (textToTest: string): { ext: string, size: number } => {
        const testPX = new RegExp('%', 'gi');
        let sizeExt;

        if (testPX.test(textToTest)) {
            sizeExt = '%';
        } else {
            sizeExt = 'px';
        }

        // TODO: Math.floor()
        const size = parseFloat(textToTest);

        return {
            ext: sizeExt,
            size
        };
    }
}
