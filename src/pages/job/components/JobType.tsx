import { TagsOutlined, MonitorOutlined } from "@ant-design/icons";
import { FormattedMessage } from "@umijs/max";

import { JobType } from "@/types/job";

interface JobTypeProps {
  type: JobType;
  showText?: boolean;
}

export const jobTypeInfo = {
  [JobType.LABEL]: {
    Icon: TagsOutlined,
    label: "labeling-job.type",
  },
  [JobType.QA]: {
    Icon: MonitorOutlined,
    label: "qa-job.type",
  },
};

export default function JobTypeComponent({
  type = JobType.LABEL,
  showText = true,
}: JobTypeProps) {
  const { Icon, label = "labeling-job.type" } = jobTypeInfo[type] || {};

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {Icon && <Icon style={{ fontSize: 20, paddingRight: 10 }} />}
      {showText && <FormattedMessage id={label} />}
    </div>
  );
}
