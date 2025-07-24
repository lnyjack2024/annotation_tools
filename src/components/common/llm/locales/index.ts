import { Language } from '../../../../utils/constants';
import CN from './zh-CN';
import US from './en-US';
import JP from './ja-JP';
import KR from './ko-KR';

export default function translate(locale: string, key: string, options?: any) {
  let message;
  switch (locale) {
    case Language.ZH_CN:
      message = CN[key];
      break;
    case Language.JA_JP:
      message = JP[key];
      break;
    case Language.KO_KR:
      message = KR[key];
      break;
    default:
      message = US[key];
      break;
  }
  if (message) {
    let msg = message;
    if (options && options.values) {
      Object.keys(options.values).forEach((k) => {
        msg = msg.replace(new RegExp(`{${k}}`, 'g'), options.values[k]);
      });
    }
    return msg;
  }
  return key;
}
