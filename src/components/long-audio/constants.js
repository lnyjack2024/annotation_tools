import { utils } from '@appen-china/easy-form';
import i18n from './locales';

// eslint-disable-next-line import/prefer-default-export
export const playMode = [
  'regionPlay',
  'regionLoop',
  'overallLoop',
];
export const segmentType = {
  overlap: 'Overlap',
  speaking: 'Speaking',
  noise: 'Noise',
};
export const defaultColor = {
  defaultAlpha: 0.5,
  darkGray: '#2D2A34FF',
  defaultGray: '#FFFFFF35',
  defaultRed: '#FF0000FF',
  defaultGreen: '#00FF00FF',
  defaultWhite: '#FFFFFF99',
  defaultBlue: '#0000FFFF',
};
export const attributeType = {
  segment: 'segment',
  line: 'line',
};

/**
 * format in minutes:seconds:milliseconds, for example, 00:00:000
 * @param second
 * @returns {string}
 */
export const formatTimestamp = (second) => {
  if (!second || isNaN(second)) {
    return '00:00.000';
  }
  const arr = [];
  arr.push(`${Math.floor(second / 60)}`.padStart(2, '0'));
  second -= arr[0] * 60;
  arr.push(`${Math.floor(second)}`.padStart(2, '0'));
  second -= arr[1];
  arr.push(second.toFixed(3).toString().slice(2));
  return `${arr[0]}:${arr[1]}.${arr[2]}`; // arr.join(':');
};

export const translate = (word) => i18n.translate(word);

export const shortText = (str = '', length = 18) => {
  const text = Array.isArray(str) ? str.join(',') : str;
  const len = strlen(text);
  if (len > length) {
    let strLen = 0;
    let realLen = 0;
    for (let i = 0; i < text.length; i += 1) {
      const c = text.charCodeAt(i);
      if ((c >= 0x0001 && c <= 0x007e) || (c >= 0xff60 && c <= 0xff9f)) {
        realLen += 1;
      } else {
        realLen += 2;
      }
      if (realLen > length) {
        break;
      } else {
        strLen += 1;
      }
    }
    return `${text.substring(0, strLen)}...`;
  }
  return text;
};

export const strlen = (str = '') => {
  let len = 0;
  for (let i = 0; i < str.length; i += 1) {
    const c = str.charCodeAt(i);
    if ((c >= 0x0001 && c <= 0x007e) || (c >= 0xff60 && c <= 0xff9f)) {
      len += 1;
    } else {
      len += 2;
    }
  }
  return len;
};

export const tagType = {
  tag: 'tag',
  standalone: 'standalone',
};

export const SegmentMode = {
  continuous: 'continuous',
  individual: 'individual',
};

export const triggerForm = (config, values = {}) => {
  const { fields: configFields, conditions = [], effects = [], rules = [] } = config;
  const fields = (configFields || []).map((field) => ({
    ...field,
    ...values[field.name] !== undefined && {
      defaultValue: values[field.name],
    },
  }));

  const parsedValue = utils.parseFormFields(fields);
  // trigger rule effects
  const { updatedValues: triggerValues, updatedFields } = rules.reduce(
    (acc, curr) => utils.ruleTrigger(
      curr, acc.updatedFields, acc.updatedValues, fields, conditions, effects,
    ),
    { updatedFields: parsedValue.fields, updatedValues: parsedValue.initialValues },
  );

  const updatedValues = {
    ...triggerValues
  };
  updatedFields.filter((f) => f.visible === false).forEach((f) => {
    if (f.name !== 'ef-ontology') {
      updatedValues[f.name] = undefined;
    }
  });
  return {
    updatedValues,
    updatedFields,
  };
};

export const validateForm = (config, values = {}) => {
  // trigger rule effects
  const { updatedFields } = triggerForm(config, values);

  const displayFields = updatedFields.filter((i) => i.visible);

  Object.keys(values).forEach((field) => {
    if (!displayFields.find((i) => i.name === field)) {
      // remove the key
      delete values[field];
    }
  });

  for (let i = 0; i < displayFields.length; i += 1) {
    const field = displayFields[i];
    const value = values[field.name];
    if (field.required && (value === undefined || value === null || value === '')) {
      return false;
    }
  }

  return true;
};

export const ValidDurationMode = {
  attributes: 'attributes',
  translations: 'translations',
};

export const StyleConfigMode = {
  segment: 'segment_attr',
  line: 'line_attr',
};

export const getConfigColor = (attributes = {}, groups = []) => {
  let color = '';
  for (let i = 0; i < groups.length; i += 1) {
    const { fill_color: fillColor, attributes: condition } = groups[i];
    const isInclude = Object.keys(condition).every((key) => (Array.isArray(attributes[key]) ? attributes[key].sort() : attributes[key])?.toString()
      ===
      (Array.isArray(condition[key]) ? condition[key].sort() : condition[key]).toString());
    if (isInclude) {
      color = fillColor || '';
    }
  }
  return color;
};
