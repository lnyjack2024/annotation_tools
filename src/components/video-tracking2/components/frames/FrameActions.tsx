import React, { useState, useEffect } from 'react';
import { reaction } from 'mobx';
import { observer } from 'mobx-react';
import { Pause, CaretRight, Left, Right, DoubleLeft, DoubleRight } from '../../../common/icons';
import store from '../../store/RootStore';
import i18n from '../../locales';

const FrameActions = observer(() => {
  const [frame, setFrame] = useState('1');

  useEffect(() => {
    const reactionDisposer = reaction(
      () => store.frame.currentFrame,
      (currentFrame) => {
        setFrame(`${currentFrame + 1}`);
      },
    );
    return () => {
      reactionDisposer();
    };
  }, []);

  const input = (e: React.ChangeEvent<HTMLInputElement>) => {
    const str = e.target.value;
    if (!str || /^\d*$/.test(str)) {
      setFrame(str);
    }
  };

  const goto = () => {
    let frameIndex = Number(frame) - 1;
    if (Number.isNaN(frameIndex) || frameIndex < 0 || frameIndex >= store.frame.frameCount) {
      frameIndex = store.frame.currentFrame;
    }
    store.frame.setFrame(frameIndex);
    setFrame(`${frameIndex + 1}`);
  };

  const { isPlaying, frameCount, prev, next, togglePlaying } = store.frame;

  return (
    <div>
      <div style={{ marginRight: 24 }}>
        {i18n.translate('FRAME_LABEL')}
        <input
          className="frame-input"
          disabled={isPlaying}
          value={frame}
          onChange={input}
          onBlur={goto}
          onKeyUp={(e) => {
            if (e.key === 'Enter') {
              goto();
            }
          }}
        />
        {`/ ${frameCount}`}
      </div>
      <div className="frame-action-icon" onClick={() => prev(10)}>
        <DoubleLeft />
      </div>
      <div className="frame-action-icon" onClick={() => prev(1)}>
        <Left />
      </div>
      <div className="frame-action-icon" onClick={togglePlaying}>
        {isPlaying ? <Pause /> : <CaretRight />}
      </div>
      <div className="frame-action-icon" onClick={() => next(1)}>
        <Right />
      </div>
      <div className="frame-action-icon" onClick={() => next(10)}>
        <DoubleRight />
      </div>
    </div>
  );
});

export default FrameActions;
