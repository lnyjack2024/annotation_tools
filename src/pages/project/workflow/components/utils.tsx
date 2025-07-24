import type { CSSProperties } from "react";
import type { ColumnProps } from "antd/lib/table";
import { FormattedMessage } from "@umijs/max";

import type { JobWorkersV3ResultItem, LabelingWorker } from "@/types";
import { WorkerJobStatus } from "@/types";

export function genOptions<T extends { statusList: string }>(params: T) {
  const { statusList: option, ...rest } = params;
  const statusList =
    option === WorkerJobStatus.ALL
      ? [
          WorkerJobStatus.CONFIRMED,
          WorkerJobStatus.DETAINED,
          WorkerJobStatus.REJECT,
          WorkerJobStatus.ASSIGNED,
          WorkerJobStatus.DECLINED,
        ]
      : [params.statusList];
  return {
    ...rest,
    statusList,
  };
}

export const cardHeadStyle = (width: number = 364) => ({
  width,
  color: "#42526e",
  fontSize: 14,
});

function getColumns<T>(): ColumnProps<T>[] {
  return [
    {
      title: <FormattedMessage id="common.user.nickname" />,
      render: (record) => (
        <>
          <div style={{ margin: 0, color: "#42526e", fontWeight: "bold" }}>
            {record.uniqueName || record.labelWorkerUniqueName}
          </div>
          {record.workerEmail && (
            <div
              style={{ marginLeft: 0, fontWeight: "normal", color: "#7a869a" }}
            >
              {record.workerEmail}
            </div>
          )}
        </>
      ),
    },
    {
      title: <FormattedMessage id="common.status" />,
      width: 130,
      render: (record) => (
        <FormattedMessage
          id={`workflow.worker.status.${(
            record.status || record.labelWorkerStatus
          )?.toLowerCase()}`}
        />
      ),
    },
  ];
}
export function getStatusColor(active: boolean | number | string) {
  return active ? "#227a7a" : "#b2b8c2";
}
export const [qaCols, workerCols] = [
  getColumns<JobWorkersV3ResultItem>(),
  getColumns<LabelingWorker>(),
];

export const pageInitOptions = {
  pageIndex: 0,
  pageSize: 10,
};
export const filterStyle = {
  display: "flex",
  justifyContent: "space-around",
  flexWrap: "nowrap",
} as CSSProperties;

type SelectorInfo = {
  keys?: string[]; // all keys received
  items?: LabelingWorker[]; //all items handled
};
type ActionType = {
  type: "init" | "select" | "clear" | "reset";
  payload?: Partial<SelectorInfo>;
};
export const initSelectedInfo: SelectorInfo = {
  keys: [],
  items: [],
};

export function map2ruleLines(map: Map<string, string[]>) {
  return [...map.entries()].reduce(
    (list, [key, values]) => list.concat(values.map((value) => [value, key])),
    []
  );
}
export function reducer(
  state: SelectorInfo,
  { type, payload }: ActionType
): SelectorInfo {
  switch (type) {
    case "init":
    case "reset":
    case "select":
      return payload;
    case "clear":
      return {
        ...initSelectedInfo,
      };
    default:
      return state;
  }
}
