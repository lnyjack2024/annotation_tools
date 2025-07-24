<<<<<<< HEAD
export * from './proxy';
export * from './safeFetch';
export * from './utils';
export * from './num';
export * from './request';
export * from './constants';
export * from './validator';
export * from './env';
export * from './authority';
export * from './storage';
export * from './string-util';
export * from './time-util';
=======
import * as alawmulaw from 'alawmulaw';
import { parseAlawPcmToAudioData } from './pcm';
import { Language } from './constants';
import { RunningMode } from '../types';
import * as storage from './storage';

export const store = storage;
export function checkRunningMode() {
  let inIframe = false;
  try {
    inIframe = window.self !== window.top;
  } catch (e) {
    inIframe = false;
  }
  return inIframe ? RunningMode.IFRAME : RunningMode.STANDALONE;
}

export function getLocale(locale?: string): Language {
  const languages = Object.values(Language);
  if (locale !== undefined) {
    // get from provided string
    if (languages.includes(locale as Language)) {
      return locale as Language;
    }
  }
  if (navigator.language) {
    // get from browser
    const language = languages.find((l) => l.slice(0, 2) === navigator.language.slice(0, 2));
    if (language) {
      return language;
    }
  }
  return Language.EN_US;
}

export function fetchResultByUrl(url: string) {
  return new Promise((resolve, reject) => {
    fetch(url, {
      cache: 'no-store',
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        reject(new Error('http request error'));
      })
      .then((data) => resolve(data))
      .catch((e) => reject(e));
  });
}

export function preloadImage(src: string, crossOrigin = '') {
  const img = new Image();
  img.crossOrigin = crossOrigin;
  img.src = src;
}

export function isAppenCloud() {
  const { hostname } = window.location;
  return hostname.endsWith('.appen.com.cn');
}

export function getOrigin() {
  const { origin } = window.location;
  switch (origin) {
    case 'https://tools-dev.appen.com.cn':
    case 'http://tools.devk.appen.com.cn':
      return 'https://request-proxy-dev.appen.com.cn';
    case 'https://tools-stg.appen.com.cn':
    case 'http://tools.stg.appen.com.cn':
      return 'https://request-proxy-stg.appen.com.cn';
    case 'https://tools.appen.com.cn':
      return 'https://request-proxy.appen.com.cn';
    default:
  }
  return '';
}

export function getAPIGateway() {
  const { origin } = window.location;
  switch (origin) {
    case 'https://tools-dev.appen.com.cn':
      return 'https://ui-dev.appen.com.cn/api-gw';
    case 'https://tools-stg.appen.com.cn':
      return 'https://ui-stg.appen.com.cn/api-gw';
    case 'https://tools.appen.com.cn':
      return 'https://ui.appen.com.cn/api-gw';
    default:
  }
  return '/api-gw';
}

