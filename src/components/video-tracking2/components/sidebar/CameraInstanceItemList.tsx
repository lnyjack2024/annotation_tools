import React from 'react';
import { observer } from 'mobx-react';
import CameraInstanceItem from './CameraInstanceItem';
import Instance from '../../model/Instance';

interface CameraInstanceItemListProps {
  instance: Instance;
  camera: string;
  cameraIndex: number;
}

const CameraInstanceItemList = observer(({ instance, camera, cameraIndex }: CameraInstanceItemListProps) => {
  const { children } = instance.categoryRef;
  const items = Object.values(instance.items)
    .filter((item) => (
      item.cameras[camera] !== undefined &&
      Object.keys(item.cameras[camera].frames).length > 0
    ))
    .sort((a, b) => {
      const aIndex = children.findIndex((c) => c.name === a.name);
      const bIndex = children.findIndex((c) => c.name === b.name);
      if (aIndex < bIndex) {
        return -1;
      }
      if (aIndex > bIndex) {
        return 1;
      }
      return a.number - b.number;
    });
  if (items.length <= 0) {
    return null;
  }
  return (
    <div
      className="sidebar-category-instance__camera"
    >
      {items.map((item) => (
        <CameraInstanceItem
          key={item.id}
          item={item}
          camera={camera}
          cameraIndex={cameraIndex}
        />
      ))}
    </div>
  );
});

export default CameraInstanceItemList;
