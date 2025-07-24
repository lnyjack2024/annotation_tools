import React, { useState } from 'react';
import { observer } from 'mobx-react';
import cx from 'classnames';
import { Up } from '../../../common/icons';
import store from '../../store/RootStore';
import i18n from '../../locales';

const GlobalInfo = observer(() => {
  const [collapsed, setCollapsed] = useState(false);

  const { currentFrame, frameCount, isSingleCamera, cameraCount } = store.frame;
  const { instances } = store.instance;

  let instanceCount = 0;
  let shapesCount = 0;
  let currentShapesCount = 0;
  Object.values(instances).forEach(({ isEmpty, items }) => {
    if (!isEmpty) {
      instanceCount += 1;
      Object.values(items).forEach(({ cameras }) => {
        Object.values(cameras).forEach(({ frames }) => {
          shapesCount += Object.keys(frames).length;
          if (frames[currentFrame]) {
            currentShapesCount += 1;
          }
        });
      });
    }
  });

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
        {i18n.translate('GLOBAL_INFO')}
      </div>
      {store.initialized && (
        <div className="collapse-panel-content">
          <div>{i18n.translate('GLOBAL_INFO_FRAME', { values: { frame: currentFrame + 1, count: frameCount } })}</div>
          {!isSingleCamera && (
            <div className="value-item">
              <div className="value-item-label">{i18n.translate('GLOBAL_INFO_CAMERA')}</div>
              <div className="value-item-value">{i18n.translate('GLOBAL_INFO_CAMERA_COUNT', { values: { count: cameraCount } })}</div>
            </div>
          )}
          <div className="value-item">
            <div className="value-item-label">{i18n.translate('GLOBAL_INFO_INSTANCE')}</div>
            <div className="value-item-value">{i18n.translate('GLOBAL_INFO_INSTANCE_COUNT', { values: { count: instanceCount } })}</div>
          </div>
          <div className="value-item">
            <div className="value-item-label">{i18n.translate('GLOBAL_INFO_SHAPE')}</div>
            <div className="value-item-value">{i18n.translate('GLOBAL_INFO_SHAPE_COUNT', { values: { count: shapesCount } })}</div>
          </div>
          {frameCount > 1 && (
            <div className="value-item">
              <div className="value-item-label">{i18n.translate('GLOBAL_INFO_SHAPE_FRAME')}</div>
              <div className="value-item-value">{i18n.translate('GLOBAL_INFO_SHAPE_FRAME_COUNT', { values: { count: currentShapesCount } })}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default GlobalInfo;
