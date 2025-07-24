import { parse, stringify } from "querystring";

import { formatMessage, getDvaApp, getLocale } from "umi";
import qs from "qs";

import { JobType } from "@/types/job";
import type { Status } from "@/types";
import { TemplateType } from "@/types/template";
import type { TemplateScope, WorkflowDataRecord } from "@/types/v3";
import { getMashupAPIPrefix } from "@/utils/env";
import { ProjectDataDetail } from "@/services/project";
import { OriginalFileUploadStatus } from "@/types/project";
import { ProjectTemplateBase } from "@/pages/job/components/JobTemplateEditor/tool-config/templates/types";

export const SPLIT_REG = /[,\s]/g;

export const MAX_UNFINISHED_NUM = 0.9999;

export const deprecatedWorker = "deprecated$#$";

export const getPageQuery = () => parse(window.location.href.split("?")[1]);

export function mapStatusToErrorMessage(resp: Status): string {
  const { status = 500, message: errorMessage } = resp || {};
  return formatMessage({ id: status.toString(), defaultMessage: errorMessage });
}

export function openTemplatePreviewPageV3(params: {
  templateId: string;
  projectId?: string;
  scope?: TemplateScope;
  projectDisplayId?: string;
  source?: string;
}) {
  window.open(
    `${getMashupAPIPrefix()}/ssr/template-preview?${new URLSearchParams({
      ...params,
      locale: getLocale(),
    })}`,
    "_blank"
  );
}

export function openWorkerTaskPageV3(
  jobType: JobType,
  jobId: string,
  flowId: string,
  title: string,
  projectId: string
) {
  const locale = getLocale();
  let url = `${getMashupAPIPrefix()}/ssr/tdl?${stringify({
    jobId,
    jobType,
    dataSource: "task",
    locale,
    tdlId: jobId,
  })}`;
  if (jobType === JobType.QA) {
    url = `${getMashupAPIPrefix()}/ssr/qa-task-start?${stringify({
      jobId,
      jobType,
      locale,
      flowId,
      title,
      projectId,
    })}`;
  } else if (jobType === JobType.LABEL) {
    url = `${getMashupAPIPrefix()}/ssr/annotation-task-start?${stringify({
      jobId,
      jobType,
      locale,
      flowId,
      title,
      projectId,
    })}`;
  }

  window.open(url, "_blank");
}

export function openDataPreviewPage(
  projectId: string,
  record: WorkflowDataRecord | ProjectDataDetail,
  role: "bpo" | "pm" = "pm"
) {
  const query = {
    recordId: `${record.recordId}`,
    projectId,
    role,
    flowId: record.flowId,
    locale: getLocale(),
    dataOperLogId: record.dataOperLogId,
  };

  window.open(
    `${getMashupAPIPrefix()}/ssr/data-preview?${qs.stringify(query)}`,
    "_blank"
  );
}

export function downloadFile(params: {
  url?: string;
  dataSteam?: any;
  fileName?: string;
  newTab?: boolean;
}) {
  const { url, dataSteam, fileName, newTab = false } = params;
  const alink = document.createElement("a");

  if (url) {
    alink.href = url;
  }
  if (dataSteam) {
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), dataSteam], {
      type: "application/octet-stream;charset=utf-8",
    });
    alink.href = URL.createObjectURL(blob);
  }
  if (fileName) {
    alink.download = fileName;
  }
  if (newTab) {
    alink.target = "_blank";
  }
  document.body.appendChild(alink);
  alink.click();
  setTimeout(() => {
    document.body.removeChild(alink);
  }, 500);
}

export function hasOntology(templateType: TemplateType): boolean {
  return (
    templateType === TemplateType.LIDAR ||
    templateType === TemplateType.LIDAR_SSE ||
    templateType === TemplateType.TEXT ||
    templateType === TemplateType.TRANSCRIPTION ||
    templateType === TemplateType.LANDMARK ||
    templateType === TemplateType.GENERAL_IMAGE
  );
}

