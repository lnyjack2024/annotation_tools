import { EditOutlined } from "@ant-design/icons";
import { Button, Checkbox } from "antd";
import { useState } from "react";
import type { Job } from "@/types/job";
import { JobStatus } from "@/types/job";
import SampleRateSettingModal from "@/pages/job/job-detail/Qa/components/SampleRateSettingModal";
import { useIntl } from "@umijs/max";

interface Props {
  job: Job;
  readonly: boolean;
  updating: boolean;
  onUpdateJob: (params: any, callback?: () => void) => void;
}

function JobQaRule({ job, updating, readonly, onUpdateJob }: Props) {
  const { formatMessage } = useIntl();
  const [editable, setEditable] = useState(false);
  const {
    jobStatus,
    id,
    globalSampleRate,
    globalSampleSwitchOn,
    qaModifiable,
    showWorkerName,
  } = job || {};

  const handleJobUpdate = (key: string, value: boolean) => {
    onUpdateJob({ [key]: value });
  };

  return (
    <div style={{ padding: 24, borderBottom: "1px solid #dcdfe3" }}>
      <h3 style={{ fontWeight: "bold", color: "#42526e" }}>
        {formatMessage({ id: "workflow.job.qa.rule" })}
      </h3>
      <p style={{ color: "#42526e" }}>
        {globalSampleSwitchOn ? (
          <span>{`${formatMessage({
            id: "job.qa.set-rate.all",
          })} ${globalSampleRate}%`}</span>
        ) : (
          formatMessage({ id: "job.qa.set-rate.customized" })
        )}
        <Button
          type="link"
          style={{ padding: 0 }}
          icon={<EditOutlined />}
          onClick={() => setEditable(true)}
          disabled={readonly}
        />
      </p>
      <div style={{ marginBottom: 12 }}>
        <Checkbox
          disabled={jobStatus !== JobStatus.READY || updating}
          checked={qaModifiable}
          onChange={(e) => handleJobUpdate("qaModifiable", e.target.checked)}
        >
          {formatMessage({ id: "job.qa.create.form.qaModifiable" })}
        </Checkbox>
      </div>
      <div>
        <Checkbox
          disabled={jobStatus !== JobStatus.READY || updating}
          checked={showWorkerName}
          onChange={(e) => handleJobUpdate("showWorkerName", e.target.checked)}
        >
          {formatMessage({
            id: "labeling-job-create.wizard.overview.form.showWorkerName",
          })}
        </Checkbox>
      </div>
      <SampleRateSettingModal
        visible={editable}
        jobId={id}
        onClose={() => setEditable(false)}
      />
    </div>
  );
}

export default JobQaRule;
