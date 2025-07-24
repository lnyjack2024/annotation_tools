import React, { useEffect, useState } from 'react';
import { Input } from 'antd';
import ShapeMenu from '../../../common/sidebar/ShapeMenu';
import InstanceItem from '../../model/InstanceItem';
import store from '../../store/RootStore';
import i18n from '../../locales';

interface InstanceItemMenuProps {
  instanceItem: InstanceItem;
  camera: string;
  position: { x: number; y: number };
  visible: boolean;
  onClose: () => void;
}

const InstanceItemMenu = ({ instanceItem, camera, position, visible, onClose }: InstanceItemMenuProps) => {
  const [showRange, setShowRange] = useState(false);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  useEffect(() => {
    if (showRange) {
      const { currentFrame } = store.frame;
      setStart(`${currentFrame + 1}`);
      setEnd(`${currentFrame + 1}`);
    }
  }, [showRange]);

  const deleteByType = (type?: 'key' | 'following' | 'all') => {
    store.instance.deleteFramesFromInstanceItemByType(instanceItem, type, camera);
  };

  const deleteByRange = () => {
    const startFrame = Number(start) - 1;
    const endFrame = Number(end) - 1;
    const frames = Array.from({ length: endFrame - startFrame + 1 }).map((_, i) => startFrame + i);
    store.instance.deleteFramesFromInstanceItem(instanceItem, frames, camera);
    setShowRange(false);
  };

  const fixStart = () => {
    const startFrame = Number(start) - 1;
    if (startFrame >= store.frame.frameCount) {
      setStart(`${store.frame.frameCount}`);
    }
  };

  const fixEnd = () => {
    const startFrame = Number(start) - 1;
    const endFrame = Number(end) - 1;
    if (endFrame < startFrame) {
      setEnd(start);
    } else if (endFrame > store.frame.frameCount) {
      setEnd(`${store.frame.frameCount}`);
    }
  };

  const menuItems = [
    [
      { label: i18n.translate('DELETE_CURRENT_FRAME'), disabled: store.readonly, onClick: () => deleteByType() },
      { label: i18n.translate('DELETE_FOLLOWING_FRAMES_UNTIL_KEY'), disabled: store.readonly, onClick: () => deleteByType('key') },
      { label: i18n.translate('DELETE_FOLLOWING_FRAMES'), disabled: store.readonly, onClick: () => deleteByType('following') },
      { label: i18n.translate('DELETE_RANGE_FRAMES'), disabled: store.readonly, onClick: () => setShowRange(true) },
      { label: i18n.translate('DELETE_ALL_FRAMES'), disabled: store.readonly, onClick: () => deleteByType('all') },
    ],
  ];
  return (
    <>
      {visible && (
        <ShapeMenu position={position} items={menuItems} onClose={onClose} />
      )}
      {showRange && (
        <div className="shape-menu-mask">
          <div className="shape-menu-popover">
            <div className="shape-menu-popover__title">
              {i18n.translate('DELETE_RANGE_FRAMES')}
            </div>
            <div className="shape-menu-popover__content">
              <div style={{ paddingBottom: 8 }}>
                {i18n.translate('DELETE_RANGE_FRAMES_INFO')}
              </div>
              <div>
                {i18n.translate('DELETE_RANGE_FRAMES_FROM')}
                {i18n.translate('DELETE_RANGE_FRAMES_NO')}
                <Input
                  size="small"
                  value={start}
                  onChange={(e) => {
                    const { value } = e.target;
                    if (!value || /^[1-9]\d*$/.test(value)) {
                      setStart(value);
                    }
                  }}
                  onBlur={fixStart}
                />
                {i18n.translate('DELETE_RANGE_FRAMES_FRAME')}
                {i18n.translate('DELETE_RANGE_FRAMES_TO')}
                {i18n.translate('DELETE_RANGE_FRAMES_NO')}
                <Input
                  size="small"
                  value={end}
                  onChange={(e) => {
                    const { value } = e.target;
                    if (!value || /^[1-9]\d*$/.test(value)) {
                      setEnd(value);
                    }
                  }}
                  onBlur={fixEnd}
                />
                {i18n.translate('DELETE_RANGE_FRAMES_FRAME')}
              </div>
            </div>
            <div className="shape-menu-popover__action">
              <div className="shape-menu-popover__btn" onClick={() => setShowRange(false)}>
                {i18n.translate('COMMON_CANCEL')}
              </div>
              <div className="shape-menu-popover__btn save" onClick={deleteByRange}>
                {i18n.translate('COMMON_OK')}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InstanceItemMenu;
