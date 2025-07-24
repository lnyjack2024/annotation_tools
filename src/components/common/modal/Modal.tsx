import React from 'react';
import cx from 'classnames';
import Draggable from 'react-draggable';
import { CloseOutlined } from '@ant-design/icons';
import './Modal.scss';

const getPosition = (dragId?: string) => {
  try {
    const position = JSON.parse(localStorage.getItem(dragId || 'modal-posistion') || '{}');
    return { x: position.x || 0, y: position.y || 0 };
  } catch (error) {
    return { x: 0, y: 0 };
  }
};
const savePosition = (x: number, y: number, dragId?: string) => {
  localStorage.setItem(dragId || 'modal-posistion', JSON.stringify({ x, y }));
};

interface ModalProps {
  children: React.ReactNode;
  visible: boolean;
  draggable?: boolean;
  dragId?: string;
  title?: string;
  className?: string;
  closable?: boolean;
  maskClosable?: boolean;
  onClose: () => void;
  onMaskClick?: () => void;
}

class Modal extends React.PureComponent<ModalProps> {
  renderContent() {
    const { className, title, closable, onClose, children } = this.props;
    return (
      <div className={`annotation-tools-modal ${className}`}>
        <div className="title">
          {title}
          {closable !== false && (
            <div className="close" onClick={onClose}>
              <CloseOutlined />
            </div>
          )}
        </div>
        <div className="content">
          {children}
        </div>
      </div>
    );
  }

  render() {
    const { visible, draggable, dragId, maskClosable, onClose, onMaskClick } = this.props;
    return visible && (
      <div className={cx('annotation-tools-mask', { draggable })}>
        <div
          className="annotation-tools-layer"
          onClick={(e) => {
            e.preventDefault();
            if (onMaskClick) {
              onMaskClick();
            }
            if (maskClosable) {
              onClose();
            }
          }}
        />
        {draggable ? (
          <Draggable
            handle=".title"
            bounds="parent"
            defaultPosition={getPosition(dragId)}
            onStop={(_, data) => savePosition(data.x, data.y, dragId)}
          >
            {this.renderContent()}
          </Draggable>
        ) : this.renderContent()}
      </div>
    );
  }
}

export default Modal;
