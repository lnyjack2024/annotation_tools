import React from 'react';
import { CloseOutlined } from '@ant-design/icons';
import './Modal.scss';

interface ImagePreviewProps {
  src: string;
  maskClosable?: boolean;
  onClose: () => void;
}

const ImagePreview = ({ src, maskClosable, onClose }: ImagePreviewProps) => (
  <div className="annotation-tools-mask image-preview">
    <div className="close" onClick={onClose}>
      <CloseOutlined />
    </div>
    <div
      className="image-preview-img"
      onClick={(e) => {
        if ((e.target as HTMLElement)?.getAttribute('class') === 'image-preview-img') {
          e.preventDefault();
          if (maskClosable) {
            onClose();
          }
        }
      }}
    >
      <img alt="preview" src={src} />
    </div>
  </div>
);

export default ImagePreview;
