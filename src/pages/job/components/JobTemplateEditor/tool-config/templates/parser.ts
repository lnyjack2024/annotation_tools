import { base64Decode } from "@/utils/string-util";

export function parseBoolean(value: unknown, defaultValue: boolean) {
  if (defaultValue) {
    return value !== "false" && value !== false;
  }
  return value === "true" || value === true;
}

export function parseNumber(
  value: unknown,
  defaultValue: number,
  options?: {
    min?: number;
    max?: number;
  }
) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  let num = Number(value);
  if (Number.isNaN(num)) {
    return defaultValue;
  }

  if (options?.min !== undefined) {
    num = Math.max(options.min, num);
  }
  if (options?.max !== undefined) {
    num = Math.min(options.max, num);
  }
  return num;
}

export function parseOption(
  value: unknown,
  defaultValue?: string | string[],
  options?: string[]
) {
  if (Array.isArray(defaultValue)) {
    // array
    let arr;
    if (typeof value === "string") {
      arr = value
        .split(",")
        .map((i: string) => i.trim())
        .filter((i: string) => !!i);
    } else if (Array.isArray(value)) {
      arr = value.map((i: string) => `${i}`);
    }
    if (!arr) {
      // no config
      return defaultValue;
    }
    return arr.filter((i: string) => !options || options.includes(i));
  }

  return !options || options.includes(`${value}`) ? `${value}` : defaultValue;
}

export function parseBase64Str(value: unknown) {
  if (typeof value === "string") {
    return base64Decode(value);
  }
  return undefined;
}
