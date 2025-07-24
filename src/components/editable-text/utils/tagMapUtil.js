import { substr } from 'fbjs/lib/UnicodeUtils';
import { isArabic, getConfigByKeys } from './helper';
import TagInfoMap from './TagInfoMap';
import { isQATag } from '../store/tag_mode';
import { TAG_HEIGHT, CONNECTION_DIR, DEFAULT_COLOR, FONT_SIZE, FONT_COLOR } from '../store/constant';

const genLabelsMap = (labelsConfig) => {
  const labelsMap = {};
  labelsConfig.forEach((item) => {
    labelsMap[item.text] = { bgColor: item.color, displayName: item.displayName || item.text };
  });
  return labelsMap;
};

const isContain = (item, resultItem) => (item.start >= resultItem.start) && (item.end <= resultItem.end);

const isContained = (item, resultItem) => (item.start <= resultItem.start) && (item.end >= resultItem.end);

export function genDisplayLabels(labels = [], labelsConfig = []) {
  const result = [];
  const labelsMap = genLabelsMap(labelsConfig);
  labels.forEach((label) => {
    let existed = false;
    const { value, text, type } = label;
    const newLabel = { ...label, displayName: labelsMap[value].displayName, realText: text, text: value, bgColor: labelsMap[value].bgColor, fontColor: isQATag(type) ? '#000000' : FONT_COLOR, children: [] };

    result.forEach((resultLabel, resultLabelIndex) => {
      if (isContain(newLabel, resultLabel)) {
        result[resultLabelIndex].children = [...resultLabel.children, newLabel];
        existed = true;
      } else if (isContained(newLabel, resultLabel)) {
        const newResultLabel = { ...newLabel, children: [...resultLabel.children] };
        delete result[resultLabelIndex].children;
        newResultLabel.children.push(resultLabel);
        result[resultLabelIndex] = { ...newResultLabel };
        existed = true;
      }
    });
    if (!existed) {
      result.push(newLabel);
    }
  });
  return result;
}

export function renderTagMap(tagMap, spanMap) {
  const { labels, insertions, connections } = tagMap;
  Object.entries(labels).forEach(([id, label]) => {
    const span = spanMap.get(label.head);
    label.top += span?.offsetTop || 0;
    label.left += label.isArabic ? span?.offsetWidth || 0 : 0;
  });
  Object.entries(insertions).forEach(([id, insertion]) => {
    const span = spanMap.get(insertion.head);
    insertion.top += span?.offsetTop || 0 + 7;
  });
  Object.entries(connections).forEach(([id, connection]) => {
    const span = spanMap.get(connection.head);
    connection.top += span?.offsetTop || 0;
    connection.path = getPath(connection.from, connection.to, connection);
  });
}

const tagWidthCache = {};

const calcWidth = (text) => {
  if (tagWidthCache[text]) {
    return tagWidthCache[text];
  }
  const div = document.createElement('div');
  div.style.cssText = 'position:absolute;visibility:hidden;width:auto;height:auto';
  div.style.fontSize = '12px';
  let width = 80;
  try {
    document.body.appendChild(div);
    div.innerText = text;
    width = div.offsetWidth;
    document.body.removeChild(div);
  } catch (e) {
    //
  }
  const adjustedWidth = width + 12;
  tagWidthCache[text] = adjustedWidth;
  return adjustedWidth;
};

