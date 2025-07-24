export enum ToolMode {
  LABELING = 'LABELING',
  REWORK = 'REWORK',
  QA_RO = 'QA_RO',
  QA_RW = 'QA_RW',
  AUDIT = 'AUDIT',
  AUDIT_RW = 'AUDIT_RW',
  PREVIEW = 'PREVIEW',
  TEMPLATE_PREVIEW = 'TEMPLATE_PREVIEW',
}

export function isLabel(mode: ToolMode) {
  return mode === ToolMode.LABELING || mode === ToolMode.REWORK;
}

export function isQA(mode: ToolMode) {
  return mode === ToolMode.QA_RO || mode === ToolMode.QA_RW;
}

export function isReviewEditable(mode: ToolMode) {
  return isQA(mode) || mode === ToolMode.AUDIT;
}

export function isAnnotationReadonly(mode: ToolMode) {
  return mode === ToolMode.QA_RO || mode === ToolMode.AUDIT || mode === ToolMode.PREVIEW;
}

export function isRework(mode: ToolMode) {
  return mode === ToolMode.REWORK;
}

export function isPreview(mode: ToolMode) {
  return mode === ToolMode.PREVIEW;
}

export function isTemplatePreview(mode: ToolMode) {
  return mode === ToolMode.TEMPLATE_PREVIEW;
}
