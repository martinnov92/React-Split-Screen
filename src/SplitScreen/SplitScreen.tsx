import * as React from 'react';
import SplitPane from './SplitPane';
// import { unselect } from './';
import './index.css';

// [ ] funkční resize
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

    // class names for layout
    layoutClassName?: string;
    primaryPaneClassName?: string;
    secondaryPaneClassName?: string;
    handlebarClassName?: string;
}

interface SplitScreenState {

}

export default class SplitScreen extends React.Component<SplitScreenProps, SplitScreenState> {
    static defaultProps = {
        vertical: true
    };

    constructor() {
        super();

        this.state = {

        };
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

        return (
            <div
                className={layoutClassName}
            >
                {
                    children && childrenCount > 1
                    ? [
                        <SplitPane key={'pane-1'}>{children[0]}</SplitPane>,
                        <div key={'rss-resizer'} className={`rss-resizer`}>
                            <div className="rss-resizer--drag" />
                        </div>,
                        <SplitPane key={'pane-2'}>{children[1]}</SplitPane>
                    ]
                    : <SplitPane>{children && children[0]}</SplitPane>
                }
            </div>
        );
    }
}
