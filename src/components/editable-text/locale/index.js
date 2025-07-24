/* eslint-disable no-undef */
import { Language } from '../../../utils/constants';
import ZN from './zh-CN';
import EN from './en-US';
import JP from './ja-JP';
import KR from './ko-KR';

class Internationalization {
  locale = Language.EN_US;

  get isUS() {
    return this.locale === Language.EN_US;
  }

  setLocale = (locale) => {
    const languages = Object.values(Language);
    if (locale !== undefined) {
      // get from props
      if (languages.includes(locale)) {
        this.locale = locale;
      }
    } else if (navigator.language) {
      // get from browser
      const language = languages.find((l) => l.slice(0, 2) === navigator.language.slice(0, 2));
      if (language) {
        this.locale = language;
      }
    }
  };

  translate = (word, options) => {
    let translated;
    switch (this.locale) {
      case Language.ZH_CN:
        translated = ZN[word];
        break;
      case Language.JA_JP:
        translated = JP[word];
        break;
      case Language.KO_KR:
        translated = KR[word];
        break;
      default:
        translated = EN[word];
        break;
    }
    if (translated) {
      let msg = translated;
      if (options && options.values) {
        Object.keys(options.values).forEach((k) => {
          msg = msg.replace(new RegExp(`{${k}}`, 'g'), options.values[k]);
        });
      }
      return msg;
    }
    return word;
  };
}

const i18n = new Internationalization();

export const setLocale = i18n.setLocale;
export default i18n.translate;
