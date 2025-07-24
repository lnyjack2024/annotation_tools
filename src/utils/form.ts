import { utils } from '@appen-china/easy-form';
import { FormConfig, FieldValue, FieldOption, FieldControlType } from '@appen-china/easy-form/es/types';

export interface FieldConfig {
  name: string;
  type: FieldControlType;
  label?: string;
  options?: FieldOption[];
}

// eslint-disable-next-line import/prefer-default-export
export function triggerFormRules(config: FormConfig, values: any) {
  const { fields: configFields, conditions = [], effects = [], rules = [] } = config;
  const fields = (configFields || []).map((field) => ({
    ...field,
    ...values[field.name] !== undefined && {
      defaultValue: values[field.name],
    },
  }));

  const parsedValue = utils.parseFormFields(fields);
  // trigger rule effects
  const { updatedFields, updatedValues } = rules.reduce(
    (acc, curr) => utils.ruleTrigger(
      curr, acc.updatedFields, acc.updatedValues, fields, conditions, effects,
    ),
    { updatedFields: parsedValue.fields, updatedValues: parsedValue.initialValues },
  );

  // remove invisible values
  updatedFields.forEach((f) => {
    if (!f.visible) {
      delete updatedValues[f.name];
    }
  });
  return {
    updatedValues,
    updatedFields,
  };
}

/**
 * get field option label
 * @param value
 * @param options
 */
export function getFieldOptionLabel(value: FieldValue, options: FieldOption[]) {
  const option = options.find((o) => o.value === value);
  return option?.label || `${value}`;
}

/**
 * get field display label
 * @param value
 * @param field
 */
export function getFieldDisplayLabel(fieldValue: FieldValue | FieldValue[], field?: FieldConfig) {
  let displayValue = '';
  if (fieldValue !== undefined && fieldValue !== null) {
    if (field?.options) {
      displayValue = Array.isArray(fieldValue)
        ? `${fieldValue.map((v) => getFieldOptionLabel(v, field.options!))}`
        : getFieldOptionLabel(fieldValue, field.options);
    } else {
      displayValue = `${fieldValue}`;
    }
  }
  return displayValue;
}

/**
 * get field option item‘s reference url
 * @param value
 * @param field
 * @param keys match by keys order
 */
export function getReferenceImageUrl(fieldValue: FieldValue, field?: FieldConfig, keys: ('value' | 'label')[] = ['value']) {
  if (field?.type !== FieldControlType.RADIO) {
    return;
  }
  let referenceImage = '';
  if (fieldValue !== undefined && fieldValue !== null) {
    if (field?.options) {
      const option = field?.options.find((o) => {
        for (let index = 0; index < keys.length; index += 1) {
          const element = keys[index];
          if (o[element] === fieldValue) {
            return true;
          }
        }
        return false;
      });
      referenceImage = option?.referenceUrl || '';
    }
  }
  return referenceImage;
};


/**
 * parse fields (with options), return a name-field map
 * @param config
 */
export function parseFields(config?: FormConfig) {
  const map: { [fieldName: string]: FieldConfig } = {};
  (config?.fields || []).forEach((field) => {
    const { name, label, type, valueType, options = [] } = field;
    const newField: FieldConfig = { name, type, label };
    if (type === FieldControlType.RADIO || type === FieldControlType.SELECT || type === FieldControlType.CHECKBOX || type === FieldControlType.CASCADER) {
      // has options
      newField.options = utils.parseOptions(options, valueType);
    }
    map[name] = newField;
  });
  return map;
}
