import React from 'react';
import { observer } from 'mobx-react';
import store from '../../store/RootStore';
import i18n from '../../locales';
import InstanceItem from '../../model/InstanceItem';

interface ShapeInfoProps {
  instanceItem?: InstanceItem;
}

const ShapeInfo = observer(({ instanceItem }: ShapeInfoProps) => {
  if (!instanceItem) {
    return null;
  }

  const { currentCamera, currentFrame } = store.frame;
  const frameData = instanceItem.cameras[currentCamera]?.frames[currentFrame];
  if (!frameData) {
    return (
      <>{i18n.translate('INSTANCE_INFO_ITEM_EMPTY')}</>
    );
  }

  const { shapeType } = frameData;
  return (
    <div className="value-item">
      <div className="value-item-label">{i18n.translate('SHAPE_ATTRIBUTES_TYPE')}</div>
      <div className="value-item-value">{i18n.translate(`SHAPE_${shapeType.toUpperCase()}`)}</div>
    </div>
  );
});

export default ShapeInfo;
