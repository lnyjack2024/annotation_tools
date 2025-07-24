import React from 'react';
import cx from 'classnames';
import store from '../../store/RootStore';
import formatMessage from '../../locales';
import './index.scss';

interface FrameAttributesProps {
  currentFrame: number;
  currentFrameValid: boolean;
  setFrameValid: (frame: number, valid: boolean) => void;
}

const FrameAttributes = ({
  currentFrame,
  currentFrameValid,
  setFrameValid,
}: FrameAttributesProps) => (
  <div className="frame-attributes-panel panel">
    <div className="title">
      <div>{formatMessage('FRAME_ATTRIBUTES')}</div>
      <div>{formatMessage('FRAME_ATTRIBUTES_FRAME', { values: { frame: currentFrame + 1 } })}</div>
    </div>
    <div className="valid-switch">
      <div
        className={cx('', {
          disabled: store.review.readonly,
          active: currentFrameValid,
          invalid: !currentFrameValid,
        })}
        onClick={() => setFrameValid(currentFrame, true)}
      >
        {formatMessage('FRAME_ATTRIBUTES_VALID')}
      </div>
      <div
        className={cx('', {
          disabled: store.review.readonly,
          active: !currentFrameValid,
          invalid: !currentFrameValid,
        })}
        onClick={() => setFrameValid(currentFrame, false)}
      >
        {formatMessage('FRAME_ATTRIBUTES_INVALID')}
      </div>
    </div>
  </div>
);

export default FrameAttributes;
