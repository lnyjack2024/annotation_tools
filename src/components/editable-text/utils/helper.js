/* eslint-disable no-useless-escape */
import { substr, strlen } from 'fbjs/lib/UnicodeUtils';
import { EditorState } from 'draft-js';
import { uniqueId } from 'lodash';

export const escapeCharacter = (str) => str.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');

const isEmoji = (str) => {
  // move to getSliceHead()
  // if (!/^([\uD83C|\uD83D|\uD83E][\uDC00-\uDFFF][\u200D|\uFE0F]|[\uD83C|\uD83D|\uD83E][\uDC00-\uDFFF]|[0-9|*|#]\uFE0F\u20E3|[0-9|#]\u20E3|[\u203C-\u3299]\uFE0F\u200D|[\u203C-\u3299]\uFE0F|[\u2122-\u2B55]|\u303D|[\A9|\AE]\u3030|\uA9|\uAE|\u3030)/.test(str)) return substr(str, 0, 1);
  const joiner = '\u{200D}';
  const split = str.split(joiner);
  let count = 0;
  // eslint-disable-next-line no-restricted-syntax
  for (const s of split) {
    // removing the variation selectors
    const num = Array.from(s.split(/[\ufe00-\ufe0f]|[\u2642]/).join('')).length;
    count += num;
  }
  // assuming the joiners are used appropriately
  return (count / split.length) === 1;
};

export const isArabic = (str) => (/^\s*[\u0600-\u06ff]+/g.test(str));

export const convertArrayToColor = (array) => array.map((item, index) => `${index ? '' : '#'}${Math.floor(item) < 16 ? '0' : ''}${Math.floor(item).toString(16)}`).join('');

export const convertColorToArray = (color) => ([
  parseInt(color.slice(1, 3), 16),
  parseInt(color.slice(3, 5), 16),
  parseInt(color.slice(5, 7), 16),
]);

// handle slice begin with emoji
export const getSliceHead = (str) => {
  // eslint-disable-next-line no-misleading-character-class
  if (!/^([\uD83C|\uD83D|\uD83E][\uDC00-\uDFFF][\u200D|\uFE0F]|[\uD83C|\uD83D|\uD83E][\uDC00-\uDFFF]|[0-9|*|#]\uFE0F\u20E3|[0-9|#]\u20E3|[\u203C-\u3299]\uFE0F\u200D|[\u203C-\u3299]\uFE0F|[\u2122-\u2B55]|\u303D|[\A9|\AE]\u3030|\uA9|\uAE|\u3030)/.test(str)) return str;
  const MAX_EMOJI_LENGTH = 8;
  const length = Math.min(strlen(str), MAX_EMOJI_LENGTH);
  for (let i = length; i > 0; i -= 1) {
    const head = substr(str, 0, i);
    if (isEmoji(head)) return head;
  }
  console.warning('getSliceHead: warning');
  return str;
};

export const setSelection = (editorState, start, end) => {
  let selection = editorState.getSelection();
  selection = selection.set('focusOffset', start).set('anchorOffset', end);
  editorState = EditorState.forceSelection(editorState, selection);
  return editorState;
};

export const closeSelection = (editorState) => {
  let selection = editorState.getSelection();
  selection = selection.set('anchorOffset', selection.get('focusOffset'));
  editorState = EditorState.forceSelection(editorState, selection);
  return editorState;
};

export const getTextByInsertion = (text, insertion) => {
  const length = strlen(text);
  if (insertion.at >= 5 && insertion.at <= length - 5) return `${substr(text, insertion.at - 5, 5)}*${insertion.value}*${substr(text, insertion.at, 5)}`;
  if (insertion.at >= 5) return `${substr(text, insertion.at - 5, 5)}*${insertion.value}*${substr(text, insertion.at, length - insertion.at)}`;
  if (insertion.at <= length - 5) return `${substr(text, 0, insertion.at)}*${insertion.value}*${substr(text, insertion.at, 5)}`;
  return `${substr(text, 0, insertion.at)}*${insertion.value}*${substr(text, insertion.at, length - insertion.at)}`;
};

// id manager
export const idManager = () => {
  const idList = [];
  return {
    generateID: (head) => {
      let id;
      do { id = uniqueId(`${head}_`); } while (idList.indexOf(id) !== -1);
      idList.push(id);
      return id;
    },
    clear: () => {
      idList.length = 0;
    },
    checkAndInsert: (id, head) => {
      if (!id || idList.indexOf(id) !== -1) return this.generateID(head);
      idList.push(id);
      return id;
    }
  };
};

// used to get wrapper dom from active dom
export const getTargetWrapperDataSet = (e) => {
  let target = e.target || e.srcElement;
  while (target.className.indexOf('wrapper') === -1) {
    target = target.parentNode;
  }
  return target.dataset;
};

export const getNextInLoopList = (list, src, step) => {
  let index = src + step;
  const len = list.length;
  while (index < 0) index += len;
  return list[index % len];
};

export function isElementInViewport(el, parentScollEl) {
  const rect = el.getBoundingClientRect();
  const top = rect.top + rect.height;
  const parentRect = parentScollEl.getBoundingClientRect();
  return (
    top > Math.max(parentRect.top, 0)
    && rect.left > Math.max(parentRect.left, 0)
    && top < Math.min(parentRect.top + parentRect.height, (window.innerHeight || document.documentElement.clientHeight))
    && rect.left < Math.min(parentRect.left + parentRect.width, (window.innerWidth || document.documentElement.clientWidth))
  );
}

export function getConfigByKeys(configMap, keys) {
  return configMap.get(keys?.join(':'));
}

export function generateConfigKeyByKeys(keys) {
  return keys?.join(':');
}
