import React, { useEffect, useState, useMemo, useImperativeHandle, forwardRef } from 'react';
import { Base64 } from 'js-base64';
import EasyForm from '@appen-china/easy-form';
import { FormConfig } from '@appen-china/easy-form/es/types';
import { validate } from '@appen-china/easy-form/es/utils';
import { parseFields } from 'src/utils/form';
import AttributeValueItem from './AttributeValueItem';
import './AttributesConfig.scss';

interface AttributesConfigProps {
  config: string;
  onChange: (val: any) => void;
  disabled?: boolean;
  value?: {[key: string]: any};
}
export interface AttributesConfigHandle {
  validateForm: () => boolean;
}

const AttributesConfig = forwardRef<AttributesConfigHandle, AttributesConfigProps>(({ config: defaultConfig, value: attributes, onChange, disabled }, ref) => {
  if (!defaultConfig) {
    return null;
  }
  const [formConfig, setFormConfig] = useState<FormConfig>();

  useEffect(() => {
    const configStr = Base64.decode(defaultConfig || '');
    if (configStr) {
      try {
        const parsedConfig = JSON.parse(configStr);
        setFormConfig(parsedConfig);
      } catch (error) {
        // parse error
        setFormConfig(undefined);
      }
    } else {
      setFormConfig(undefined);
    }
  }, [defaultConfig]);

  const fieldsMap = useMemo(() => parseFields(formConfig), [formConfig]);
  // fields with initial value
  const fieldsWithInitialValue = useMemo(() => (formConfig?.fields || []).map((field) => ({
    ...field,
    readonly: disabled || field.readonly,
    ...attributes && attributes[field.name] !== undefined && {
      defaultValue: attributes[field.name],
    }
  })), [formConfig, attributes]);

  const handleValuesChange = (changedValues:any, values: any) => {
    if (!values || values.length === 0) {
      // empty form
      onChange(undefined);
    } else {
      onChange(values);
    }
  };

  const validateForm = () => {
    if (formConfig) {
      if (!attributes) {
        return false;
      }
      return validate(formConfig, attributes);
    }
    return true;
  };

  useImperativeHandle(ref, () => ({
    validateForm
  }));

  const renderAttributes = () => {
    const fieldKeys = Object.keys(fieldsMap);
    const attrKeys = attributes ? Object.keys(attributes) : [];
    const legacyKeys = attrKeys.filter((key) => !fieldKeys.includes(key));

    return (
      <>
        {
          [...fieldKeys, ...legacyKeys].map((key) => attrKeys.includes(key) && (
            <AttributeValueItem
              key={key}
              fieldName={key}
              fieldsMap={fieldsMap}
              values={attributes}
            />
          ))
        }
      </>
    );
  };

  return (
    <div className="llm-attributes-config">
      {!disabled ? (
        <EasyForm
          fields={fieldsWithInitialValue}
          conditions={formConfig?.conditions}
          effects={formConfig?.effects}
          rules={formConfig?.rules}
          onChange={handleValuesChange}
          onSubmit={() => {}}
          footerVisible={false}
        />
      ) : renderAttributes()}
    </div>
  );
});
export default AttributesConfig;
