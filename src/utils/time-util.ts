import type { Moment } from "moment";
import moment from "moment";
import humanizeDuration from "humanize-duration";
import { getLocale } from "@umijs/max";

import { LanguageConfigMap, LANGUAGE_LOCALES } from "@/types/common";

export function dateFormat(
  dt: string | Moment,
  formatStr: string = "YYYY-MM-DD HH:mm"
): string {
  if (!dt) {
    return "-";
  }
  return moment(dt).format(formatStr);
}

export function getISOStringDay(
  dt: string | Moment,
  point: "endOf" | "startOf" = "startOf",
  type = "YYYY-MM-DD"
): string {
  if (!dt) {
    return null;
  }
  return moment(dt)[point]("day").format(type);
}

export function mongoDateFormat(
  dt: string,
  formatStr: string = "YYYY-MM-DD HH:mm"
): string {
  if (!dt) {
    return "-";
  }
  return moment
    .utc(dt)
    .utcOffset(new Date().getTimezoneOffset() / -60)
    .format(formatStr);
}

export function humanizeSeconds(
  seconds: number,
  largest: number = 1,
  units: string[] = ["h", "m", "s"],
  maxDecimalPoints: number = 2
): string {
  return humanizeDuration(seconds * 1000, {
    language: getLocale() === "zh-CN" ? "zh_CN" : "en",
    largest,
    units,
    maxDecimalPoints,
  });
}

const ONE_DAY_SECONDS = 86400;

const DEFAULT_HUMANIZE_LANG = "shortEn";

const shortEnglishHumanizer = humanizeDuration.humanizer({
  spacer: "",
  delimiter: "",
  language: DEFAULT_HUMANIZE_LANG,
  units: ["d", "h", "m"],
  maxDecimalPoints: 0,
  languages: {
    shortEn: {
      y: () => "y",
      mo: () => "mo",
      w: () => "w",
      d: () => "d",
      h: () => "h",
      m: () => "m",
      s: () => "s",
      ms: () => "ms",
    },
  },
});

export function shortHumanizeSeconds(
  seconds: number,
  units: string[] = ["d", "h", "m"]
) {
  return shortEnglishHumanizer(seconds * 1000, {
    language: LanguageConfigMap.get(getLocale() || LANGUAGE_LOCALES.ZH_CN)
      .humanizeLang,
    largest: seconds > ONE_DAY_SECONDS ? 1 : 2,
    units,
  });
}
