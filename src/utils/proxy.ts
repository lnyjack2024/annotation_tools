import { DEFAULT_OCCUPY_STRING } from './constants';

export function VMMapProxy(target: Map<string | number, string>) {
  return (key: string | number) => target.get(key) || DEFAULT_OCCUPY_STRING;
}

export function simpleProxy(
  target: number | string | boolean | undefined | null,
) {
  return ['', undefined, null].includes(target as any)
    ? DEFAULT_OCCUPY_STRING
    : (target as string);
}
