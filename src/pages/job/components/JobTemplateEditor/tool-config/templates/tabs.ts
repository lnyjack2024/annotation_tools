export enum TabKey {
  BASIC_INFO = "basic-info",
  DATA_SOURCE = "data-source",
  LABEL_SUBJECT = "label-subject",
  LABEL_VIEW = "label-view",
  LABEL_ASSIST = "label-assist",
  LABEL_CHECK = "label-check",
  QA = "qa",
}

export interface TabItemConfig {
  key: string;
  titleKey: string;
  subTitleKey: string;
}

export interface TabItemsConfig {
  [key: string]: TabItemConfig;
}

export const tabsConfig = {
  [TabKey.BASIC_INFO]: {
    key: TabKey.BASIC_INFO,
    titleKey: "BASIC_TITLE",
    subTitleKey: "BASIC_SUB_TITLE",
  },
  [TabKey.DATA_SOURCE]: {
    key: TabKey.DATA_SOURCE,
    titleKey: "DATA_SOURCE_TITLE",
    subTitleKey: "DATA_SOURCE_SUB_TITLE",
  },
  [TabKey.LABEL_SUBJECT]: {
    key: TabKey.LABEL_SUBJECT,
    titleKey: "LABEL_SUBJECT_TITLE",
    subTitleKey: "LABEL_SUBJECT_SUB_TITLE_GENERAL_IMAGE",
  },
  [TabKey.LABEL_VIEW]: {
    key: TabKey.LABEL_VIEW,
    titleKey: "LABEL_VIEW_TITLE",
    subTitleKey: "LABEL_VIEW_SUB_TITLE",
  },
  [TabKey.LABEL_ASSIST]: {
    key: TabKey.LABEL_ASSIST,
    titleKey: "LABEL_ASSIST_TITLE",
    subTitleKey: "LABEL_ASSIST_SUB_TITLE",
  },
  [TabKey.LABEL_CHECK]: {
    key: TabKey.LABEL_CHECK,
    titleKey: "LABEL_CHECK_TITLE",
    subTitleKey: "LABEL_CHECK_SUB_TITLE",
  },
  [TabKey.QA]: {
    key: TabKey.QA,
    titleKey: "QA_TITLE",
    subTitleKey: "QA_SUB_TITLE",
  },
};
