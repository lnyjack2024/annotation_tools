export const formatTime = (time) => [formatHour(time), formatMinute(time), formatSecond(time), formatMillisecond(time)].join(':');

export const randomColor = () => {
  const rgb = new Array(3);
  for (let i = 0; i < 3; i += 1) {
    rgb[i] = Math.floor(Math.random() * 255).toString(16);
    if (rgb[i].length === 1) rgb[i] = `0${rgb[i]}`;
  }
  return `#${rgb.join('')}`;
};

export const parseTime = (str) => {
  const arr = str.split(':');
  const time = parseInt(arr[0], 10) * 3600 + parseInt(arr[1], 10) * 60 + parseInt(arr[2], 10) + parseInt(arr[3], 10) / 1000;
  if (Number.isNaN(time)) return null;
  return time;
};

export const formatHour = (time) => {
  const hour = parseInt(time / 3600, 10).toString();
  if (!time && time !== 0) return '--';
  return hour.padStart(2, '0');
};

export const formatMinute = (time) => {
  const min = (parseInt(time / 60, 10) % 60).toString();
  if (!time && time !== 0) return '--';
  return min.padStart(2, '0');
};

export const formatSecond = (time) => {
  const sec = parseInt(time % 60, 10).toString();
  if (!time && time !== 0) return '--';
  return sec.padStart(2, '0');
};

export const formatMillisecond = (time) => {
  const msec = (time - parseInt(time, 10)).toFixed(3).split('.').pop();
  if (msec === 'NaN') return '---';
  return msec;
};

export const simpleClone = (obj) => {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    return {};
  }
};

/**
 *
 * @param {Array} distances [left, top, right, bottom]
 * @param {Number} deviation distance to border
 */
export const getResizeAction = (distances, deviation) => {
  const action = [];
  const sortDis = distances.slice().sort((a, b) => a - b);
  const firstSmall = distances.indexOf(sortDis[0]);
  const secondSmall = distances.indexOf(sortDis[1]);
  if (distances[firstSmall] <= deviation) {
    action.push(firstSmall);
  }
  if (action.length && distances[secondSmall] <= deviation) {
    if (Math.abs(firstSmall - secondSmall) !== 2) action.push(secondSmall);
  }
  return action;
};

export const clamp = (num, min, max) => Math.min(Math.max(min, num), max);

export const sortPosition = (position) => {
  const tmp = position.slice();
  position.forEach((p, i) => {
    if (i < 2) {
      position[i] = Math.min(p, tmp[i + 2]);
    } else {
      position[i] = Math.max(p, tmp[i - 2]);
    }
  });
};
