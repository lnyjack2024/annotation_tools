export const timeInterval = (pxPerSec) => {
  let retVal = 1;
  if (pxPerSec >= 1000) {
    retVal = 0.01;
  } else if (pxPerSec >= 500) {
    retVal = 0.02;
  } else if (pxPerSec >= 100) {
    retVal = 0.1;
  } else if (pxPerSec >= 50) {
    retVal = 0.2;
  } else if (pxPerSec >= 10) {
    retVal = 1;
  } else if (pxPerSec >= 5) {
    retVal = 12;
  } else if (pxPerSec >= 1) {
    retVal = 24;
  } else if (pxPerSec >= 0.5) {
    retVal = 120;
  } else if (pxPerSec >= 0.01) {
    retVal = 600;
  } else {
    retVal = Math.ceil(1 / pxPerSec) * 60;
  }
  return retVal;
};

export const primaryLabelInterval = (pxPerSec) => {
  return 5;
  // let retVal = 1;
  // if (pxPerSec >= 1000) {
  //     retVal = 50; // 0.01;
  // } else if (pxPerSec >= 500) {
  //     retVal = 10; // 0.02;
  // } else if (pxPerSec >= 100) {
  //     retVal = 5; // 0.1;
  // } else if (pxPerSec >= 50) {
  //     retVal = 5; // 0.2;
  // } else if (pxPerSec >= 10) {
  //     retVal = 5; // 1;
  // } else if (pxPerSec >= 5) {
  //     retVal = 5 // 20;
  // } else if (pxPerSec >= 1) {
  //     retVal = 10; // 30;
  // } else if (pxPerSec >= 0.5) {
  //     retVal = 10; // 120;
  // } else if (pxPerSec >= 0.01) {
  //     retVal = 15; // 6000;
  // } else {
  //     retVal = Math.ceil(1 / pxPerSec);
  // }
  // return retVal;
};

export const secondaryLabelInterval = (pxPerSec) => {
  return undefined;
};

export const formatTimeCallback = (secs, pxPerSec) => {
  let seconds = Number(secs);
  const minutes = Math.floor(seconds / 60);
  seconds = seconds % 60;

  // fill up seconds with zeroes
  let secondsStr = Math.round(seconds).toString();
  if (pxPerSec >= 25 * 10) {
    secondsStr = seconds.toFixed(2);
  } else if (pxPerSec >= 25 * 1) {
    secondsStr = seconds.toFixed(1);
  }

  if (minutes > 0) {
    if (seconds < 10) {
      secondsStr = '0' + secondsStr;
    }
    return `${minutes}:${secondsStr}`;
  }
  return secondsStr;
};