export function validateOntology(
  templateType: TemplateType,
  data: any
): boolean {
  if (data === undefined) return true; // skip validate

  const validateDuplicate = (arr: any[], attributes: string[] = []) => {
    let valid = true;
    let skip = false;
    for (let i = 0; i < arr.length - 1 && !skip; i += 1) {
      for (let j = i + 1; j < arr.length && !skip; j += 1) {
        if (
          attributes.some(
            (attribute) =>
              arr[i][attribute] &&
              arr[j][attribute] &&
              arr[i][attribute] === arr[j][attribute]
          )
        ) {
          valid = false;
          skip = true;
        }
      }
    }
    return valid;
  };

  switch (templateType) {
    case TemplateType.LIDAR:
    case TemplateType.LIDAR_SSE:
    case TemplateType.GENERAL_IMAGE:
    case TemplateType.LANDMARK:
    case TemplateType.TRANSCRIPTION: {
      if (!Array.isArray(data)) {
        return false;
      }
      return validateDuplicate(data, ["key", "class_name"]);
    }
    case TemplateType.TEXT: {
      return [
        "labelCategories",
        "connectionCategories",
        "insertionCategories",
      ].every((name) => {
        if (!data[name]) {
          return true;
        }
        if (!Array.isArray(data[name])) {
          return false;
        }
        return validateDuplicate(data[name], ["key", "class_name"]);
      });
    }
    default:
      return false;
  }
}

export function formatOptOutWorker(worker: string, workerId: string) {
  if (worker === deprecatedWorker) {
    return formatMessage({ id: "common.unknown.worker" }, { workerId });
  }
  return worker;
}

export function formatToPercentage(num: number) {
  if (num === 0) {
    return "0.00";
  }

  if (!num) {
    return "0.00";
  }

  const val = Number(num * 100).toFixed(2);

  return `${val}`;
}

export function toPercentage(val: number, withPercentSign: boolean = true) {
  const suffix = withPercentSign ? " %" : "";

  if (val === 0) {
    return `0.00${suffix}`;
  }

  if (!val) {
    return "-";
  }

  let str = Number(val * 100).toFixed(2);

  if (val > MAX_UNFINISHED_NUM && val < 1) {
    str = Number(MAX_UNFINISHED_NUM * 100).toFixed(2);
  }

  return `${str}${suffix}`;
}

export function convertQueryToBool(
  queryParam: string | string[] | undefined | null
) {
  if (Array.isArray(queryParam)) {
    throw new Error(`invalid query parameter ${queryParam}`);
  }
  return (queryParam || false).toString() === "true";
}

export const COLORS = [
  "#5187F3",
  "#01B97F",
  "#FDB314",
  "#6B5BE5",
  "#FF610F",
  "#B7BF4E",
  "#FCE4D9",
  "#FFF088",
  "#A0AABC",
  "#7A869A",
  "#2AC2CB",
  "#FE63B9",
  "#F56C6C",
  "#50538F",
  "#8383D8",
  "#E1DEFA",
  "#C3ECEC",
  "#174186",
  "#5370B6",
  "#B4A3A6",
];

export function getHashLastSegment() {
  return window.location.hash.split("/").pop();
}

export function isMatchedLastPathSegment(targetSegment: string) {
  return getHashLastSegment() === targetSegment;
}

export function isNil(val: any) {
  return (
    val === null ||
    val === undefined ||
    (Array.isArray(val) && val.length === 0)
  );
}

export function isTemplateSupportAuditDetails(templateType: TemplateType) {
  return (
    templateType === TemplateType.LIDAR ||
    templateType === TemplateType.LIDAR_SSE ||
    templateType === TemplateType.GENERAL_IMAGE ||
    templateType === TemplateType.LANDMARK
  );
}

export const getReportPassStatus = () => {
  return Promise.resolve();
};

export function copyTextToClipboard(text: string) {
  const dom: HTMLTextAreaElement = document.createElement("textarea");
  dom.value = text;
  dom.style.position = "fixed";
  document.body.appendChild(dom);
  dom.focus();
  dom.select();

  let success: boolean;
  try {
    document.execCommand("copy");
    success = true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("unable to copy", err);
    success = false;
  }

  document.body.removeChild(dom);
  return success;
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // eslint-disable-next-line no-mixed-operators
  return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

export function getUploadingFileCount() {
  const uploadProgress = getDvaApp()._store.getState().uploadProgress;
  return Object.keys(uploadProgress).filter(
    (key) =>
      uploadProgress[key].status === OriginalFileUploadStatus.RAW_DATA_UPLOADING
  ).length;
}

export function queryToSearch(query: Record<string, any>) {
  return qs.stringify(query);
}

export const getTemplateTitleWithI18n = (template: ProjectTemplateBase) => {
  try {
    const options = JSON.parse(template.options);
    return options?.locale[getLocale()]?.title || template.title;
  } catch (error) {
    return template.title;
  }
};
