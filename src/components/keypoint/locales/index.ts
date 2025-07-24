import { Language } from '../../../utils/constants';
import CN from './zh-CN';
import US from './en-US';
import JP from './ja-JP';
import KR from './ko-KR';

class I18n {
  locale = Language.EN_US;

  get isUS() {
    return this.locale === Language.EN_US;
  }

  setLocale = (locale?: string) => {
    const languages = Object.values(Language);
    if (locale !== undefined) {
      // get from props
      if (languages.includes(locale as Language)) {
        this.locale = locale as Language;
      }
    } else if (navigator.language) {
      // get from browser
      const language = languages.find((l) => l.slice(0, 2) === navigator.language.slice(0, 2));
      if (language) {
        this.locale = language;
      }
    }
  };

  translate = (word: string) => {
    let translated;
    switch (this.locale) {
      case Language.ZH_CN:
        translated = CN[word];
        break;
      case Language.JA_JP:
        translated = JP[word];
        break;
      case Language.KO_KR:
        translated = KR[word];
        break;
      default:
        translated = US[word];
        break;
    }
    return translated;
  };
}

export const i18n = new I18n();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function formatMessage(key: string, options: any = {}) {
  const message = i18n.translate(key);
  if (message) {
    let msg = message;
    if (options.values) {
      Object.keys(options.values).forEach((k) => {
        msg = msg.replace(new RegExp(`{${k}}`, 'g'), options.values[k]);
      });
    }
    return msg;
  }
  return key;
}
