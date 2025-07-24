import React from 'react';
import { FieldControlType } from '@appen-china/easy-form/es/types';
import cx from 'classnames';
import { FieldConfig, getFieldDisplayLabel, getReferenceImageUrl } from '../../../../utils/form';
import './AttributeValueItem.scss';

interface AttributeValueItemProps {
  fieldName: string;
  fieldsMap: { [fieldName: string]: FieldConfig };
  values: any;
  onValueClick?: (fieldName: string) => void;
  compact?: boolean;
}

const AttributeValueItem = ({ fieldName, fieldsMap, values = {}, onValueClick, compact = false }: AttributeValueItemProps) => {
  const field = (fieldsMap || {})[fieldName];
  const fieldValue = values[fieldName];
  const displayValue = getFieldDisplayLabel(fieldValue, field);

  const referenceImageRender = () => {
    const referenceImageUrl = getReferenceImageUrl(fieldValue, field, ['value', 'label']);
    if (referenceImageUrl) {
      return (
        <div className="ocr-snapshot" style={{ verticalAlign: 'middle', width: 120, height: 120, backgroundImage: `url(${referenceImageUrl})` }} />
      );
    }
    return null;
  };

  return (
    <div className={cx('llm-attributes-item', { inline: compact })}>
      {!compact && (
        <div className="llm-attributes-item-label">
          {field?.label || field?.name || fieldName}
          :
        </div>
      )}
      <div
        className="llm-attributes-item-value"
        onMouseDown={(e) => {
          e.stopPropagation();
          if (onValueClick && field?.name) {
            onValueClick(field.name);
          }
        }}
      >
        {
            field?.type === FieldControlType.IMAGETEXT
              // eslint-disable-next-line react/no-danger
              ? <div dangerouslySetInnerHTML={{ __html: displayValue }} />
              : <span>{displayValue}</span>
        }
        {referenceImageRender()}
      </div>
      {compact && (displayValue || referenceImageRender()) && (<div style={{ paddingRight: 8 }}>;</div>)}
    </div>
  );
};

export default AttributeValueItem;
