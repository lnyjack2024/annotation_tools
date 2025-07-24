import type { CSSProperties, ReactNode } from 'react';
import type * as moment from 'moment';
import type { Moment } from 'moment';

export type BaseResp<T> = {
  message: string;
  status: number;
  traceId: string;
  time: string;
  data: T;
};

export type CommonType = {
  key: string;
  value: number;
};

export interface PageQuery {
  pageIndex: number;
  pageSize: number;
}

export enum FormItemType {
  Single = 'Single',
  Multiple = 'Multiple',
  Text = 'Text',
  Cascader = 'Cascader',
  CascaderMultiple = 'CascaderMultiple',
  DateRanger = 'DateRanger',
  Radio = 'Radio',
}

export interface FormItem {
  key: string;
  type: FormItemType;
  label?: string | ReactNode;
  placeholder?: string;
  onChange?: (val: any) => void;
  loading?: boolean;
  style?: CSSProperties;
  disabled?: boolean;
  options?: any;
  optionLabel?: (val: any) => string | ReactNode;
  optionLabelKey?: string;
  optionValueKey?: string;
  allowClear?: boolean;
  fieldNames?: Record<string, any>;
  maxTagCount?: number;
  disabledDate?: (current: moment.Moment | null) => boolean;
  showSearch?: boolean | Record<string, any>;
  optionFilterProp?: string;
}

export type RangePickerValue = Moment[];

export interface ModalCommonProp {
  visible: boolean;
  onCancel: () => void;
}

export enum ReportType {
  REPORT = 'REPORT',
  // PROCESS = 'PROCESS', // 结构化数据报告
}

export enum ReportContentItem {
  ORIGIN_DATA = 'ORIGIN_DATA',
  FINAL_RESULT_DATA = 'FINAL_RESULT_DATA',
  RESULT_DATA = 'RESULT_DATA',
  SIMPLE_PROCESS_DATA = 'SIMPLE_PROCESS_DATA',
  LABELING_NUM = 'LABELING_NUM',
  ALL_PROCESS_DATA = 'ALL_PROCESS_DATA',
  FIRST_LABELING_RESULT_DATA = 'FIRST_LABELING_RESULT_DATA',
}

export enum DaysTrendsType {
  THIS_WEEK = 'THIS_WEEK',
  THIS_MONTH = 'THIS_MONTH',
  THIS_YEAR = 'THIS_YEAR',
  SO_FAR = 'SO_FAR',
  DAY7 = 'DAY7',
  DAY30 = 'DAY30',
  DAYNOW = 'DAYNOW',
  DATERANGE = 'DATERANGE',
}

export enum LANGUAGE_LOCALES {
  ZH_CN = 'zh-CN',
}

export const LanguageConfigMap = new Map([
  [
    LANGUAGE_LOCALES.ZH_CN,
    {
      label: '简体中文',
      icon: '🇨🇳',
      lang: LANGUAGE_LOCALES.ZH_CN,
      docLang: 'zh',
      editorLang: 'zh_CN',
      humanizeLang: 'zh_CN',
      ticketLang: 'chineseTranslation',
    },
  ],
]);
