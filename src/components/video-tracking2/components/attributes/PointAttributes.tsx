import React, { useRef, useState } from 'react';
import { toJS } from 'mobx';
import { observer } from 'mobx-react';
import cx from 'classnames';
import { Up, Pencil } from '../../../common/icons';
import AttributeValueItem from './AttributeValueItem';
import store from '../../store/RootStore';
import i18n from '../../locales';
import { parseFields } from '../../utils';
import { PolygonData } from '../../../common/shapes/Polygon';
import { LineData } from '../../../common/shapes/Line';
import './PointAttributes.scss';

const PointAttributes = observer(() => {
  const [collapsed, setCollapsed] = useState(false);

  // refs
  const ref = useRef<HTMLDivElement>(null);

  const { selectedShapes, selectedPointIndex } = store.shape;
  if (selectedShapes.length !== 1 || selectedPointIndex < 0) {
    // no selected point
    return null;
  }

  const selectedShape = selectedShapes[0];
  const { instanceItem } = store.shape.shapes[selectedShape.uid];
  const frameData = instanceItem.cameras[store.frame.currentCamera].frames[store.frame.currentFrame];
  if (!frameData) {
    return null;
  }

  const { pointLabelConfig } = instanceItem.categoryItemRef;
  if (!pointLabelConfig) {
    // no config
    return null;
  }

  const pointUserData = toJS(frameData.shape as PolygonData | LineData).points[selectedPointIndex]?.userData || {};

  const fieldsMap = parseFields(pointLabelConfig);
  const attrKeys = Object.keys(pointUserData);
  const fieldKeys = Object.keys(fieldsMap);

  const renderAttrs = () => {
    const legacyKeys = attrKeys.filter((key) => !fieldKeys.includes(key));
    return (
      <div>
        {[...fieldKeys, ...legacyKeys].map((key) => attrKeys.includes(key) && (
          <AttributeValueItem
            key={key}
            fieldName={key}
            fieldsMap={fieldsMap}
            values={pointUserData}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={cx('collapse-panel point-attributes-panel', { collapsed })} ref={ref}>
      <div
        className="collapse-panel-title space-between"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span>
          <div className="collapse-panel-collapse-icon">
            <Up />
          </div>
          {i18n.translate('POINT_ATTRIBUTES')}
        </span>
        <span>
          {!store.readonly && (
            <div
              className="collapse-panel-icon"
              onClick={(e) => {
                e.stopPropagation();
                store.config.setPointAttributesModalVisible(true);
              }}
            >
              <Pencil />
            </div>
          )}
        </span>
      </div>
      <div className="collapse-panel-content">
        <div className="point-title">{i18n.translate('POINT_INDEX_LABEL', { values: { index: selectedPointIndex + 1 } })}</div>
        {renderAttrs()}
      </div>
    </div>
  );
});

export default PointAttributes;