export function genTagMap(results, configMap, spanMap, occupyMap, text) {
  const { labels, insertions, connections } = results;
  const tagMap = new TagInfoMap();

  labels.forEach((label) => {
    const arabic = isArabic(substr(text, label.start, label.end - label.start));
    const span = spanMap.get(label.start);
    if (span) {
      const occupyList = occupyMap.get(span.offsetTop);
      const occupy = { top: -TAG_HEIGHT, left: span.offsetLeft, text: label.value };
      // position occupied
      while (occupyList.filter((item) => (item.top === occupy.top && Math.abs(occupy.left - item.left) < calcWidth(item.text))).length > 0) {
        occupy.top -= TAG_HEIGHT;
      }
      occupyList.push(occupy);
      const configInfo = getConfigByKeys(configMap, label.keys);
      tagMap.setItem(label.id, {
        head: label.start,
        top: occupy.top,
        left: occupy.left,
        text: label.value,
        displayName: label.displayName || configInfo.displayName || label.value,
        bgColor: isQATag(label.type) ? '#ffffff' : configInfo.color,
        fontColor: isQATag(label.type) ? '#000000' : FONT_COLOR,
        id: label.id,
        type: label.type,
        isArabic: arabic,
        isReview: label.isReview,
      });
    }
  });
  insertions.forEach((insertion) => {
    const span = spanMap.get(insertion.at);
    if (span) {
      const occupyList = occupyMap.get(span.offsetTop);
      const occupy = { top: FONT_SIZE, left: span.offsetLeft, text: insertion.value };
      // position occupied
      while (occupyList.filter((item) => (item.top === occupy.top && Math.abs(occupy.left - item.left) < calcWidth(item.text))).length > 0) occupy.top += TAG_HEIGHT;
      occupyList.push(occupy);
      const configInfo = getConfigByKeys(configMap, insertion.keys);
      tagMap.setItem(insertion.id, {
        head: insertion.at,
        top: occupy.top,
        left: occupy.left,
        text: insertion.value,
        displayName: insertion.displayName || configInfo.displayName || insertion.value,
        id: insertion.id,
        type: insertion.type,
        bgColor: getConfigByKeys(configMap, insertion.keys)?.color,
        fontColor: isQATag(insertion.type) ? '#000000' : FONT_COLOR,
        isReview: insertion.isReview,
      });
    }
  });
  try {
    connections.forEach((connection, index) => {
      const from = tagMap.getItem(connection.fromId, connection.fromType);
      const to = tagMap.getItem(connection.toId, connection.toType);
      if (!from || !to) {
        throw new Error('BreakException');
      }
      const span = spanMap.get(Math.min(from.head, to.head));
      if (span) {
        const occupyList = occupyMap.get(span.offsetTop);
        let top = Math.min(from.top, to.top) - 2 * TAG_HEIGHT; // occupyList.map((item) => item.top).sort((a, b) => (a - b)).shift() - TAG_HEIGHT;
        if (top > -TAG_HEIGHT) top = -2 * TAG_HEIGHT;
        const occupy = { top, /* left: (from.left + to.left) / 2, */ left: Math.min(from.left, to.left), right: Math.max(to.left, from.left), text: connection.value };
        while (occupyList.filter((item) => (
          item.top === occupy.top &&
          (
            (item.right && item.right - item.left > TAG_HEIGHT * 2) ?
              !(occupy.left >= item.right || occupy.right <= item.left) :
              occupy.left <= item.left + calcWidth(item.text) && occupy.right >= item.left - calcWidth(item.text)
          )
        )).length > 0) occupy.top -= 2 * TAG_HEIGHT;
        occupyList.push(occupy);
        const configInfo = getConfigByKeys(configMap, connection.keys);
        tagMap.setItem(connection.id, {
          head: Math.min(from.head, to.head),
          from,
          to,
          dir: from.left <= to.left ? CONNECTION_DIR.LEFT : CONNECTION_DIR.RIGHT,
          top: occupy.top,
          left: (from.left + to.left) / 2,
          text: connection.value,
          displayName: connection.displayName || configInfo.displayName || connection.value,
          id: connection.id,
          type: connection.type,
          bgColor: DEFAULT_COLOR,
          fontColor: isQATag(connection.type) ? '#000000' : FONT_COLOR,
          isReview: connection.isReview,
        });
      }
    });
  } catch (error) {
    if (error.message !== 'BreakException') throw error;
  }
  return tagMap;
}
export function genTagMap1(results, configMap, spanMap, occupyMap, text) {
  const { labels, insertions, connections } = results;
  const tagMap = new TagInfoMap();

  labels.forEach((label) => {
    const arabic = isArabic(substr(text, label.start, label.end - label.start));
    const span = spanMap.get(label.start);
    if (span) {
      const occupyList = occupyMap.get(span.offsetTop);
      const occupy = { top: -TAG_HEIGHT, left: span.offsetLeft, text: label.value };
      // position occupied
      while (occupyList.filter((item) => (item.top === occupy.top && Math.abs(occupy.left - item.left) < calcWidth(item.text))).length > 0) {
        occupy.top -= TAG_HEIGHT;
      }
      occupyList.push(occupy);
      const configInfo = configMap.get(label.value);
      tagMap.setItem(label.id, {
        head: label.start,
        top: occupy.top,
        left: occupy.left,
        text: label.value,
        displayName: label.displayName || configInfo.displayName || label.value,
        bgColor: isQATag(label.id) ? '#ffffff' : configInfo.color,
        fontColor: isQATag(label.id) ? '#000000' : FONT_COLOR,
        id: label.id,
        isArabic: arabic,
        isReview: label.isReview,
      });
    }
  });
  insertions.forEach((insertion) => {
    const span = spanMap.get(insertion.at);
    if (span) {
      const occupyList = occupyMap.get(span.offsetTop);
      const occupy = { top: FONT_SIZE, left: span.offsetLeft, text: insertion.value };
      // position occupied
      while (occupyList.filter((item) => (item.top === occupy.top && Math.abs(occupy.left - item.left) < calcWidth(item.text))).length > 0) occupy.top += TAG_HEIGHT;
      occupyList.push(occupy);
      const configInfo = configMap.get(insertion.value);
      tagMap.setItem(insertion.id, {
        head: insertion.at,
        top: occupy.top,
        left: occupy.left,
        text: insertion.value,
        displayName: insertion.displayName || configInfo.displayName || insertion.value,
        id: insertion.id,
        bgColor: configMap.get(insertion.value).color,
        fontColor: isQATag(insertion.id) ? '#000000' : FONT_COLOR,
        isReview: insertion.isReview,
      });
    }
  });
  try {
    connections.forEach((connection) => {
      const from = tagMap.getItem(connection.fromId, connection.fromType);
      const to = tagMap.getItem(connection.toId, connection.toType);
      if (!from || !to) {
        throw new Error('BreakException');
      }
      const span = spanMap.get(Math.min(from.head, to.head));
      if (span) {
        const occupyList = occupyMap.get(span.offsetTop);
        let top = Math.min(from.top, to.top) - 2 * TAG_HEIGHT; // occupyList.map((item) => item.top).sort((a, b) => (a - b)).shift() - TAG_HEIGHT;
        if (top > -TAG_HEIGHT) top = -2 * TAG_HEIGHT;
        const occupy = { top, /* left: (from.left + to.left) / 2, */ left: Math.min(from.left, to.left), right: Math.max(to.left, from.left), text: connection.value };
        while (occupyList.filter((item) => (
          item.top === occupy.top &&
          (
            (item.right && item.right - item.left > TAG_HEIGHT * 2) ?
              !(occupy.left >= item.right || occupy.right <= item.left) :
              occupy.left <= item.left + calcWidth(item.text) && occupy.right >= item.left - calcWidth(item.text)
          )
        )).length > 0) occupy.top -= 2 * TAG_HEIGHT;
        occupyList.push(occupy);
        const configInfo = configMap.get(connection.value);
        tagMap.setItem(connection.id, {
          head: Math.min(from.head, to.head),
          from,
          to,
          dir: from.left <= to.left ? CONNECTION_DIR.LEFT : CONNECTION_DIR.RIGHT,
          top: occupy.top,
          left: (from.left + to.left) / 2,
          text: connection.value,
          displayName: connection.displayName || configInfo.displayName || connection.value,
          id: connection.id,
          bgColor: DEFAULT_COLOR,
          fontColor: isQATag(connection.id) ? '#000000' : FONT_COLOR,
          isReview: connection.isReview,
        });
      }
    });
  } catch (error) {
    if (error.message !== 'BreakException') throw error;
  }
  return tagMap;
}

