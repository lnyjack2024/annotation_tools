/* eslint-disable no-nested-ternary */
import React from 'react';
import hexToRgba from 'hex-to-rgba';
import { DEFAULT_ALPHA, HOVER_ALPHA, ACTIVE_ALPHA, CONNECTION_DIR, REJECT_STYLE, FOCUS_TYPE, PASS_STYLE } from '../../store/constant';

const ConnectionTag = (props) => {
  const { connection, isHover, reviewResult, isClick, connectionMouseEvent } = props;

  let bgColor = hexToRgba(connection.bgColor, DEFAULT_ALPHA);
  if (isClick) {
    bgColor = hexToRgba(connection.bgColor, ACTIVE_ALPHA);
  } else if (isHover) {
    bgColor = hexToRgba(connection.bgColor, HOVER_ALPHA);
  }
  return (
    <div
      className="connection-wrapper"
      data-id={connection.id}
      data-type={connection.type}
      style={{
        left: connection.left,
        top: connection.top,
        border: reviewResult === 'reject' ? REJECT_STYLE : reviewResult === 'pass' ? PASS_STYLE : null,
      }}
      onMouseEnter={(e) => connectionMouseEvent(e, connection.type, connection.id, FOCUS_TYPE.HOVER, true)}
      onMouseLeave={(e) => connectionMouseEvent(e, connection.type, connection.id, FOCUS_TYPE.HOVER, false)}
      onClick={(e) => connectionMouseEvent(e, connection.type, connection.id, FOCUS_TYPE.CLICK, true)}
      onContextMenu={(e) => connectionMouseEvent(e, connection.type, connection.id, FOCUS_TYPE.CLICK, false)}
    >
      <div
        className="connection-arrow"
        style={{
          borderColor: connection.dir === CONNECTION_DIR.LEFT ?
            `${bgColor} ${bgColor} ${bgColor} transparent` :
            `transparent ${bgColor} transparent transparent `,
        }}
      />
      <div
        className="connection-body"
        style={{
          paddingLeft: connection.dir === CONNECTION_DIR.LEFT ? '0px' : '5px',
          paddingRight: connection.dir === CONNECTION_DIR.LEFT ? '5px' : '0px',
          background: bgColor,
          color: connection.fontColor,
        }}
      >
        {connection.displayName || connection.text}
      </div>
      <div
        className="connection-arrow"
        style={{
          borderColor: connection.dir === CONNECTION_DIR.LEFT ?
            `transparent transparent transparent ${bgColor}` :
            `${bgColor} transparent ${bgColor} ${bgColor} `
        }}
      />
    </div>
  );
};
export default ConnectionTag;
