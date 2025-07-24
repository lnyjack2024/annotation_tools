import React, { useState } from 'react';
import { observer } from 'mobx-react';
import cx from 'classnames';
import { CaretDownOutlined, PlusCircleFilled } from '@ant-design/icons';
import CameraInstanceItemList from './CameraInstanceItemList';
import InstanceItemMenu from './InstanceItemMenu';
import InstanceItemReviewIcon from './InstanceItemReviewIcon';
import ShapeLabel from './ShapeLabel';
import Instance from '../../model/Instance';
import store from '../../store/RootStore';

interface SidebarInstanceProps {
  instance: Instance;
}

const SidebarInstance = observer(({ instance }: SidebarInstanceProps) => {
  const [hovered, setHovered] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: -1, y: -1 });

  const collapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    instance.setCollapsed(!instance.collapsed);
  };

  const { currentCamera, currentFrame, isSingleCamera, cameraNames } = store.frame;
  const isSingle = instance.isSingle && isSingleCamera;
  const isHidden = instance.frameStatus[currentFrame] === undefined;
  const isSelected = isSingle ? instance.selected : instance.selected && store.instance.selectedInstanceItems.filter((item) => item.instance).length <= 0;
  return (
    <div
      id={`sidebar-category-instance-${instance.id}`}
      className="sidebar-category-instance"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={cx('sidebar-category-instance__label', {
          single: isSingle,
          hidden: isHidden,
          selected: isSelected,
        })}
        onMouseDown={() => {
          if (!isSingle) {
            store.instance.selectInstanceItem(null);
          }
          store.instance.selectInstance(instance, true);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          store.instance.selectInstance(instance);
          if (isSingle && !isHidden) {
            setMenuPosition({ x: e.clientX, y: e.clientY });
            setMenuVisible(true);
          }
        }}
      >
        {isSingle ? (
          <ShapeLabel item={Object.values(instance.items)[0]} camera={currentCamera} label={instance.label} />
        ) : <div>{instance.label}</div>}
        <div className="sidebar-category-action">
          {!isSingle && (
            <CaretDownOutlined
              className="sidebar-category-icon"
              style={{
                transform: instance.collapsed ? 'rotate(270deg)' : '',
              }}
              onClick={collapse}
            />
          )}
          {!store.readonly && isSingle && isHidden && hovered && (
            <PlusCircleFilled
              style={{ cursor: 'pointer' }}
              onClick={() => store.addToCurrentFrame(Object.values(instance.items)[0])}
            />
          )}
          {!store.isLabeling && isSingle && !isHidden && (
            <InstanceItemReviewIcon item={Object.values(instance.items)[0]} camera={currentCamera} />
          )}
        </div>
      </div>
      {!instance.collapsed && !isSingle && (
        <div>
          {cameraNames.map((c, i) => (
            <CameraInstanceItemList key={c} instance={instance} camera={c} cameraIndex={i} />
          ))}
        </div>
      )}
      {isSingle && (
        <InstanceItemMenu
          instanceItem={Object.values(instance.items)[0]}
          camera={currentCamera}
          position={menuPosition}
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
        />
      )}
    </div>
  );
});

export default SidebarInstance;
