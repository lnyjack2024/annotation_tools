import React from 'react';
import { connect } from 'react-redux';
import './Guider.scss';
import { translate } from '../../../constants';
import RightMouseIcon from '../../common/Icons/RightMouseIcon';
import LeftMouseIcon from '../../common/Icons/LeftMouseIcon';
import MouseScrollIcon from '../../common/Icons/MouseScrollIcon';
import MouseDragIcon from '../../common/Icons/MouseDragIcon';

const Guider = ((props) => (
  <div className="guider-container" style={{ visibility: props.isGuiding ? 'visible' : 'hidden' }}>
    <ShortcutItem shortcut="Q" description="QTip" />
    <ShortcutItem shortcut="E" description="ETip" />
    <ShortcutItem shortcut="&nbsp;SPACE&nbsp;" description="whitespaceTip" />
    <ShortcutItem shortcut="←" description="leftTip" />
    <ShortcutItem shortcut="→" description="rightTip" />
    <ShortcutItem shortcut={<MouseScrollIcon />} description="mouseWheelTip" />
    <ShortcutItem shortcut={<LeftMouseIcon />} description="leftMouseLineTip" />
    <ShortcutItem shortcut={<LeftMouseIcon />} description="leftMouseCtrlTip" alt />
    <ShortcutItem shortcut="Delete/Backspace" description="clearAll" ctrl />
    <ShortcutItem shortcut="Z" description="undoTip" ctrl />
    <ShortcutItem shortcut="Y" description="redoTip" ctrl />
    <ShortcutItem shortcut="S" description="save" ctrl />
    <h2>{translate('SEGMENT_MODE_CONTINUOUS')}</h2>
    <ShortcutItem shortcut="S" description="STip" />
    <ShortcutItem shortcut="D" description="DTip" />
    <ShortcutItem shortcut={<RightMouseIcon />} description="rightMouseTip" />
    <h2>{translate('SEGMENT_MODE_INDIVIDUAL')}</h2>
    <ShortcutItem shortcut={<MouseDragIcon />} description="dragTip" />
    <ShortcutItem shortcut={<MouseDragIcon />} description="dragAltTip" alt />
    <ShortcutItem shortcut="＜" description="startLeftTip" shift />
    <ShortcutItem shortcut="＞" description="startRightTip" shift />
    <ShortcutItem shortcut="＜" description="endLeftTip" ctrl command />
    <ShortcutItem shortcut="＞" description="endRightTip" ctrl command />
  </div>
));

const ShortcutItem = ((props) => (
  <div className="shortcut-item">
    {(typeof props.shortcut === 'string' || props.ctrl || props.alt || props.shift) && (
      <div className="shortcut-icon">
        {props.ctrl && (props.command ? ' Ctrl/Command ' : ' Ctrl ') }
        {props.alt && ' Alt '}
        {props.shift && ' Shift '}
        {typeof props.shortcut === 'string' && (props.ctrl || props.alt || props.shift ? `+ ${props.shortcut}` : props.shortcut)}
      </div>
    )}
    {typeof props.shortcut !== 'string' && props.shortcut && (
      <>
        {(props.ctrl || props.alt || props.shift) && <span>&nbsp;&nbsp;+&nbsp;&nbsp;</span>}
        {props.shortcut}
      </>
    )}
    <div className="shortcut-description">
      {translate(props.description)}
    </div>
  </div>
));

const mapStateToProps = (state) => ({
  isGuiding: state.isGuiding,
});
const mapDispatchToProps = {
};
export default connect(mapStateToProps, mapDispatchToProps)(Guider);
