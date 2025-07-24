import React from 'react';
import { FieldControlType } from '@appen-china/easy-form/es/types';
import { FieldConfig } from '../../types';
import { getFieldDisplayLabel } from '../../utils';
import './InstanceAttributes.scss';

interface AttributeValueItemProps {
  fieldName: string;
  fieldsMap: { [fieldName: string]: FieldConfig };
  values: any;
}

const AttributeValueItem = ({ fieldName, fieldsMap, values = {} }: AttributeValueItemProps) => {
  const field = (fieldsMap || {})[fieldName];
  const fieldValue = values[fieldName];
  const displayValue = getFieldDisplayLabel(fieldValue, field);

  return (
    <div
      className="value-item"
    >
      <div className="value-item-label">
        {field?.label || field?.name || fieldName}
      </div>
      <div className="value-item-value">
        {
          field?.type === FieldControlType.IMAGETEXT
            // eslint-disable-next-line react/no-danger
            ? <div dangerouslySetInnerHTML={{ __html: displayValue }} />
            : displayValue
        }
      </div>
    </div>
  );
};

export default AttributeValueItem;
