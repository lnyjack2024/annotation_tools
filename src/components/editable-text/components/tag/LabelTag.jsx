/* eslint-disable no-nested-ternary */
import React from 'react';
import hexToRgba from 'hex-to-rgba';
import { DEFAULT_ALPHA, ACTIVE_ALPHA, HOVER_ALPHA, REJECT_STYLE, FOCUS_TYPE, PASS_STYLE } from '../../store/constant';

const LabelTag = (props) => {
  const { label, isHover, reviewResult, isClick, labelMouseEvent, isDisplay = false } = props;
  let bgColor = hexToRgba(label.bgColor, DEFAULT_ALPHA);
  if (isClick) {
    bgColor = hexToRgba(label.bgColor, ACTIVE_ALPHA);
  } else if (isHover) {
    bgColor = hexToRgba(label.bgColor, HOVER_ALPHA);
  }
  return (
    <div
      className="label-wrapper"
      data-id={label.id}
      data-type={label.type}
      style={isDisplay ? null : {
        position: 'absolute',
        left: label.left,
        top: label.top,
        transform: (label.isArabic ? 'scaleX(-1) translateX(100%)' : null),
        border: reviewResult === 'reject' ? REJECT_STYLE : reviewResult === 'pass' ? PASS_STYLE : null,
      }}
      onContextMenu={(e) => !isDisplay && labelMouseEvent && labelMouseEvent(e, label.type, label.id, FOCUS_TYPE.CLICK, false)}
      onMouseEnter={(e) => !isDisplay && labelMouseEvent && labelMouseEvent(e, label.type, label.id, FOCUS_TYPE.HOVER, true)}
      onMouseLeave={(e) => !isDisplay && labelMouseEvent && labelMouseEvent(e, label.type, label.id, FOCUS_TYPE.HOVER, false)}
      onClick={(e) => !isDisplay && labelMouseEvent && labelMouseEvent(e, label.type, label.id, FOCUS_TYPE.CLICK, true)}
    >
      <div
        className="label-body"
        style={{ background: bgColor, color: label.fontColor }}
      >
        {label.displayName || label.text}
      </div>
      <div className="label-arrow" style={{ borderLeftColor: bgColor }} />
    </div>
  );
};
export default LabelTag;
