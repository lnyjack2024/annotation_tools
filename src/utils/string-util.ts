export function textTruncate(
  text: string,
  maxLength: number = 100,
  ending: string = '...',
): string {
  if (!text) {
    return '';
  }

  if (text.length > maxLength) {
    return text.substring(0, maxLength - ending.length) + ending;
  }
  return text;
}

export function base64Encode(value: any): string {
  return Buffer.from(JSON.stringify(value), 'utf-8').toString('base64');
}

export function base64Decode(base64Str: string) {
  let value;
  try {
    const str = Buffer.from(base64Str || '', 'base64').toString('utf-8');
    value = JSON.parse(str);
  } catch (e) {
    // parse error
  }
  return value;
}

export function isObject(thing: any) {
  return Object.prototype.toString.call(thing) === '[object Object]';
}

export function safeJsonParse(thing: string) {
  if (isObject(thing)) {
    return thing;
  }

  try {
    return JSON.parse(thing);
  } catch (e) {
    return undefined;
  }
}
