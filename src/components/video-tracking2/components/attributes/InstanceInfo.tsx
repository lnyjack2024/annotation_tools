import React, { useState } from 'react';
import { observer } from 'mobx-react';
import cx from 'classnames';
import { Up } from '../../../common/icons';
import ShapeInfo from './ShapeInfo';
import store from '../../store/RootStore';
import i18n from '../../locales';
import Instance from '../../model/Instance';
import InstanceItem from '../../model/InstanceItem';

const InstanceInfo = observer(({ instance, instanceItem }: {
  instance: Instance;
  instanceItem?: InstanceItem;
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const renderInstanceCamera = () => {
    const { currentCamera, cameraNames } = store.frame;
    const cameraIndex = cameraNames.indexOf(currentCamera);
    return (
      <>
        <div className="divider" />
        <div className="value-item">
          <div className="value-item-label">{i18n.translate('INSTANCE_INFO_INSTANCE_CAMERA_RELATED')}</div>
          <div className="value-item-value">{i18n.translate('INSTANCE_INFO_INSTANCE_CAMERA_RELATED_COUNT', { values: { count: instance.existedCameras.length } })}</div>
        </div>
        <div className="value-item">
          <div className="value-item-label">{i18n.translate('INSTANCE_INFO_INSTANCE_CAMERA_CURRENT')}</div>
          <div className="value-item-value">{`C${cameraIndex + 1}-${currentCamera}`}</div>
        </div>
      </>
    );
  };

  const { currentFrame, isSingleCamera } = store.frame;
  const showInstance = !instanceItem || instance.isSingle;
  return (
    <div
      className={cx('collapse-panel', {
        collapsed,
      })}
    >
      <div className="collapse-panel-title" onClick={() => setCollapsed(!collapsed)}>
        <div className="collapse-panel-collapse-icon">
          <Up />
        </div>
        {i18n.translate(showInstance ? 'INSTANCE_INFO_INSTANCE' : 'INSTANCE_INFO_ITEM')}
      </div>
      <div className="collapse-panel-content">
        {showInstance && (
          <>
            <div className="instance-label">
              <div
                className="instance-label-dot"
                style={{ backgroundColor: instance.categoryRef.displayColor }}
              />
              {instance.label}
            </div>
            <div>
              {i18n.translate('INSTANCE_INFO_INSTANCE_CAMERA_SUMMARY', {
                values: {
                  frame: currentFrame + 1,
                  count: Object.keys(instance.frameStatus).length,
                },
              })}
            </div>
            {!isSingleCamera && renderInstanceCamera()}
            {instanceItem && <div className="divider" />}
          </>
        )}
        <ShapeInfo instanceItem={instanceItem} />
      </div>
    </div>
  );
});

export default InstanceInfo;
