import type { MouseEvent } from "react";
import React from "react";
import { useIntl } from "@umijs/max";
import type { WorkflowDataRecord } from "@/types/v3";

type Props = {
  record: WorkflowDataRecord;
  onClick?: (e: MouseEvent) => void;
};

const DataLocationColumn: React.FC<Props> = ({ record, onClick }) => {
  const { formatMessage } = useIntl();
  const { flowName, cycle } = record;

  if (!flowName) {
    return null;
  }

  return (
    <div style={{ color: "#42526e" }}>
      <a onClick={onClick}>
        <span
          style={{
            display: "inline-block",
            maxWidth: 150,
            textOverflow: "ellipsis",
            overflow: "hidden",
            whiteSpace: "nowrap",
            verticalAlign: "bottom",
          }}
          title={record.flowName}
        >
          {record.flowName}
        </span>
        <span style={{ marginLeft: 8 }}>
          {cycle
            ? `${formatMessage({ id: "qa-job.type" })}${cycle}`
            : `${formatMessage({ id: "labeling-job.type" })}1`}
        </span>
      </a>
    </div>
  );
};

export default DataLocationColumn;
