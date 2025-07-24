import React, { useContext, useMemo } from 'react';
import EasyForm from '@appen-china/easy-form';
import { FormConfig } from '@appen-china/easy-form/es/types';
import { parseFields } from 'src/utils/form';
import { Button } from 'antd';
import { DeleteOutlined, FormOutlined } from '@ant-design/icons';
import AttributeValueItem from '../attributes-config/AttributeValueItem';
import LocaleContext from '../locales/context';
import translate from '../locales';

interface AttributesItemConfigProps {
  config: FormConfig;
  attributesEditing?: boolean;
  attributes?: {[key: string]: any};
  attributesEditable: boolean;
  onChange: (val: any) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const AttributesItemConfig: React.FC<AttributesItemConfigProps> = ({ config, attributes, attributesEditing, attributesEditable, onEdit, onDelete, onChange }) => {
  const locale = useContext(LocaleContext);
  const fieldsMap = useMemo(() => parseFields(config), [config]);
  // fields with initial value
  const fieldsWithInitialValue = useMemo(() => (config?.fields || []).map((field) => ({
    ...field,
    ...attributes && attributes[field.name] !== undefined && {
      defaultValue: attributes[field.name],
    }
  })), [config, attributes]);

  const handleValuesChange = (changedValues:any, values: any) => {
    if (!values || values.length === 0) {
      // empty form
      onChange(undefined);
    } else {
      onChange(values);
    }
  };

  const renderAttributes = () => {
    if (!config) {
      return null;
    }
    if (!attributes) {
      return (
        <div
          className="values-empty"
          onClick={(e) => {
            if (onEdit) {
              e.stopPropagation();
              onEdit();
            }
          }}
        >
          {translate(locale, 'CHAT_ATTR_EMPTY')}
        </div>
      );
    }
    const fieldKeys = Object.keys(fieldsMap);
    const attrKeys = attributes ? Object.keys(attributes) : [];
    const legacyKeys = attrKeys.filter((key) => !fieldKeys.includes(key));

    return (
      <>
        <div className="value-content">
          {
            [...fieldKeys, ...legacyKeys].map((key) => attrKeys.includes(key) && (
              <AttributeValueItem
                compact
                key={key}
                fieldName={key}
                fieldsMap={fieldsMap}
                values={attributes}
              />
            ))
          }
        </div>
        {attributesEditable && (
          <>
            <Button
              size="small"
              type="link"
              icon={<FormOutlined />}
              onClick={(e) => {
                if (onEdit) {
                  e.stopPropagation();
                  onEdit();
                }
              }}
            />
            <Button
              size="small"
              type="link"
              className="delete_btn"
              icon={<DeleteOutlined />}
              onClick={(e) => {
                if (onDelete) {
                  e.stopPropagation();
                  onDelete();
                }
              }}
            />
          </>
        )}
      </>
    );
  };

  return (
    <div className="llm-chat-item-content-attributes" onClick={(e) => { if (attributesEditing) { e.stopPropagation(); } }}>
      {attributesEditing ? (
        <EasyForm
          fields={fieldsWithInitialValue}
          conditions={config?.conditions}
          effects={config?.effects}
          rules={config?.rules}
          onChange={handleValuesChange}
          onSubmit={() => {}}
          footerVisible={false}
        />
      ) : renderAttributes()}
    </div>
  );
};
export default AttributesItemConfig;
