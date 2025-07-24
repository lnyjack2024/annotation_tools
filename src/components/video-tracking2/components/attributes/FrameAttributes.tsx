import React, { useMemo, useRef } from 'react';
import { observer } from 'mobx-react';
import cx from 'classnames';
import { parseFields } from '../../utils';
import { Pencil } from '../../../common/icons';
import AttributeValueItem from './AttributeValueItem';
import store from '../../store/RootStore';
import './FrameAttributes.scss';

const FrameAttributes = observer((
  { camera, cameraIndex }:
  {
    camera: string;
    cameraIndex: number;
  }
) => {
  const ref = useRef<HTMLDivElement>(null);
  const fieldsMap = useMemo(() => parseFields(store.frame.frameConfig), [store.frame.frameConfig]);
  const { currentCamera, currentFrame, isSingleCamera, attributes, frameConfig } = store.frame;
  const { attributes: frameAttributes = {} } = attributes[camera]?.[currentFrame] || {};
  const fieldKeys = Object.keys(fieldsMap);

  const attrKeys = Object.keys(frameAttributes);
  const legacyKeys = attrKeys.filter((key) => !fieldKeys.includes(key));

  return (
    <div
      ref={ref}
      className={cx('frame-attributes', {
        selected: !isSingleCamera && currentCamera === camera,
      })}
    >
      {!isSingleCamera && frameConfig && (
        <div className="title">
          {`C${cameraIndex + 1}-${camera}`}
          {!store.readonly && (
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
        </div>
      )}
      {
        [...fieldKeys, ...legacyKeys].map((key) => attrKeys.includes(key) && (
          <AttributeValueItem
            key={key}
            fieldName={key}
            fieldsMap={fieldsMap}
            values={frameAttributes}
          />
        ))
      }
    </div>
  );
});

export default FrameAttributes;
