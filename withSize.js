import React from 'react';
import ReactDOM from 'react-dom';
import JicklEventTarget from '../JicklEvent/JicklEventTarget';

let resizing = false;
let resizeTimout = null;

const resizeEvents = new JicklEventTarget();

const handleResize = e => {
    if (resizing) {
        resizeTimout && clearTimeout(resizeTimout);
        resizeTimout = setTimeout(() => {
            resizing = false;
            resizeEvents.dispatchEvent('resize', e);
        }, 300);
        return;
    }
    resizing = true;
};

let frame = null;

const handleFullscreenchange = name => e => {
    // console.log(name);
    isAnimating = false;
    clearTimeout(cancelAnimationTimer);
    cancelAnimationTimer = null;
    window.cancelAnimationFrame(frame);
    frame = null;
    resizeEvents.dispatchEvent('resize');
};

let isAnimating = false;

function update() {
    if (!isAnimating) {
        return;
    }
    if (frame) {
        // already
        return;
    }
    // console.log('update');
    resizeEvents.dispatchEvent('resize');
    frame = window.requestAnimationFrame(() => {
        frame = null;
        update();
    });
}

let cancelAnimationTimer = null;

const handleAnimationStart = name => e => {
    if (isAnimating) {
        return;
    }
    isAnimating = true;
    // console.log(name);
    if (!cancelAnimationTimer) {
        cancelAnimationTimer = setTimeout(() => {
            isAnimating = false;
            cancelAnimationTimer = null;
            window.cancelAnimationFrame(frame);
        }, 2000);
    }
    update();
};

window.addEventListener('resize', handleResize);
window.addEventListener('fullscreenchange', handleFullscreenchange('fullscreenchange'));
window.addEventListener('animationstart', handleAnimationStart('animationstart'));
window.addEventListener('animationend', handleFullscreenchange('animationend'));
window.addEventListener('webkitAnimationStart', handleAnimationStart('webkitAnimationStart'));
window.addEventListener('webkitAnimationEnd', handleFullscreenchange('webkitAnimationEnd'));

const withSize = WrappedElement => {
    const mustWrapInDiv = !WrappedElement.prototype.render;
    return class extends React.Component {
        state = {
            clientRect: { width: 0 },
        };

        target = React.createRef();

        render = () => {
            return mustWrapInDiv ? (
                <div ref={this.target}>
                    <WrappedElement {...this.props} {...this.state} />
                </div>
            ) : (
                <WrappedElement ref={this.target} {...this.props} {...this.state} />
            );
        };

        handleResize = () => {
            window.requestAnimationFrame(() => {
                if (!this.target.current) return;

                const node = ReactDOM.findDOMNode(this.target.current);
                try {
                    this.setState({ clientRect: node.getBoundingClientRect() });
                } catch (e) {
                    // console.warn(WrappedElement.name, e);
                }
            });
        };

        componentDidMount = () => {
            this.unbind = resizeEvents.addEventListener('resize', this.handleResize);
            this.handleResize();
        };
        componentWillUnmount = () => {
            this.unbind();
        };
    };
};

export default withSize;
