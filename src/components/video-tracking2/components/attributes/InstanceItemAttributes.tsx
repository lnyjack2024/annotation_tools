import React, { useRef } from 'react';
import { observer } from 'mobx-react';
import cx from 'classnames';
import { FieldConfig } from '../../types';
import AttributeValueItem from './AttributeValueItem';
import ShapeIcon from '../sidebar/ShapeIcon';
import InstanceItem from '../../model/InstanceItem';
import store from '../../store/RootStore';
import i18n from '../../locales';
import './InstanceAttributes.scss';

interface InstanceItemAttributesProps {
  instanceItem: InstanceItem;
  fieldsMap: { [fieldName: string]: FieldConfig };
}

const InstanceItemAttributes = observer(({ instanceItem, fieldsMap }: InstanceItemAttributesProps) => {
  // FIXME: use current camera cause multiple cameras not supported yet
  const { currentCamera, currentFrame, isSingleCamera, cameraNames } = store.frame;
  const cameraData = instanceItem.cameras[currentCamera];
  const { frames = {} } = cameraData || {};
  const frameData = frames[currentFrame];
  const { attributes } = frameData || {};
  const { shapeType } = frameData || frames[cameraData?.getNearestKeyFrame(currentFrame)] || {};
  const isEmpty = !frameData;
  const fieldKeys = Object.keys(fieldsMap || {});

  // refs
  const ref = useRef<HTMLDivElement>(null);

  const attrKeys = Object.keys(attributes || {});
  const legacyKeys = attrKeys.filter((key) => !fieldKeys.includes(key));

  return (
    <div className="section" ref={ref}>
      <div
        className={cx('section-title', {
          empty: isEmpty,
        })}
      >
        <div
          className="section-title__icon"
          style={{ color: instanceItem.categoryItemRef.displayColor }}
        >
          <ShapeIcon shapeType={shapeType} />
        </div>
        <div className="section-title__label">
          {`${instanceItem.itemLabel}${isSingleCamera ? '' : `-C${cameraNames.indexOf(currentCamera) + 1}`}`}
          {isEmpty && i18n.translate('EMPTY_LABEL')}
        </div>
      </div>
      {[...fieldKeys, ...legacyKeys].map((key) => attrKeys.includes(key) && (
        <AttributeValueItem
          key={key}
          fieldName={key}
          fieldsMap={fieldsMap}
          values={attributes}
        />
      ))}
    </div>
  );
});

export default InstanceItemAttributes;
