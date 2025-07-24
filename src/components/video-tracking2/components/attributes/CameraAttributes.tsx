import React, { useState } from 'react';
import { observer } from 'mobx-react';
import cx from 'classnames';
import { Up, Pencil } from '../../../common/icons';
import FrameAttributes from './FrameAttributes';
import store from '../../store/RootStore';
import i18n from '../../locales';

const CameraAttributes = observer(() => {
  const [collapsed, setCollapsed] = useState(false);

  const { currentFrame, isSingleCamera, cameraNames, frameConfig, attributes } = store.frame;
  let valid = true;

  for (let index = 0; index < cameraNames.length; index += 1) {
    const item = cameraNames[index];
    const itemValid = attributes[item]?.[currentFrame]?.originValid !== false;
    if (!itemValid) {
      valid = false;
      break;
    }
  }
  if (!frameConfig && valid) {
    return null;
  }

  return (
    <div
      className={cx('collapse-panel', {
        collapsed,
      })}
    >
      <div
        className="collapse-panel-title space-between"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span>
          <div className="collapse-panel-collapse-icon">
            <Up />
          </div>
          {i18n.translate('CAMERA_ATTRIBUTES', { values: { frame: currentFrame + 1 } })}
        </span>
        <span>
          {isSingleCamera && !store.readonly && frameConfig && (
            <div
              className="collapse-panel-icon"
              onClick={(e) => {
                e.stopPropagation();
                store.config.setFrameAttributesModalVisible(true);
              }}
            >
              <Pencil />
            </div>
          )}
        </span>
      </div>
      <div
        className="collapse-panel-content"
        style={{ paddingBottom: 0 }}
      >
        {cameraNames.map((cameraName, index) => (
          <FrameAttributes
            key={cameraName}
            camera={cameraName}
            cameraIndex={index}
          />
        ))}
      </div>
    </div>
  );
});

export default CameraAttributes;
