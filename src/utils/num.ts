import numeral from 'numeral';
import { DEFAULT_OCCUPY_STRING } from './constants';

numeral.zeroFormat('0%');
numeral.nullFormat(' - ');

export default numeral;

export function formatPercent(num: number | undefined, fixed = 2) {
  return numeral(num).format(`${(0).toFixed(fixed)}%`);
}

export function formatLocal(num: number | null | undefined) {
  if (typeof num !== 'number' || num === 0) {
    return DEFAULT_OCCUPY_STRING;
  }
  return num.toLocaleString();
}
