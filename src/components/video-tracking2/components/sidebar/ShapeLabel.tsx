import React from 'react';
import { observer } from 'mobx-react';
import ShapeIcon from './ShapeIcon';
import InstanceItem from '../../model/InstanceItem';
import store from '../../store/RootStore';

const ShapeLabel = observer(({ item, camera, label, cameraIndex = 0 }: {
  item: InstanceItem;
  camera: string;
  cameraIndex?: number;
  label?: string;
}) => {
  const cameraData = item.cameras[camera];
  if (!cameraData) {
    return null;
  }

  const { currentFrame, isSingleCamera } = store.frame;
  const { frames, getNearestKeyFrame } = cameraData;
  const currentFrameData = frames[currentFrame];
  const frame = currentFrameData ? currentFrame : getNearestKeyFrame(currentFrame);
  const frameData = frames[frame];
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div
        className="sidebar-category-instance__item-icon"
        style={{ color: item.categoryItemRef.displayColor }}
      >
        <ShapeIcon shapeType={frameData?.shapeType} />
      </div>
      <div className="sidebar-category-instance__item-label">
        {`${label || item.itemLabel}${isSingleCamera ? '' : `-C${cameraIndex + 1}`}`}
      </div>
    </div>
  );
});

export default ShapeLabel;
