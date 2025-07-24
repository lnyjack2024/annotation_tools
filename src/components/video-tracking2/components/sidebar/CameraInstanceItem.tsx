import React, { useState } from 'react';
import { observer } from 'mobx-react';
import cx from 'classnames';
import { PlusCircleFilled } from '@ant-design/icons';
import ShapeLabel from './ShapeLabel';
import InstanceItemMenu from './InstanceItemMenu';
import InstanceItemReviewIcon from './InstanceItemReviewIcon';
import InstanceItem from '../../model/InstanceItem';
import store from '../../store/RootStore';

interface CameraInstanceItemProps {
  item: InstanceItem;
  camera: string;
  cameraIndex: number;
}

const CameraInstanceItem = observer(({ item, camera, cameraIndex }: CameraInstanceItemProps) => {
  const [hovered, setHovered] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: -1, y: -1 });

  const { currentCamera, currentFrame } = store.frame;
  const { frames } = item.cameras[camera];
  const currentFrameData = frames[currentFrame];
  const isHidden = !currentFrameData;
  return (
    <>
      <div
        className={cx('sidebar-category-instance__item', {
          hidden: isHidden,
          selected: item.selected && currentCamera === camera,
        })}
        onMouseDown={() => {
          store.instance.selectInstanceItem(item, true);
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onContextMenu={(e) => {
          e.preventDefault();
          store.instance.selectInstanceItem(item);
          if (!isHidden) {
            setMenuPosition({ x: e.clientX, y: e.clientY });
            setMenuVisible(true);
          }
        }}
      >
        <ShapeLabel item={item} camera={camera} cameraIndex={cameraIndex} />
        <div className="sidebar-category-action">
          {!store.readonly && isHidden && hovered && (
            <PlusCircleFilled
              style={{ cursor: 'pointer' }}
              onClick={() => store.addToCurrentFrame(item, camera)}
            />
          )}
          {!store.isLabeling && !isHidden && (
            <InstanceItemReviewIcon item={item} camera={camera} />
          )}
        </div>
      </div>
      <InstanceItemMenu
        instanceItem={item}
        camera={camera}
        position={menuPosition}
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />
    </>
  );
});

export default CameraInstanceItem;