const getPath = (from, to, middle) => {
  if (from.left < middle.left - 50) return `M ${from.left} ${from.top} Q ${from.left} ${middle.top + TAG_HEIGHT / 2}, ${middle.left - 50} ${middle.top + TAG_HEIGHT / 2} L ${middle.left + 50} ${middle.top + TAG_HEIGHT / 2} Q ${to.left} ${middle.top + TAG_HEIGHT / 2}, ${to.left} ${to.top}`;
  if (from.left > middle.left + 50) return `M ${from.left} ${from.top} Q ${from.left} ${middle.top + TAG_HEIGHT / 2}, ${middle.left + 50} ${middle.top + TAG_HEIGHT / 2} L ${middle.left - 50} ${middle.top + TAG_HEIGHT / 2} Q ${to.left} ${middle.top + TAG_HEIGHT / 2}, ${to.left} ${to.top}`;
  if (from.left < to.left) return `M ${from.left} ${from.top} Q ${middle.left - 50} ${from.top}, ${middle.left - 50} ${middle.top + TAG_HEIGHT / 2} L ${middle.left + 50} ${middle.top + TAG_HEIGHT / 2} Q ${middle.left + 50} ${to.top}, ${to.left} ${to.top}`;
  return `M ${from.left} ${from.top} Q ${middle.left + 50} ${from.top}, ${middle.left + 50} ${middle.top + TAG_HEIGHT / 2} L ${middle.left - 50} ${middle.top + TAG_HEIGHT / 2} Q ${middle.left - 50} ${to.top}, ${to.left} ${to.top}`;
};
