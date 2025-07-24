import React from 'react';
import Mousetrap from 'mousetrap';
import cx from 'classnames';
import formatMessage from '../../locales';
import { Pause, CaretRight, Left, Right, DoubleLeft, DoubleRight } from '../../../common/icons';

Mousetrap.addKeycodes({
  188: 'comma',
  190: 'period',
  191: 'slash',
});

interface FrameActionsProps {
  currentFrameValid: boolean;
  frameCount: number;
  frameLoading: boolean;
  currentFrame: number;
  setFrame: (frame: number) => void;
}

interface FrameActionsState {
  frame: string;
  isPlaying: boolean;
}

export default class FrameActions extends React.Component<FrameActionsProps, FrameActionsState> {
  state = {
    frame: '1',
    isPlaying: false,
  };

  playTimer: number | null = null;

  componentDidMount() {
    Mousetrap.bind('comma', () => this.prev(1));
    Mousetrap.bind('period', () => this.next(1));
    Mousetrap.bind('shift+comma', () => this.prev(10));
    Mousetrap.bind('shift+period', () => this.next(10));
    Mousetrap.bind('slash', () => this.togglePlaying());
  }

  componentWillUnmount() {
    Mousetrap.unbind('comma');
    Mousetrap.unbind('period');
    Mousetrap.unbind('shift+comma');
    Mousetrap.unbind('shift+period');
    Mousetrap.unbind('slash');
  }

  componentDidUpdate(prevProps: FrameActionsProps) {
    if (prevProps.currentFrame !== this.props.currentFrame) {
      this.setState({ frame: `${this.props.currentFrame + 1}` });
    }

    if (prevProps.frameLoading !== this.props.frameLoading && !this.props.frameLoading) {
      // frame loaded
      if (this.state.isPlaying) {
        // if is auto playing, play next frame
        this.playTimer = window.setTimeout(() => {
          this.setFrameByAutoPlay();
        }, 300);
      }
    }
  }

  togglePlaying = () => {
    this.setState((stat) => ({ isPlaying: !stat.isPlaying }), () => {
      if (this.state.isPlaying) {
        this.setFrameByAutoPlay();
      } else if (this.playTimer) {
        window.clearTimeout(this.playTimer);
        this.playTimer = null;
      }
    });
  };

  setFrameByAutoPlay = () => {
    const { currentFrame, frameCount, setFrame } = this.props;
    if (currentFrame < frameCount - 1) {
      setFrame(currentFrame + 1);
    } else {
      setFrame(0);
      this.setState({ isPlaying: false });
    }
  };

  prev = (step: number) => {
    if (!this.state.isPlaying) {
      this.props.setFrame(Math.max(this.props.currentFrame - step, 0));
    }
  };

  next = (step: number) => {
    if (!this.state.isPlaying) {
      this.props.setFrame(Math.min(this.props.currentFrame + step, this.props.frameCount - 1));
    }
  };

  input = (e: React.ChangeEvent<HTMLInputElement>) => {
    const str = e.target.value;
    if (!str || /^\d*$/.test(str)) {
      this.setState({ frame: str });
    }
  };

  goto = () => {
    let frame = Number(this.state.frame) - 1;
    if (Number.isNaN(frame) || frame < 0 || frame >= this.props.frameCount) {
      frame = this.props.currentFrame;
    }
    this.props.setFrame(frame);
    this.setState({ frame: `${frame + 1}` });
  };

  render() {
    return (
      <div>
        <div style={{ marginRight: 24, userSelect: 'none' }}>
          {formatMessage('FRAME_LABEL')}
          <input
            className={cx('frame-input', { invalid: !this.props.currentFrameValid })}
            disabled={this.state.isPlaying}
            value={this.state.frame}
            onChange={this.input}
            onBlur={this.goto}
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                this.goto();
              }
            }}
          />
          {`/ ${this.props.frameCount}`}
        </div>
        <div className="frame-action-icon" onClick={() => this.prev(10)}>
          <DoubleLeft />
        </div>
        <div className="frame-action-icon" onClick={() => this.prev(1)}>
          <Left />
        </div>
        <div className="frame-action-icon" onClick={this.togglePlaying}>
          {this.state.isPlaying ? <Pause /> : <CaretRight />}
        </div>
        <div className="frame-action-icon" onClick={() => this.next(1)}>
          <Right />
        </div>
        <div className="frame-action-icon" onClick={() => this.next(10)}>
          <DoubleRight />
        </div>
      </div>
    );
  }
}
