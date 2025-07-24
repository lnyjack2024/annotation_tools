/* eslint-disable no-nested-ternary */
import React from 'react';
import hexToRgba from 'hex-to-rgba';
import { DEFAULT_ALPHA, HOVER_ALPHA, ACTIVE_ALPHA, REJECT_STYLE, FOCUS_TYPE, PASS_STYLE } from '../../store/constant';

const InsertionTag = (props) => {
  const { insertion, isHover, isClick, reviewResult, insertionMouseEvent } = props;

  let bgColor = hexToRgba(insertion.bgColor, DEFAULT_ALPHA);
  if (isClick) {
    bgColor = hexToRgba(insertion.bgColor, ACTIVE_ALPHA);
  } else if (isHover) {
    bgColor = hexToRgba(insertion.bgColor, HOVER_ALPHA);
  }

  return (
    <div
      className="insertion-wrapper"
      data-id={insertion.id}
      data-type={insertion.type}
      style={{
        left: insertion.left,
        top: insertion.top,
        border: reviewResult === 'reject' ? REJECT_STYLE : reviewResult === 'pass' ? PASS_STYLE : null,
      }}
      onMouseEnter={(e) => insertionMouseEvent(e, insertion.type, insertion.id, FOCUS_TYPE.HOVER, true)}
      onMouseLeave={(e) => insertionMouseEvent(e, insertion.type, insertion.id, FOCUS_TYPE.HOVER, false)}
      onClick={(e) => insertionMouseEvent(e, insertion.type, insertion.id, FOCUS_TYPE.CLICK, true)}
      onContextMenu={(e) => insertionMouseEvent(e, insertion.type, insertion.id, FOCUS_TYPE.CLICK, false)}
    >
      <div className="insertion-arrow" style={{ borderBottom: `5px solid ${bgColor}` }} />
      <div
        className="insertion-body"
        style={{ background: bgColor, color: insertion.fontColor }}
      >
        {insertion.displayName || insertion.text}
      </div>
    </div>
  );
};
export default InsertionTag;
