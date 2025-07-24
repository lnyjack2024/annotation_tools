import { TAG } from '../types';

export function isInsertion(mode) {
  if (!mode) return false;
  return mode.indexOf(TAG.INSERTION) !== -1;
}

export function isConnection(mode) {
  if (!mode) return false;
  return mode.indexOf(TAG.CONNECTION) !== -1;
}

export function isLabel(mode) {
  if (!mode) return false;
  return mode.indexOf(TAG.LABEL) !== -1;
}

export function isQATag(mode) {
  if (!mode) return false;
  return mode.indexOf('QA') !== -1;
}
