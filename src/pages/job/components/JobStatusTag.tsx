import { Tag } from "antd";
import type { CSSProperties } from "react";
import { FormattedMessage } from "@umijs/max";

import type { JobStatus } from "@/types/job";
import type { WorkerJobStatus } from "@/types/task";
import { StatusTagColor } from "@/utils/constants";

interface JobStatusProps {
  status: JobStatus | WorkerJobStatus;
  style?: CSSProperties;
}

const defaultTagStyle: CSSProperties = {
  fontWeight: "bold",
  lineHeight: "22px",
  borderRadius: "4px",
};

export default function JobStatusTag({ status, style = {} }: JobStatusProps) {
  const tagColor = StatusTagColor[status] || StatusTagColor.DEFAULT;
  const { Icon, bgColor, fontColor } = tagColor;
  return (
    <Tag
      color={bgColor}
      style={{ ...defaultTagStyle, ...style, color: fontColor }}
    >
      <Icon style={{ marginRight: 4 }} />
      <FormattedMessage id={`job.status.${status}`} />
    </Tag>
  );
}