export function runScript(id: string, annotation: string, data?: string) {
  const origin = getOrigin();
  return new Promise((resolve) => {
    fetch(`${origin}/ai/v2/script/invoke?id=${id}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        annotation,
        data,
      }),
    }).then((resp) => {
      if (resp.status !== 200) {
        resolve({ error: `Failed to run script: ${id}` });
      }
      return resp.json();
    }).then((res) => {
      if (res.data && res.data.status === 'SUCCESS') {
        try {
          const parsedData = JSON.parse(res.data.result);
          resolve(parsedData);
        } catch (e) {
          resolve({ error: `Failed to parse result for script: ${id}` });
        }
      }
      resolve({ error: `Failed to run script: ${id}` });
    }).catch(() => {
      resolve({ error: `Failed to run script: ${id}` });
    });
  });
}

export const setStyle = (el: HTMLElement, styles: { [key: string]: any }) => {
  Object.keys(styles).forEach((prop) => {
    if ((el.style as any)[prop] !== styles[prop]) {
      (el.style as any)[prop] = styles[prop];
    }
  });
  return el;
};

export function wordCount(words?: string, wordCountItems?: string[]) {
  return getWords(words, wordCountItems).length;
}

export function getWords(str?: string, wordCountItems?: string[]) {
  const words: string[] = [];
  let wordStart = 0;
  if (typeof str !== 'string') return words;
  let strLen = 0;
  const regStr = (wordCountItems && wordCountItems.length > 0) ? wordCountItems.map((i) => `\\p{${i}}`).join('|') : '';
  const reg = regStr ? new RegExp(regStr, 'u') : undefined;
  for (let i = 0; i < str.length; i += 1) {
    const c = str.charAt(i);
    if (
      c.match(/[\u2E80-\u2FDF\u3040-\u318F\u31A0-\u31BF\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FFF\uA960-\uA97F\uAC00-\uD7FF|\u3002|\uff1f|\uff01|\uff0c|\u3001|\uff1b|\uff1a|\u201c|\u201d|\u2018|\u2019|\uff08|\uff09|\u300a|\u300b|\u3008|\u3009|\u3010|\u3011|\u300e|\u300f|\u300c|\u300d|\ufe43|\ufe44|\u3014|\u3015|\u2026|\u2014|\uff5e|\ufe4f|\uffe5]/)
      || (reg && c.match(reg))
    ) {
      if (strLen > 0) {
        words.push(str.slice(wordStart, wordStart + strLen));
      }
      wordStart = i + 1;
      strLen = 0;
      words.push(c);
    } else if (c && !c.match(/\r|\n|\s|\\s/)) {
      strLen += 1;
    } else if (!c || c.match(/\r|\n|\s|\\s/)) {
      if (strLen > 0) {
        words.push(str.slice(wordStart, wordStart + strLen));
      }
      strLen = 0;
      wordStart = i + 1;
    }
  }
  if (strLen > 0) {
    words.push(str.slice(wordStart, wordStart + strLen));
  }
  return words;
}

export const isInput = () => (document.activeElement as HTMLFormElement).tagName === 'INPUT' &&
  ((document.activeElement as HTMLFormElement).type === 'text' || (document.activeElement as HTMLFormElement).type === 'number') ||
  (document.activeElement as HTMLFormElement).tagName === 'TEXTAREA' || document.activeElement?.getAttribute('contenteditable') === 'true';

export const lawToWav = (buffer: ArrayBuffer, format: 'alaw' | 'ulaw') => {
  const alawOriginData = new Uint8Array(buffer);
  const decodeAlaw = format === 'alaw' ?
    alawmulaw.alaw.decode(alawOriginData) :
    alawmulaw.mulaw.decode(alawOriginData);
  const audioBuffer = parseAlawPcmToAudioData(decodeAlaw.buffer);
  return audioBuffer;
};

export function escapeRegExp(str: string) {
  // eslint-disable-next-line no-useless-escape
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

export function isEasyformSelectDropdown(ele: HTMLElement) {
  if (ele) {
    const easyformSelectDropdownList = Array.from(document.querySelectorAll('.easyform-select-dropdown'));
    const findEasyFormParent =
      easyformSelectDropdownList && easyformSelectDropdownList.find((item: Element) => item.contains(ele));
    return !!findEasyFormParent;
  }
  return false;
};

export function containsRTLLanguage(text = '') {
  // https://en.wikipedia.org/wiki/Arabic_script_in_Unicode
  return Array.from(text).some((c) => {
    const code = c.codePointAt(0);
    return code !== undefined && (
      (code >= 0x0600 && code <= 0x06ff) ||
      (code >= 0x0750 && code <= 0x077f) ||
      (code >= 0x08a0 && code <= 0x08ff) ||
      (code >= 0xfb50 && code <= 0xfdff) ||
      (code >= 0xfe70 && code <= 0xfeff) ||
      (code >= 0x10e60 && code <= 0x10e7f) ||
      (code >= 0x1ec70 && code <= 0x1ecbf) ||
      (code >= 0x1ed00 && code <= 0x1ed4f) ||
      (code >= 0x1ee00 && code <= 0x1eeff)
    );
  });
}

export const copyTextToClipboard = async (text: string) => new Promise(async (resolve, reject) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      resolve(true);
    } else {
      const input = document.createElement('textarea');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      if (document.execCommand('copy')) {
        document.execCommand('copy');
        resolve(true);
      } else {
        reject();
      }
      input.blur();
      document.body.removeChild(input);
    }
  } catch (error) {
    reject(error);
  }
});

export function getFileExtension(url: string) {
  return url.split('?').shift()!.split('.').pop()?.toLocaleLowerCase();
}
>>>>>>> origin/master
